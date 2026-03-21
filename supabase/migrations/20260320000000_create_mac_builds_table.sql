CREATE TABLE public.mac_builds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'ready', 'error')),
    dmg_url TEXT,
    logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.mac_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mac builds" 
ON public.mac_builds FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = mac_builds.project_id AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own mac builds" 
ON public.mac_builds FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = mac_builds.project_id AND projects.user_id = auth.uid()
    )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mac_builds;
