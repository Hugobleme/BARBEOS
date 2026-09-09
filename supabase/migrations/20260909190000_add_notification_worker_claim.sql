-- ============================================================
-- MIGRATION: Notification Outbox Worker Safe Claim & Completion
-- Timestamp: 20260909190000
-- Reference: docs/NOTIFICATIONS_DESIGN.md & Etapa 15C
-- ============================================================

-- 1. CONTROLLED WORKER BATCH CLAIM FUNCTION
-- Uses FOR UPDATE SKIP LOCKED to guarantee that concurrent workers
-- never claim the same outbox row.
-- Enforces a strict batch size limit between 1 and 25.
-- Atomically transitions status from 'pending' to 'processing'.
CREATE OR REPLACE FUNCTION public.claim_notification_outbox_batch(
    p_batch_size integer DEFAULT 10,
    p_barbershop_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    barbershop_id uuid,
    appointment_id uuid,
    event_type text,
    channel text,
    status text,
    idempotency_key text,
    scheduled_for timestamptz,
    attempt_count integer,
    metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actual_limit integer;
BEGIN
    -- Bound batch size strictly between 1 and 25
    v_actual_limit := LEAST(GREATEST(COALESCE(p_batch_size, 10), 1), 25);

    RETURN QUERY
    WITH eligible AS (
        SELECT outbox.id
        FROM public.notification_outbox outbox
        WHERE outbox.status = 'pending'
          AND outbox.scheduled_for <= now()
          AND (p_barbershop_id IS NULL OR outbox.barbershop_id = p_barbershop_id)
        ORDER BY outbox.scheduled_for ASC
        LIMIT v_actual_limit
        FOR UPDATE SKIP LOCKED
    ),
    claimed AS (
        UPDATE public.notification_outbox outbox
        SET status = 'processing',
            attempt_count = outbox.attempt_count + 1,
            last_attempt_at = now(),
            updated_at = now()
        FROM eligible
        WHERE outbox.id = eligible.id
        RETURNING
            outbox.id,
            outbox.barbershop_id,
            outbox.appointment_id,
            outbox.event_type,
            outbox.channel,
            outbox.status,
            outbox.idempotency_key,
            outbox.scheduled_for,
            outbox.attempt_count,
            outbox.metadata
    )
    SELECT * FROM claimed;
END;
$$;

-- Restrict execution: only trusted backend service-role / server runtimes can claim batches
REVOKE ALL ON FUNCTION public.claim_notification_outbox_batch(integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_notification_outbox_batch(integer, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_notification_outbox_batch(integer, uuid) FROM authenticated;


-- 2. CONTROLLED EVENT COMPLETION FUNCTION
-- Safely transitions an outbox row from 'processing' to its final or next state:
--   - 'sent': sets delivered_at = now(), provider_message_id
--   - 'pending' (retry): updates scheduled_for to bounded backoff, clears failure_code
--   - 'failed': sets failed_at = now(), failure_code
--   - 'dead_letter': sets failed_at = now(), failure_code
--   - 'cancelled': sets cancelled_at = now()
CREATE OR REPLACE FUNCTION public.complete_notification_outbox_event(
    p_event_id uuid,
    p_status text,
    p_failure_code text DEFAULT NULL,
    p_provider_message_id text DEFAULT NULL,
    p_retry_scheduled_for timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Validate target status strictly against allowed statuses
    IF p_status NOT IN ('pending', 'sent', 'failed', 'cancelled', 'dead_letter') THEN
        RAISE EXCEPTION 'OUTBOX_INVALID_TARGET_STATUS: %', p_status;
    END IF;

    UPDATE public.notification_outbox
    SET status = p_status,
        failure_code = p_failure_code,
        provider_message_id = COALESCE(p_provider_message_id, provider_message_id),
        delivered_at = CASE WHEN p_status = 'sent' THEN now() ELSE delivered_at END,
        failed_at = CASE WHEN p_status IN ('failed', 'dead_letter') THEN now() ELSE failed_at END,
        cancelled_at = CASE WHEN p_status = 'cancelled' THEN now() ELSE cancelled_at END,
        scheduled_for = CASE 
            WHEN p_status = 'pending' AND p_retry_scheduled_for IS NOT NULL THEN p_retry_scheduled_for 
            ELSE scheduled_for 
        END,
        updated_at = now()
    WHERE id = p_event_id
      AND status = 'processing';

    RETURN FOUND;
END;
$$;

-- Restrict execution: only trusted backend service-role / server runtimes can complete events
REVOKE ALL ON FUNCTION public.complete_notification_outbox_event(uuid, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_notification_outbox_event(uuid, text, text, text, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.complete_notification_outbox_event(uuid, text, text, text, timestamptz) FROM authenticated;
