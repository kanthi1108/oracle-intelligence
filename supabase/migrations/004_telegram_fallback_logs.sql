-- Migration: 004_telegram_fallback_logs.sql
-- Purpose: Provide a persistent logging table when telegram bot token is missing or generic

CREATE TABLE public.telegram_fallback_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.telegram_fallback_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fallback logs"
  ON public.telegram_fallback_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
      AND users.role = 'admin'
    )
  );
