-- BookShelf Database Schema

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null
);

-- Books table (cached from Google Books API)
create table public.books (
  id uuid default gen_random_uuid() primary key,
  google_books_id text unique not null,
  title text not null,
  authors text[] default '{}',
  cover_url text,
  page_count integer,
  published_date text,
  genres text[] default '{}',
  synopsis text,
  isbn text,
  created_at timestamptz default now() not null
);

-- Reading logs (the core table)
create table public.logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  status text not null check (status in ('want_to_read', 'reading', 'finished', 'abandoned')),
  rating numeric(2,1) check (rating >= 0.5 and rating <= 5.0),
  review_text text,
  contains_spoilers boolean default false,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now() not null,
  unique(user_id, book_id)
);

-- User-curated lists
create table public.lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  is_ranked boolean default false,
  is_public boolean default true,
  created_at timestamptz default now() not null
);

-- Items within a list
create table public.list_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  position integer not null default 0,
  notes text,
  unique(list_id, book_id)
);

-- Social follows
create table public.follows (
  follower_id uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Likes on logs/reviews
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  log_id uuid references public.logs(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, log_id)
);

-- Comments on logs/reviews
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  log_id uuid references public.logs(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now() not null
);

-- Personal tags on logs
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  log_id uuid references public.logs(id) on delete cascade not null,
  name text not null
);

-- User genre preferences (for onboarding/recommendations)
create table public.user_genres (
  user_id uuid references public.users(id) on delete cascade not null,
  genre text not null,
  primary key (user_id, genre)
);

-- Indexes for common queries
create index idx_logs_user_id on public.logs(user_id);
create index idx_logs_book_id on public.logs(book_id);
create index idx_logs_created_at on public.logs(created_at desc);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
create index idx_list_items_list on public.list_items(list_id);
create index idx_likes_log on public.likes(log_id);
create index idx_comments_log on public.comments(log_id);
create index idx_books_google_id on public.books(google_books_id);

-- Row Level Security Policies

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.logs enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.tags enable row level security;
alter table public.user_genres enable row level security;

-- Users: anyone can read, only own profile can be updated
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);

-- Books: anyone can read, authenticated users can insert
create policy "Books are viewable by everyone" on public.books for select using (true);
create policy "Authenticated users can insert books" on public.books for insert with check (auth.role() = 'authenticated');

-- Logs: anyone can read, users manage their own
create policy "Logs are viewable by everyone" on public.logs for select using (true);
create policy "Users can manage their own logs" on public.logs for insert with check (auth.uid() = user_id);
create policy "Users can update their own logs" on public.logs for update using (auth.uid() = user_id);
create policy "Users can delete their own logs" on public.logs for delete using (auth.uid() = user_id);

-- Lists: public lists are viewable, users manage their own
create policy "Public lists are viewable" on public.lists for select using (is_public = true or auth.uid() = user_id);
create policy "Users can manage their own lists" on public.lists for insert with check (auth.uid() = user_id);
create policy "Users can update their own lists" on public.lists for update using (auth.uid() = user_id);
create policy "Users can delete their own lists" on public.lists for delete using (auth.uid() = user_id);

-- List items: viewable if list is viewable
create policy "List items are viewable" on public.list_items for select using (
  exists (select 1 from public.lists where id = list_id and (is_public = true or user_id = auth.uid()))
);
create policy "Users can manage their list items" on public.list_items for insert with check (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid())
);
create policy "Users can update their list items" on public.list_items for update using (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid())
);
create policy "Users can delete their list items" on public.list_items for delete using (
  exists (select 1 from public.lists where id = list_id and user_id = auth.uid())
);

-- Follows: anyone can read, users manage their own follows
create policy "Follows are viewable by everyone" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Likes: anyone can read, users manage their own
create policy "Likes are viewable by everyone" on public.likes for select using (true);
create policy "Users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- Comments: anyone can read, users manage their own
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their comments" on public.comments for delete using (auth.uid() = user_id);

-- Tags: users manage their own
create policy "Users can view their own tags" on public.tags for select using (auth.uid() = user_id);
create policy "Users can manage their tags" on public.tags for insert with check (auth.uid() = user_id);
create policy "Users can delete their tags" on public.tags for delete using (auth.uid() = user_id);

-- User genres: users manage their own
create policy "Users can view their genres" on public.user_genres for select using (auth.uid() = user_id);
create policy "Users can set their genres" on public.user_genres for insert with check (auth.uid() = user_id);
create policy "Users can remove their genres" on public.user_genres for delete using (auth.uid() = user_id);
