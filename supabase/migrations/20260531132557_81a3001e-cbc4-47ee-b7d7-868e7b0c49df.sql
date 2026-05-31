-- Best way to fix Function Search Path Mutable without dropping/recreating
ALTER FUNCTION public.has_barbershop_role(UUID, UUID, app_role) SET search_path = public;
ALTER FUNCTION public.is_barbershop_member(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.is_barbershop_staff(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.fn_loyalty_on_appointment_completed() SET search_path = public;
ALTER FUNCTION public.fn_loyalty_on_pdv_sale() SET search_path = public;
ALTER FUNCTION public.fn_wallet_on_appointment_completed() SET search_path = public;
ALTER FUNCTION public.fn_wallet_on_pdv_sale() SET search_path = public;
ALTER FUNCTION public.redeem_loyalty_points(UUID, UUID, INTEGER, UUID) SET search_path = public;
ALTER FUNCTION public.redeem_wallet(UUID, UUID, DECIMAL, UUID) SET search_path = public;
ALTER FUNCTION public.credit_wallet_manual(UUID, UUID, DECIMAL, TEXT, UUID) SET search_path = public;

-- Revoke and Grant
REVOKE EXECUTE ON FUNCTION public.has_barbershop_role(UUID, UUID, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_barbershop_member(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_barbershop_staff(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(UUID, UUID, INTEGER, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_wallet(UUID, UUID, DECIMAL, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_manual(UUID, UUID, DECIMAL, TEXT, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_barbershop_role(UUID, UUID, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_barbershop_member(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_barbershop_staff(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(UUID, UUID, INTEGER, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_wallet(UUID, UUID, DECIMAL, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_manual(UUID, UUID, DECIMAL, TEXT, UUID) TO authenticated, service_role;
