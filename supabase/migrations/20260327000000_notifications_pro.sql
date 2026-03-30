-- Create broadcast_history table
create table if not exists public.broadcast_history (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    title text not null,
    message text not null,
    scheduled_for timestamptz,
    sent_at timestamptz,
    status text default 'pending', -- pending, sent, failed, scheduled
    recipients_count int default 0,
    external_id text, -- OneSignal notification ID
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.broadcast_history enable row level security;

-- Policies
create policy "Users can view their own project's broadcast history"
    on public.broadcast_history for select
    using ( exists (
        select 1 from public.projects
        where projects.id = broadcast_history.project_id
        and projects.user_id = auth.uid()
    ));

-- Realtime
alter publication supabase_realtime add table public.broadcast_history;
