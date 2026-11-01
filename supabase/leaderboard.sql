-- Hvem Var Det? leaderboard.
-- Paste all of this into Supabase: SQL Editor -> New query -> Run.
-- Safe to run more than once.
--
-- The game only talks to the database through the two functions below and
-- reads the two views. Nobody can read or edit the tables directly, and the
-- secret player ids never leave the database.

create table if not exists public.players (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 16),
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runs (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  mode text not null check (mode in ('easy', 'hard')),
  minutes int not null check (minutes > 0),
  character text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists runs_player_idx on public.runs (player_id, created_at desc);

alter table public.players enable row level security;
alter table public.runs enable row level security;
revoke all on public.players, public.runs from anon, authenticated;

-- Most points in total.
create or replace view public.leaderboard_points as
  select name, points, updated_at
  from public.players
  where points > 0;

-- Each player's fastest finished run per mode, in game minutes.
create or replace view public.leaderboard_fastest as
  select distinct on (r.player_id, r.mode)
    p.name, r.mode, r.minutes, r.character, r.created_at
  from public.runs r
  join public.players p on p.id = r.player_id
  order by r.player_id, r.mode, r.minutes asc, r.created_at asc;

grant select on public.leaderboard_points, public.leaderboard_fastest to anon, authenticated;

create or replace function public.clean_name(p_name text) returns text
language sql immutable as $$
  select left(trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 16)
$$;

-- Called by the game when a whole run (3 or 5 cases) is solved.
create or replace function public.record_run(p_id uuid, p_name text, p_mode text, p_minutes int, p_character text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  clean text := public.clean_name(p_name);
  cases int := case p_mode when 'easy' then 3 when 'hard' then 5 end;
begin
  if cases is null then raise exception 'unknown mode'; end if;
  if char_length(clean) < 2 then raise exception 'name too short'; end if;
  if p_minutes < cases * 5 or p_minutes > cases * 600 then raise exception 'impossible time'; end if;
  if exists (select 1 from public.runs where player_id = p_id and created_at > now() - interval '30 seconds') then
    raise exception 'too many runs, wait a little';
  end if;

  insert into public.players (id, name, points)
  values (p_id, clean, case p_mode when 'easy' then 1 else 2 end)
  on conflict (id) do update
    set name = excluded.name,
        points = public.players.points + excluded.points,
        updated_at = now();

  insert into public.runs (player_id, mode, minutes, character)
  values (p_id, p_mode, p_minutes, left(coalesce(p_character, ''), 20));
end;
$$;

-- Lets a player change the name shown on the leaderboard.
create or replace function public.set_name(p_id uuid, p_name text)
returns void
language plpgsql security definer set search_path = public as $$
declare clean text := public.clean_name(p_name);
begin
  if char_length(clean) < 2 then raise exception 'name too short'; end if;
  update public.players set name = clean, updated_at = now() where id = p_id;
end;
$$;

revoke all on function public.record_run(uuid, text, text, int, text) from public;
revoke all on function public.set_name(uuid, text) from public;
grant execute on function public.record_run(uuid, text, text, int, text) to anon, authenticated;
grant execute on function public.set_name(uuid, text) to anon, authenticated;
