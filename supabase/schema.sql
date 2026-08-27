-- ============================================================
-- LIME — Production Database Schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor after creating a project.
-- ============================================================

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 30),
  display_name text not null,
  island text not null,                -- island of origin (the core identity field)
  current_location text not null,      -- 'Home' or city/country abroad
  bio text default '',
  avatar_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  x_url text,
  whatsapp text,
  phone text,
  looking_for text,
  created_at timestamptz default now()
);

-- ---------- POSTS (feed: text + images) ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  image_url text,                      -- Supabase Storage public URL
  video_url text,                      -- Supabase Storage public URL (post-videos bucket)
  island text not null,                -- denormalized for fast island filtering
  posted_from text not null,           -- 'Home' or diaspora city
  tags text[] default '{}',            -- e.g. {food, music}
  created_at timestamptz default now()
);
create index posts_island_idx on public.posts(island);
create index posts_created_idx on public.posts(created_at desc);

create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz default now()
);

-- ---------- EVENTS (Linkup) ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  city text not null,
  venue text,
  starts_at timestamptz not null,
  category text default 'general',     -- general | carnival | family | food
  created_at timestamptz default now()
);
create index events_city_idx on public.events(city);
create index events_starts_idx on public.events(starts_at);

create table public.event_rsvps (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- ---------- JOBS (Wuk & Hustle) ----------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  company text not null,
  location text not null,
  kind text not null default 'on-island', -- on-island | remote | diaspora
  caribbean_owned boolean default false,
  description text default '',
  apply_url text,
  created_at timestamptz default now()
);

-- ---------- CULTURE (music, poems, stories — original work or links only) ----------
create table public.culture_music (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null,
  audio_url text,      -- uploaded to the 'culture-audio' storage bucket
  external_url text,   -- Spotify / YouTube / Apple Music / SoundCloud link
  created_at timestamptz default now()
);

create table public.culture_poems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  media_url text,      -- optional link to a video/audio reading
  created_at timestamptz default now()
);

create table public.culture_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,            -- original writing (nullable if this is a link-only post)
  external_url text,    -- link to a book / author / folk tale
  created_at timestamptz default now()
);

-- ---------- PROPERTY (community classifieds — land/houses to buy or rent) ----------
-- Listings are posted by users; LIME does not broker, verify, or guarantee
-- any property transaction. See the in-app disclaimer on the Property screen.
create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('land', 'house')),
  transaction_type text not null check (transaction_type in ('sale', 'rent')),
  island text not null,
  location text not null,
  price text not null,
  description text default '',
  photo_urls text[] default '{}',
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  created_at timestamptz default now()
);
create index property_listings_island_idx on public.property_listings(island);

-- ---------- EATS (restaurant/menu submissions) ----------
create table public.restaurant_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles(id) on delete set null,
  name text not null,
  url text not null,
  note text,
  created_at timestamptz default now()
);

-- ---------- ROOTS (family tree) ----------
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  relation text,                        -- e.g. grandmother, uncle
  place text,                           -- island/parish/city
  born_year int,
  parent_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz default now()
);
create index family_owner_idx on public.family_members(owner_id);

-- ---------- FOLLOWS ----------
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  followed_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

-- ============================================================
-- MODERATION — REQUIRED by Apple (Guideline 1.2) and Google Play
-- for any app with user-generated content. Do not skip these.
-- ============================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('post','comment','profile','event','job')),
  content_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','actioned')),
  created_at timestamptz default now()
);

create table public.blocked_users (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.culture_music enable row level security;
alter table public.culture_poems enable row level security;
alter table public.culture_stories enable row level security;
alter table public.property_listings enable row level security;
alter table public.jobs enable row level security;
alter table public.restaurant_submissions enable row level security;
alter table public.family_members enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;

-- ============================================================
-- SECURITY FIX (2026-08-23): live testing found RLS was NOT being
-- enforced on public.posts — any authenticated user could update or
-- delete ANY other user's post. Re-run this block (safe to re-run)
-- if you haven't already: it re-enables RLS and re-creates every
-- posts policy from scratch.
-- ============================================================
alter table public.posts enable row level security;

drop policy if exists "posts readable" on public.posts;
create policy "posts readable" on public.posts for select to authenticated using (
  not exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = auth.uid() and b.blocked_id = author_id)
       or (b.blocker_id = author_id and b.blocked_id = auth.uid())
  )
);

drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete to authenticated using (auth.uid() = author_id);

-- Profiles: readable by all signed-in users; only owner can edit
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);

-- Posts: hide posts from users you've blocked / who blocked you
create policy "posts readable" on public.posts for select to authenticated using (
  not exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = auth.uid() and b.blocked_id = author_id)
       or (b.blocker_id = author_id and b.blocked_id = auth.uid())
  )
);
create policy "posts insert own" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "posts delete own" on public.posts for delete to authenticated using (auth.uid() = author_id);

-- Likes & comments
create policy "likes all" on public.post_likes for select to authenticated using (true);
create policy "likes insert own" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes delete own" on public.post_likes for delete to authenticated using (auth.uid() = user_id);
create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "comments insert own" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "comments delete own" on public.comments for delete to authenticated using (auth.uid() = author_id);

-- Events & RSVPs
create policy "events readable" on public.events for select to authenticated using (true);
create policy "events insert own" on public.events for insert to authenticated with check (auth.uid() = host_id);
create policy "events update own" on public.events for update to authenticated using (auth.uid() = host_id);
create policy "events delete own" on public.events for delete to authenticated using (auth.uid() = host_id);
create policy "rsvps readable" on public.event_rsvps for select to authenticated using (true);
create policy "rsvps insert own" on public.event_rsvps for insert to authenticated with check (auth.uid() = user_id);
create policy "rsvps delete own" on public.event_rsvps for delete to authenticated using (auth.uid() = user_id);

-- Culture: music, poems, stories — readable by all signed-in users; only the author can post/remove their own
create policy "culture_music readable" on public.culture_music for select to authenticated using (true);
create policy "culture_music insert own" on public.culture_music for insert to authenticated with check (auth.uid() = author_id);
create policy "culture_music delete own" on public.culture_music for delete to authenticated using (auth.uid() = author_id);

create policy "culture_poems readable" on public.culture_poems for select to authenticated using (true);
create policy "culture_poems insert own" on public.culture_poems for insert to authenticated with check (auth.uid() = author_id);
create policy "culture_poems delete own" on public.culture_poems for delete to authenticated using (auth.uid() = author_id);

create policy "culture_stories readable" on public.culture_stories for select to authenticated using (true);
create policy "culture_stories insert own" on public.culture_stories for insert to authenticated with check (auth.uid() = author_id);
create policy "culture_stories delete own" on public.culture_stories for delete to authenticated using (auth.uid() = author_id);

-- Property listings: readable by all signed-in users; only the poster can post/remove their own
create policy "property_listings readable" on public.property_listings for select to authenticated using (true);
create policy "property_listings insert own" on public.property_listings for insert to authenticated with check (auth.uid() = author_id);
create policy "property_listings delete own" on public.property_listings for delete to authenticated using (auth.uid() = author_id);

-- Jobs
create policy "jobs readable" on public.jobs for select to authenticated using (true);
create policy "jobs insert own" on public.jobs for insert to authenticated with check (auth.uid() = poster_id);
create policy "jobs delete own" on public.jobs for delete to authenticated using (auth.uid() = poster_id);

-- Restaurant submissions: users create; only service role reads (curation)
create policy "restaurant submissions insert own" on public.restaurant_submissions
  for insert to authenticated with check (auth.uid() = submitted_by);

-- Family tree: PRIVATE — only the owner can see their own tree
create policy "family own only" on public.family_members for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Follows
create policy "follows readable" on public.follows for select to authenticated using (true);
create policy "follows insert own" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "follows delete own" on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- Reports: users create; only service role reads (moderation dashboard)
create policy "reports insert own" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);

-- Blocks
create policy "blocks own" on public.blocked_users for all to authenticated
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- ============================================================
-- STORAGE: create a public bucket named 'post-images' in the
-- Supabase dashboard (Storage → New bucket → public), then run
-- the policies below so uploads actually work.
-- ============================================================
create policy "post-images public read"
on storage.objects for select
to public
using (bucket_id = 'post-images');

create policy "post-images authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'post-images');

-- ============================================================
-- STORAGE: video posts. Create a public bucket named
-- 'post-videos' in the Supabase dashboard (Storage → New bucket
-- → public), then run the policies below.
-- ============================================================
create policy "post-videos public read"
on storage.objects for select
to public
using (bucket_id = 'post-videos');

create policy "post-videos authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'post-videos');

-- ============================================================
-- STORAGE: profile avatars. Create a public bucket named
-- 'avatars' in the Supabase dashboard (Storage → New bucket
-- → public), then run the policies below.
-- ============================================================
create policy "avatars public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "avatars authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars');

-- ============================================================
-- MIGRATION: run this if your posts table was created before
-- video support was added (i.e. on an existing live project).
-- ============================================================
alter table public.posts add column if not exists video_url text;

-- ============================================================
-- MIGRATION: social links + phone/WhatsApp on profiles (run this
-- on an existing live project — profiles was created before these
-- columns existed).
-- ============================================================
alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists facebook_url text;
alter table public.profiles add column if not exists tiktok_url text;
alter table public.profiles add column if not exists x_url text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists phone text;

-- ============================================================
-- MIGRATION: Culture section (music, poems, stories) — run this
-- in full on an existing live project. Safe to re-run.
-- ============================================================
create table if not exists public.culture_music (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text not null,
  audio_url text,
  external_url text,
  created_at timestamptz default now()
);

create table if not exists public.culture_poems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  media_url text,
  created_at timestamptz default now()
);

create table if not exists public.culture_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  external_url text,
  created_at timestamptz default now()
);

alter table public.culture_music enable row level security;
alter table public.culture_poems enable row level security;
alter table public.culture_stories enable row level security;

drop policy if exists "culture_music readable" on public.culture_music;
create policy "culture_music readable" on public.culture_music for select to authenticated using (true);
drop policy if exists "culture_music insert own" on public.culture_music;
create policy "culture_music insert own" on public.culture_music for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "culture_music delete own" on public.culture_music;
create policy "culture_music delete own" on public.culture_music for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "culture_poems readable" on public.culture_poems;
create policy "culture_poems readable" on public.culture_poems for select to authenticated using (true);
drop policy if exists "culture_poems insert own" on public.culture_poems;
create policy "culture_poems insert own" on public.culture_poems for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "culture_poems delete own" on public.culture_poems;
create policy "culture_poems delete own" on public.culture_poems for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "culture_stories readable" on public.culture_stories;
create policy "culture_stories readable" on public.culture_stories for select to authenticated using (true);
drop policy if exists "culture_stories insert own" on public.culture_stories;
create policy "culture_stories insert own" on public.culture_stories for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "culture_stories delete own" on public.culture_stories;
create policy "culture_stories delete own" on public.culture_stories for delete to authenticated using (auth.uid() = author_id);

-- ============================================================
-- STORAGE: culture music uploads. Create a public bucket named
-- 'culture-audio' in the Supabase dashboard (Storage → New bucket
-- → public), then run the policies below.
-- ============================================================
drop policy if exists "culture-audio public read" on storage.objects;
create policy "culture-audio public read"
on storage.objects for select
to public
using (bucket_id = 'culture-audio');

drop policy if exists "culture-audio authenticated upload" on storage.objects;
create policy "culture-audio authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'culture-audio');

-- ============================================================
-- MIGRATION: Property section (classifieds board). Run this in
-- full on an existing live project. Safe to re-run.
-- ============================================================
create table if not exists public.property_listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('land', 'house')),
  transaction_type text not null check (transaction_type in ('sale', 'rent')),
  island text not null,
  location text not null,
  price text not null,
  description text default '',
  photo_urls text[] default '{}',
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  created_at timestamptz default now()
);
create index if not exists property_listings_island_idx on public.property_listings(island);

alter table public.property_listings enable row level security;

drop policy if exists "property_listings readable" on public.property_listings;
create policy "property_listings readable" on public.property_listings for select to authenticated using (true);
drop policy if exists "property_listings insert own" on public.property_listings;
create policy "property_listings insert own" on public.property_listings for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "property_listings delete own" on public.property_listings;
create policy "property_listings delete own" on public.property_listings for delete to authenticated using (auth.uid() = author_id);

-- ============================================================
-- STORAGE: property listing photos. Create a public bucket named
-- 'property-photos' in the Supabase dashboard (Storage → New
-- bucket → public), then run the policies below.
-- ============================================================
drop policy if exists "property-photos public read" on storage.objects;
create policy "property-photos public read"
on storage.objects for select to public
using (bucket_id = 'property-photos');

drop policy if exists "property-photos authenticated upload" on storage.objects;
create policy "property-photos authenticated upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'property-photos');

alter table public.profiles add column if not exists looking_for text;

-- ============================================================
-- SECURITY FIX (2026-08-24): live testing found RLS was NOT being
-- enforced on public.comments — any authenticated user could delete
-- ANY other user's comment. Same class of bug found earlier on
-- public.posts. Safe to re-run.
-- ============================================================
alter table public.comments enable row level security;

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select to authenticated using (true);

drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own" on public.comments for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete to authenticated using (auth.uid() = author_id);

alter table public.posts add column if not exists edited_at timestamptz;

create or replace function public.set_posts_edited_at()
returns trigger as $$
begin
  new.edited_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_set_edited_at on public.posts;
create trigger posts_set_edited_at
before update on public.posts
for each row
execute function public.set_posts_edited_at();

drop policy if exists "posts update own" on public.posts;
create policy "posts update own" on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
