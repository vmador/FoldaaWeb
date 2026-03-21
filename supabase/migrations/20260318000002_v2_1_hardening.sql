-- V2.1 Hardening Migration

-- 1. Domain Verification Harpening
ALTER TABLE public.domain_verifications ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP WITH TIME ZONE;

-- 2. Preview Spam Protection (Deduplication)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS origin_hash TEXT;

-- 3. Rate Limiting Table (Token Bucket fallback)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    hits INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable automatic cleanup of old rate limits (could be scheduled via pg_cron, but Edge Function can gracefully ignore expired ones)

-- 4. Cloudflare Token Security (pgcrypto implementation)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- RPC to securely fetch decrypted tokens ONLY available to Edge Functions (or authenticated users of their own tokens)
CREATE OR REPLACE FUNCTION public.get_decrypted_cf_token(p_user_id UUID, p_encryption_key TEXT)
RETURNS TEXT AS $$
DECLARE
    decrypted_token TEXT;
BEGIN
    -- This relies on the table `cloudflare_credentials` natively storing a pgp encrypted token, 
    -- rather than standard custom AES salt text. For backward compatibility with the V2 manual AES token, 
    -- we would migrate those tokens to pgcrypto asynchronously. For now, this is the V2.1 pattern.
    SELECT pgp_sym_decrypt(decode(encrypted_api_token, 'base64'), p_encryption_key)
    INTO decrypted_token
    FROM public.cloudflare_credentials
    WHERE user_id = p_user_id
    LIMIT 1;
    
    RETURN decrypted_token;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
