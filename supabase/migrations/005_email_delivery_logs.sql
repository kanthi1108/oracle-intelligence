-- 005_email_delivery_logs.sql
-- Delivery simulation tracking for shared reports

CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_id       UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued', 'sent', 'failed')),
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_delivery_user ON public.email_delivery_logs(user_id);
CREATE INDEX idx_email_delivery_report ON public.email_delivery_logs(report_id);

ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deliveries"
    ON public.email_delivery_logs FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert deliveries"
    ON public.email_delivery_logs FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all deliveries"
    ON public.email_delivery_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_id = auth.uid() AND u.role = 'admin'
        )
    );
