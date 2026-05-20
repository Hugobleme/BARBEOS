REVOKE ALL ON FUNCTION public.credit_loyalty_points(uuid,uuid,numeric,text,uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_loyalty_points(uuid,uuid,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid,uuid,integer,text) TO authenticated;