-- Migration: 003_platform_weights.sql
-- Purpose: Store global weight configurations for the oracle engine

CREATE TABLE public.platform_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type TEXT UNIQUE NOT NULL,
  weights_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.platform_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read weights"
  ON public.platform_weights FOR SELECT
  USING (true);

CREATE POLICY "Admins can update weights"
  ON public.platform_weights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
      AND users.role = 'admin'
    )
  );
