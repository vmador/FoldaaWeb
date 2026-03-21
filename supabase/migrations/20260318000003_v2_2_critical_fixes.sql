-- V2.2 Critical Fixes Migration

-- 1. Global Kill Switch
CREATE TABLE IF NOT EXISTS public.blocked_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('user', 'domain')),
    value TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Strong Idempotency (Launch & Preview Deduplication)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deployment_hash TEXT;

-- 3. Token Security Fix (Current Setting)
-- Ensure pgcrypto exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the old function with 2 arguments
DROP FUNCTION IF EXISTS public.get_decrypted_cf_token(UUID, TEXT);

-- Create new secure function relying on internal DB settings (e.g. Supabase Vault / Config)
CREATE OR REPLACE FUNCTION public.get_decrypted_cf_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    decrypted_token TEXT;
BEGIN
    SELECT pgp_sym_decrypt(
        decode(encrypted_api_token, 'base64'),
        current_setting('app.encryption_key')
    )
    INTO decrypted_token
    FROM public.cloudflare_credentials
    WHERE user_id = p_user_id
    LIMIT 1;

    RETURN decrypted_token;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomic Rate Limiting Function
CREATE OR REPLACE FUNCTION public.enforce_rate_limit(p_key TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_hits INTEGER;
BEGIN
    -- 1. Try to increment active window
    UPDATE public.rate_limits 
    SET hits = hits + 1
    WHERE key = p_key AND expires_at > now()
    RETURNING hits INTO current_hits;

    IF NOT FOUND THEN
        -- 2. Either key doesn't exist, or window expired. Upsert it safely.
        INSERT INTO public.rate_limits (key, hits, expires_at)
        VALUES (p_key, 1, now() + (p_window_seconds || ' seconds')::interval)
        ON CONFLICT (key) DO UPDATE 
        SET hits = 1, expires_at = now() + (p_window_seconds || ' seconds')::interval
        RETURNING hits INTO current_hits;
    END IF;

    -- Return false if exceeded
    IF current_hits > p_limit THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
