-- MusicSimple Supabase schema
-- À exécuter dans Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.playlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id text not null,
  title text not null,
  artist text not null,
  thumbnail text not null,
  source_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  title text not null,
  artist text not null,
  thumbnail text not null,
  source_url text not null,
  created_at timestamptz not null default now(),
  unique(user_id, track_id)
);

create table if not exists public.recently_played (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  title text not null,
  artist text not null,
  thumbnail text not null,
  source_url text not null,
  played_at timestamptz not null default now()
);

alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.favorites enable row level security;
alter table public.recently_played enable row level security;

drop policy if exists "Users can read own playlists" on public.playlists;
create policy "Users can read own playlists"
on public.playlists for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own playlists" on public.playlists;
create policy "Users can create own playlists"
on public.playlists for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own playlists" on public.playlists;
create policy "Users can update own playlists"
on public.playlists for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own playlists" on public.playlists;
create policy "Users can delete own playlists"
on public.playlists for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read tracks from own playlists" on public.playlist_tracks;
create policy "Users can read tracks from own playlists"
on public.playlist_tracks for select
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_tracks.playlist_id
    and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can add tracks to own playlists" on public.playlist_tracks;
create policy "Users can add tracks to own playlists"
on public.playlist_tracks for insert
with check (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_tracks.playlist_id
    and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can update tracks in own playlists" on public.playlist_tracks;
create policy "Users can update tracks in own playlists"
on public.playlist_tracks for update
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_tracks.playlist_id
    and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete tracks in own playlists" on public.playlist_tracks;
create policy "Users can delete tracks in own playlists"
on public.playlist_tracks for delete
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_tracks.playlist_id
    and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
on public.favorites for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own recently played" on public.recently_played;
create policy "Users can manage own recently played"
on public.recently_played for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists playlist_tracks_playlist_position_idx
on public.playlist_tracks(playlist_id, position);

create index if not exists playlists_user_created_idx
on public.playlists(user_id, created_at desc);
