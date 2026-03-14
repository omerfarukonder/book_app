-- Blends table
create table public.blends (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references public.users(id) on delete cascade not null,
  user2_id uuid references public.users(id) on delete cascade not null,
  books jsonb not null default '[]',
  bond_book jsonb,
  compatibility_score numeric(5,2) not null default 0,
  created_at timestamptz default now() not null
);

create index idx_blends_user1 on public.blends(user1_id);
create index idx_blends_user2 on public.blends(user2_id);

alter table public.blends enable row level security;

-- Viewable by either participant
create policy "Blend participants can view"
  on public.blends for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Only authenticated users can create
create policy "Authenticated users can create blends"
  on public.blends for insert
  with check (auth.uid() = user1_id);

-- Only user1 (creator) can update/delete
create policy "Creator can update blend"
  on public.blends for update
  using (auth.uid() = user1_id);

create policy "Creator can delete blend"
  on public.blends for delete
  using (auth.uid() = user1_id);
