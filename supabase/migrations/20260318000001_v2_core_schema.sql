-- V2 Core Schema: Domain Ownership & Security
-- Date: 2026-03-18

-- 1. Blocked Domains Table (Security Header)
CREATE TABLE IF NOT EXISTS public.blocked_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some obvious high-risk domains
INSERT INTO public.blocked_domains (domain, reason) VALUES
('bankofamerica.com', 'High-risk financial sector'),
('chase.com', 'High-risk financial sector'),
('paypal.com', 'High-risk financial sector'),
('google.com', 'Major SaaS provider'),
('facebook.com', 'Major SaaS provider'),
('amazon.com', 'Major SaaS provider')
ON CONFLICT (domain) DO NOTHING;

-- 2. Domain Verifications Table
CREATE TABLE IF NOT EXISTS public.domain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    token TEXT NOT NULL, -- Challenge token (e.g., foldaa-verification=xxxx)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    verification_method TEXT NOT NULL CHECK (verification_method IN ('dns', 'http')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, domain)
);

-- Enable RLS on domain_verifications
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications" ON public.domain_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications" ON public.domain_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Update Projects Table for V2
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'url' CHECK (source_type IN ('url', 'bundle')),
    ADD COLUMN IF NOT EXISTS source_value TEXT,
    ADD COLUMN IF NOT EXISTS domain TEXT,
    ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES public.domain_verifications(id),
    ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'preview' CHECK (mode IN ('preview', 'owner')),
    ADD COLUMN IF NOT EXISTS x_proxy_header BOOLEAN DEFAULT true;

-- Ensure RLS on projects (if not already enabled)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Migration logic for existing projects
UPDATE public.projects 
SET 
  source_type = 'url',
  source_value = original_url,
  mode = 'owner', -- Existing projects are grandfathered into owner mode
  domain = name || '.foldaa.app'
WHERE source_type IS NULL;
