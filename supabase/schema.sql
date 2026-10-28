-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('home','student','staff')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  quantity text not null,
  expiry_date date not null,
  last_alerted_on date,
  created_at timestamptz not null default now()
);
create index if not exists food_items_expiry_idx on food_items(expiry_date);

create table if not exists token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('bottle','donation','redeem')),
  image_hash text,
  created_at timestamptz not null default now()
);
-- the same photo / certificate can never be rewarded twice for one student
create unique index if not exists token_ledger_hash_uq on token_ledger(user_id, image_hash) where image_hash is not null;
create index if not exists token_ledger_user_idx on token_ledger(user_id, created_at desc);

create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tokens int not null check (tokens > 0),
  rupees numeric(10,2) not null,
  code text not null,
  status text not null default 'pending' check (status in ('pending','fulfilled')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);
create index if not exists redemptions_code_idx on redemptions(code);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references profiles(id) on delete cascade,
  item_name text not null,
  description text not null default '',
  quantity int not null check (quantity > 0),
  original_price numeric(10,2) not null,
  discount_percent int not null check (discount_percent between 1 and 90),
  new_price numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  category text not null check (category in ('donate','exchange','repair')),
  message text not null,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists community_created_idx on community_posts(created_at desc);

-- All access goes through the FastAPI backend (service role). RLS on + no policies = browser clients get nothing directly.
alter table profiles enable row level security;
alter table food_items enable row level security;
alter table token_ledger enable row level security;
alter table redemptions enable row level security;
alter table offers enable row level security;
alter table community_posts enable row level security;

create or replace function token_balance(p_user uuid) returns int
language sql stable as $$
  select coalesce(sum(delta), 0)::int from token_ledger where user_id = p_user
$$;

-- Atomic redemption: 10 tokens = Rs 1 (50 tokens = Rs 5). Locks the profile row so double-clicks can't overspend.
create or replace function redeem_tokens(p_user uuid, p_tokens int) returns redemptions
language plpgsql as $$
declare bal int; r redemptions;
begin
  perform 1 from profiles where id = p_user for update;
  select coalesce(sum(delta), 0) into bal from token_ledger where user_id = p_user;
  if p_tokens < 10 or p_tokens % 10 <> 0 then raise exception 'Redeem in multiples of 10 tokens'; end if;
  if p_tokens > bal then raise exception 'Not enough tokens'; end if;
  insert into token_ledger(user_id, delta, reason) values (p_user, -p_tokens, 'redeem');
  insert into redemptions(user_id, tokens, rupees, code)
    values (p_user, p_tokens, p_tokens / 10.0, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)))
    returning * into r;
  return r;
end $$;

-- public bucket for community notice-board photos
insert into storage.buckets (id, name, public) values ('community', 'community', true) on conflict (id) do nothing;
