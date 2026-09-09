-- ============================================================
-- MIGRATION: Transactional Notification Outbox Foundation
-- Timestamp: 20260909183000
-- Reference: docs/NOTIFICATIONS_DESIGN.md
-- ============================================================

-- 1. NOTIFICATION OUTBOX TABLE
CREATE TABLE IF NOT EXISTS public.notification_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    appointment_id uuid NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    channel text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    idempotency_key text NOT NULL,
    scheduled_for timestamptz NOT NULL DEFAULT now(),
    attempt_count integer NOT NULL DEFAULT 0,
    last_attempt_at timestamptz NULL,
    delivered_at timestamptz NULL,
    failed_at timestamptz NULL,
    cancelled_at timestamptz NULL,
    failure_code text NULL,
    provider_message_id text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Event type constraint
    CONSTRAINT notification_outbox_event_type_check CHECK (
        event_type IN (
            'appointment.created',
            'appointment.confirmed',
            'appointment.cancelled',
            'appointment.rescheduled',
            'appointment.reminder_due',
            'appointment.completed',
            'appointment.no_show'
        )
    ),

    -- Channel constraint
    CONSTRAINT notification_outbox_channel_check CHECK (
        channel IN ('email', 'whatsapp', 'sms')
    ),

    -- Status constraint
    CONSTRAINT notification_outbox_status_check CHECK (
        status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'dead_letter')
    ),

    -- Attempt count constraint
    CONSTRAINT notification_outbox_attempt_count_check CHECK (
        attempt_count >= 0
    ),

    -- Idempotency uniqueness constraint
    CONSTRAINT notification_outbox_idempotency_key_key UNIQUE (idempotency_key)
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_notification_outbox_queue 
    ON public.notification_outbox (status, scheduled_for) 
    WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_outbox_shop_created 
    ON public.notification_outbox (barbershop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_appointment_id 
    ON public.notification_outbox (appointment_id);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if exist
DROP POLICY IF EXISTS "notification_outbox_owner_select" ON public.notification_outbox;
DROP POLICY IF EXISTS "notification_outbox_no_anon_all" ON public.notification_outbox;

-- Authenticated Owners can read notification delivery records for their own shop only
CREATE POLICY "notification_outbox_owner_select"
ON public.notification_outbox
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.barbershop_members
        WHERE barbershop_members.barbershop_id = notification_outbox.barbershop_id
          AND barbershop_members.profile_id = auth.uid()
          AND barbershop_members.role = 'owner'
          AND barbershop_members.active = true
    )
);

-- Note: No INSERT, UPDATE or DELETE policies are granted to authenticated users.
-- Mutations are restricted exclusively to SECURITY DEFINER functions or server workers.

-- 4. CONTROLLED ENQUEUE FUNCTION
CREATE OR REPLACE FUNCTION public.enqueue_notification_event(
    p_barbershop_id uuid,
    p_appointment_id uuid,
    p_event_type text,
    p_channel text DEFAULT 'whatsapp',
    p_scheduled_for timestamptz DEFAULT now(),
    p_delivery_bucket text DEFAULT 'default',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_appt_shop_id uuid;
    v_idempotency_key text;
    v_event record;
    v_clean_bucket text;
    v_sanitized_metadata jsonb;
BEGIN
    -- 1. Validate barbershop_id
    IF p_barbershop_id IS NULL THEN
        RAISE EXCEPTION 'OUTBOX_MISSING_BARBERSHOP_ID';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.barbershops WHERE id = p_barbershop_id AND active = true) THEN
        RAISE EXCEPTION 'OUTBOX_BARBERSHOP_NOT_FOUND';
    END IF;

    -- 2. Validate event_type
    IF p_event_type NOT IN (
        'appointment.created',
        'appointment.confirmed',
        'appointment.cancelled',
        'appointment.rescheduled',
        'appointment.reminder_due',
        'appointment.completed',
        'appointment.no_show'
    ) THEN
        RAISE EXCEPTION 'OUTBOX_INVALID_EVENT_TYPE';
    END IF;

    -- 3. Validate channel
    IF p_channel NOT IN ('email', 'whatsapp', 'sms') THEN
        RAISE EXCEPTION 'OUTBOX_INVALID_CHANNEL';
    END IF;

    -- 4. Validate appointment tenant integrity (when appointment_id is present)
    IF p_appointment_id IS NOT NULL THEN
        SELECT barbershop_id INTO v_appt_shop_id
        FROM public.appointments
        WHERE id = p_appointment_id;

        IF v_appt_shop_id IS NULL THEN
            RAISE EXCEPTION 'OUTBOX_APPOINTMENT_NOT_FOUND';
        END IF;

        IF v_appt_shop_id != p_barbershop_id THEN
            RAISE EXCEPTION 'OUTBOX_CROSS_TENANT_REJECTED';
        END IF;
    END IF;

    -- 5. Format safe non-PII idempotency key
    v_clean_bucket := COALESCE(NULLIF(trim(p_delivery_bucket), ''), 'default');
    v_idempotency_key := COALESCE(p_appointment_id::text, p_barbershop_id::text) || ':' || p_event_type || ':' || p_channel || ':' || v_clean_bucket;

    -- 6. Prepare sanitized operational metadata (reject/strip PII)
    v_sanitized_metadata := jsonb_build_object(
        'event_version', COALESCE(p_metadata->>'event_version', '1.0.0'),
        'delivery_bucket', v_clean_bucket,
        'source_op', COALESCE(p_metadata->>'source_op', 'system'),
        'template_key', COALESCE(p_metadata->>'template_key', p_event_type)
    );

    -- 7. Insert outbox event idempotently
    INSERT INTO public.notification_outbox (
        barbershop_id,
        appointment_id,
        event_type,
        channel,
        status,
        idempotency_key,
        scheduled_for,
        metadata
    ) VALUES (
        p_barbershop_id,
        p_appointment_id,
        p_event_type,
        p_channel,
        'pending',
        v_idempotency_key,
        COALESCE(p_scheduled_for, now()),
        v_sanitized_metadata
    )
    ON CONFLICT (idempotency_key) DO UPDATE
        SET updated_at = now()
    RETURNING id, status, scheduled_for, (xmax = 0) AS is_new
    INTO v_event;

    RETURN jsonb_build_object(
        'event_id', v_event.id,
        'status', v_event.status,
        'scheduled_for', v_event.scheduled_for,
        'is_new', v_event.is_new,
        'idempotency_key', v_idempotency_key
    );
END;
$$;

-- Secure grants on enqueue function
REVOKE ALL ON FUNCTION public.enqueue_notification_event(uuid, uuid, text, text, timestamptz, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_notification_event(uuid, uuid, text, text, timestamptz, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.enqueue_notification_event(uuid, uuid, text, text, timestamptz, text, jsonb) TO authenticated;

-- 5. ATOMIC BOOKING INTEGRATION (appointment.created)
CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_barbershop_id uuid,
  p_professional_id uuid,
  p_service_ids uuid[],
  p_scheduled_start timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_name text;
  v_clean_phone text;
  v_clean_email text;
  v_clean_notes text;
  v_barbershop RECORD;
  v_professional RECORD;
  v_shop_hours RECORD;
  v_pro_hours RECORD;
  v_service_count int;
  v_total_duration int;
  v_total_amount numeric;
  v_scheduled_end timestamptz;
  v_customer_id uuid;
  v_appointment_id uuid;
  v_tz text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_weekday smallint;
  v_start_time time;
  v_end_time time;
BEGIN
  -- 1. Input Sanitization & Validations
  v_clean_name := trim(p_customer_name);
  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');
  v_clean_email := nullif(trim(p_customer_email), '');
  v_clean_notes := nullif(trim(p_notes), '');

  IF v_clean_name IS NULL OR length(v_clean_name) < 2 THEN
    RAISE EXCEPTION 'BOOKING_INVALID_CUSTOMER_NAME';
  END IF;

  IF v_clean_phone IS NULL OR length(v_clean_phone) < 10 OR length(v_clean_phone) > 11 THEN
    RAISE EXCEPTION 'BOOKING_INVALID_CUSTOMER_PHONE';
  END IF;

  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL OR array_length(p_service_ids, 1) = 0 THEN
    RAISE EXCEPTION 'BOOKING_NO_SERVICES_SELECTED';
  END IF;

  IF p_scheduled_start <= now() THEN
    RAISE EXCEPTION 'BOOKING_PAST_DATE_NOT_ALLOWED';
  END IF;

  -- 2. Verify Barbershop
  SELECT id, settings INTO v_barbershop
  FROM public.barbershops
  WHERE id = p_barbershop_id AND active = true;

  IF v_barbershop.id IS NULL THEN
    RAISE EXCEPTION 'BOOKING_BARBERSHOP_NOT_FOUND';
  END IF;

  -- 3. Verify Professional
  SELECT id INTO v_professional
  FROM public.professionals
  WHERE id = p_professional_id 
    AND barbershop_id = p_barbershop_id 
    AND active = true;

  IF v_professional.id IS NULL THEN
    RAISE EXCEPTION 'BOOKING_PROFESSIONAL_NOT_FOUND';
  END IF;

  -- 4. Verify Services and calculate total duration and amount
  SELECT 
    count(*),
    coalesce(sum(duration_min), 0),
    coalesce(sum(price), 0)
  INTO v_service_count, v_total_duration, v_total_amount
  FROM public.services
  WHERE id = ANY(p_service_ids)
    AND barbershop_id = p_barbershop_id
    AND active = true;

  IF v_service_count != array_length(p_service_ids, 1) THEN
    RAISE EXCEPTION 'BOOKING_INVALID_SERVICES';
  END IF;

  IF v_total_duration <= 0 THEN
    v_total_duration := 30;
  END IF;

  v_scheduled_end := p_scheduled_start + (v_total_duration || ' minutes')::interval;

  -- 5. Working-hours & schedule validation
  v_tz := COALESCE(v_barbershop.settings->>'timezone', 'America/Sao_Paulo');
  v_local_start := p_scheduled_start AT TIME ZONE v_tz;
  v_local_end := v_scheduled_end AT TIME ZONE v_tz;
  v_weekday := EXTRACT(DOW FROM v_local_start)::smallint;
  v_start_time := v_local_start::time;
  v_end_time := v_local_end::time;

  IF v_local_start::date != v_local_end::date THEN
    RAISE EXCEPTION 'BOOKING_OUTSIDE_BUSINESS_HOURS';
  END IF;

  -- Check Barbershop Operating Hours
  SELECT opens_at, closes_at INTO v_shop_hours
  FROM public.barbershop_business_hours
  WHERE barbershop_id = p_barbershop_id AND weekday = v_weekday;

  IF v_shop_hours.opens_at IS NULL THEN
    RAISE EXCEPTION 'BOOKING_OUTSIDE_BUSINESS_HOURS';
  END IF;

  IF v_start_time < v_shop_hours.opens_at OR v_end_time > v_shop_hours.closes_at THEN
    RAISE EXCEPTION 'BOOKING_OUTSIDE_BUSINESS_HOURS';
  END IF;

  -- Check Professional Working Hours
  SELECT start_time, end_time, break_start, break_end INTO v_pro_hours
  FROM public.working_hours
  WHERE professional_id = p_professional_id AND weekday = v_weekday;

  IF v_pro_hours.start_time IS NULL THEN
    RAISE EXCEPTION 'BOOKING_OUTSIDE_PROFESSIONAL_HOURS';
  END IF;

  IF v_start_time < v_pro_hours.start_time OR v_end_time > v_pro_hours.end_time THEN
    RAISE EXCEPTION 'BOOKING_OUTSIDE_PROFESSIONAL_HOURS';
  END IF;

  -- Check Break
  IF v_pro_hours.break_start IS NOT NULL AND v_pro_hours.break_end IS NOT NULL THEN
    IF v_start_time < v_pro_hours.break_end AND v_end_time > v_pro_hours.break_start THEN
      RAISE EXCEPTION 'BOOKING_PROFESSIONAL_ON_BREAK';
    END IF;
  END IF;

  -- Check Time Off
  IF EXISTS (
    SELECT 1 FROM public.time_off
    WHERE professional_id = p_professional_id
      AND p_scheduled_start < end_at
      AND v_scheduled_end > start_at
  ) THEN
    RAISE EXCEPTION 'BOOKING_PROFESSIONAL_UNAVAILABLE';
  END IF;

  -- 6. Acquire transactional advisory lock per professional
  PERFORM pg_advisory_xact_lock(hashtext(p_professional_id::text));

  -- Check existing overlapping appointments
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE professional_id = p_professional_id
      AND status IN ('scheduled', 'in_progress')
      AND scheduled_start < v_scheduled_end
      AND scheduled_end > p_scheduled_start
  ) THEN
    RAISE EXCEPTION 'BOOKING_SLOT_TAKEN';
  END IF;

  -- 7. Customer resolution
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO v_customer_id 
    FROM public.customers
    WHERE barbershop_id = p_barbershop_id AND profile_id = auth.uid() 
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id 
    FROM public.customers
    WHERE barbershop_id = p_barbershop_id AND regexp_replace(phone, '\D', '', 'g') = v_clean_phone 
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (barbershop_id, profile_id, full_name, phone, email)
    VALUES (p_barbershop_id, auth.uid(), v_clean_name, v_clean_phone, v_clean_email)
    RETURNING id INTO v_customer_id;
  END IF;

  -- 8. Insert appointment
  INSERT INTO public.appointments (
    barbershop_id,
    customer_id,
    professional_id,
    scheduled_start,
    scheduled_end,
    status,
    total_amount,
    source,
    notes,
    created_by
  ) VALUES (
    p_barbershop_id,
    v_customer_id,
    p_professional_id,
    p_scheduled_start,
    v_scheduled_end,
    'scheduled',
    v_total_amount,
    'web',
    v_clean_notes,
    auth.uid()
  ) RETURNING id INTO v_appointment_id;

  -- 9. Insert appointment services snapshots
  INSERT INTO public.appointment_services (
    appointment_id,
    service_id,
    price_snapshot,
    duration_snapshot
  )
  SELECT 
    v_appointment_id,
    s.id,
    s.price,
    s.duration_min
  FROM public.services s
  WHERE s.id = ANY(p_service_ids);

  -- 10. Transactional Outbox Enqueue (appointment.created)
  -- Enqueue event within the same database transaction.
  -- Non-blocking design: if outbox enqueue encounters a warning/exception, booking succeeds safely.
  BEGIN
    PERFORM public.enqueue_notification_event(
      p_barbershop_id := p_barbershop_id,
      p_appointment_id := v_appointment_id,
      p_event_type := 'appointment.created',
      p_channel := 'whatsapp',
      p_scheduled_for := now(),
      p_delivery_bucket := 'creation',
      p_metadata := jsonb_build_object('source_op', 'create_public_booking')
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'NOTIFICATION_OUTBOX_ENQUEUE_FAILED: %', SQLERRM;
  END;

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'scheduled_start', p_scheduled_start,
    'scheduled_end', v_scheduled_end,
    'status', 'scheduled'
  );

EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'BOOKING_SLOT_TAKEN';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_booking(uuid, uuid, uuid[], timestamptz, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(uuid, uuid, uuid[], timestamptz, text, text, text, text) TO anon, authenticated;

-- 6. CONTROLLED TRIGGER FOR CANCELLATION EVENT (appointment.cancelled)
CREATE OR REPLACE FUNCTION public.tg_appointments_enqueue_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
        BEGIN
            PERFORM public.enqueue_notification_event(
                p_barbershop_id := NEW.barbershop_id,
                p_appointment_id := NEW.id,
                p_event_type := 'appointment.cancelled',
                p_channel := 'whatsapp',
                p_scheduled_for := now(),
                p_delivery_bucket := 'cancellation',
                p_metadata := jsonb_build_object('source_op', 'status_update')
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'NOTIFICATION_OUTBOX_CANCEL_ENQUEUE_FAILED: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_cancellation ON public.appointments;
CREATE TRIGGER trg_appointments_cancellation
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.tg_appointments_enqueue_cancellation();
