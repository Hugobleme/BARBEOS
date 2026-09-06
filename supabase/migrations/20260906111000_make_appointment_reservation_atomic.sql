-- Migration: Make Appointment Reservation Atomic
-- Timestamp: 2026-09-06 11:10:00
-- Purpose:
--   1. Enable btree_gist extension for UUID + Range GiST indexing.
--   2. Add check constraint ensuring scheduled_end > scheduled_start.
--   3. Add partial GiST exclusion constraint preventing overlapping active appointments.
--   4. Create atomic public.create_public_booking RPC with server-side validations,
--      customer resolution, transaction advisory locking, and atomic insertion.
--   5. Grant execution to anon and authenticated roles.

-- ============================================================
-- 1. ENABLE EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- 2. VALIDATE APPOINTMENT DURATION
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_scheduled_interval_valid'
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_scheduled_interval_valid
    CHECK (scheduled_end > scheduled_start);
  END IF;
END $$;

-- ============================================================
-- 3. PREVENT OVERLAPPING ACTIVE APPOINTMENTS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_no_overlapping_active_slots'
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_no_overlapping_active_slots
    EXCLUDE USING gist (
      professional_id WITH =,
      tstzrange(scheduled_start, scheduled_end, '[)') WITH &&
    )
    WHERE (
      status IN ('scheduled', 'in_progress')
    );
  END IF;
END $$;

-- ============================================================
-- 4. ATOMIC BOOKING RPC
-- ============================================================
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
  v_service_count integer;
  v_total_duration integer;
  v_total_amount numeric;
  v_scheduled_end timestamptz;
  v_tz text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_weekday smallint;
  v_start_time time;
  v_end_time time;
  v_customer_id uuid;
  v_appointment_id uuid;
BEGIN
  -- 1. Input validations
  IF p_barbershop_id IS NULL OR p_professional_id IS NULL OR p_service_ids IS NULL OR p_scheduled_start IS NULL THEN
    RAISE EXCEPTION 'BOOKING_INVALID_INPUT';
  END IF;

  IF array_length(p_service_ids, 1) IS NULL OR array_length(p_service_ids, 1) = 0 THEN
    RAISE EXCEPTION 'BOOKING_INVALID_INPUT';
  END IF;

  -- Check duplicates in service IDs
  IF (SELECT count(DISTINCT s_id) FROM unnest(p_service_ids) AS s_id) != array_length(p_service_ids, 1) THEN
    RAISE EXCEPTION 'BOOKING_DUPLICATE_SERVICES';
  END IF;

  v_clean_name := trim(p_customer_name);
  v_clean_phone := regexp_replace(COALESCE(p_customer_phone, ''), '\D', '', 'g');
  v_clean_email := NULLIF(trim(p_customer_email), '');
  v_clean_notes := NULLIF(trim(p_notes), '');

  IF length(v_clean_name) = 0 OR length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'BOOKING_INVALID_CUSTOMER_NAME';
  END IF;

  IF length(v_clean_phone) < 10 OR length(v_clean_phone) > 15 THEN
    RAISE EXCEPTION 'BOOKING_INVALID_CUSTOMER_PHONE';
  END IF;

  IF v_clean_email IS NOT NULL AND v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'BOOKING_INVALID_CUSTOMER_EMAIL';
  END IF;

  IF p_scheduled_start < (now() - interval '5 minutes') THEN
    RAISE EXCEPTION 'BOOKING_PAST_DATE';
  END IF;

  IF p_scheduled_start > (now() + interval '180 days') THEN
    RAISE EXCEPTION 'BOOKING_HORIZON_EXCEEDED';
  END IF;

  -- 2. Barbershop validation
  SELECT id, active, settings INTO v_barbershop 
  FROM public.barbershops 
  WHERE id = p_barbershop_id;

  IF v_barbershop.id IS NULL OR NOT v_barbershop.active THEN
    RAISE EXCEPTION 'BOOKING_INVALID_SHOP';
  END IF;

  -- 3. Professional validation
  SELECT id, barbershop_id, active INTO v_professional 
  FROM public.professionals 
  WHERE id = p_professional_id;

  IF v_professional.id IS NULL OR v_professional.barbershop_id != p_barbershop_id OR NOT v_professional.active THEN
    RAISE EXCEPTION 'BOOKING_INVALID_PROFESSIONAL';
  END IF;

  -- 4. Services validation & totals calculation
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

-- ============================================================
-- 5. PERMISSIONS
-- ============================================================
REVOKE ALL ON FUNCTION public.create_public_booking(uuid, uuid, uuid[], timestamptz, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(uuid, uuid, uuid[], timestamptz, text, text, text, text) TO anon, authenticated;
