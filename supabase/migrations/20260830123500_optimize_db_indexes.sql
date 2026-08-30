-- Performance Optimization: Create indexes for foreign keys and common query patterns

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_id ON public.appointments(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON public.appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Working Hours
CREATE INDEX IF NOT EXISTS idx_working_hours_professional_id ON public.working_hours(professional_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_weekday ON public.working_hours(weekday);

-- Time Off
CREATE INDEX IF NOT EXISTS idx_time_off_professional_id ON public.time_off(professional_id);
CREATE INDEX IF NOT EXISTS idx_time_off_date_range ON public.time_off(start_time, end_time);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_barbershop_id ON public.services(barbershop_id);

-- Professionals
CREATE INDEX IF NOT EXISTS idx_professionals_barbershop_id ON public.professionals(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);

-- Cash Transactions
CREATE INDEX IF NOT EXISTS idx_cash_transactions_barbershop_id ON public.cash_transactions(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_session_id ON public.cash_transactions(session_id);

-- Commissions
CREATE INDEX IF NOT EXISTS idx_commissions_professional_id ON public.commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_commissions_barbershop_id ON public.commissions(barbershop_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_barbershop_id ON public.reviews(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON public.reviews(professional_id);
