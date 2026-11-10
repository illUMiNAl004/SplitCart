-- Draft schema, matches src/lib/types.ts. Not applied yet.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null check (email ~* '\.edu$'),
  venmo text not null,
  phone text check (phone ~ '^[0-9]{10}$'),
  area text not null,
  created_at timestamptz default now()
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  host_id uuid not null references profiles(id),
  area text not null,
  deadline timestamptz not null,
  min_people int not null default 2 check (min_people between 2 and 6),
  status text not null default 'open' check (status in ('open','ordered','arrived','settled')),
  final_tax numeric(10,2),
  final_shipping numeric(10,2),
  created_at timestamptz default now()
);

create table cart_members (
  cart_id uuid references carts(id) on delete cascade,
  user_id uuid references profiles(id),
  items_total numeric(10,2) not null check (items_total > 0),
  items_note text,
  paid boolean not null default false,
  joined_at timestamptz default now(),
  primary key (cart_id, user_id)
);

-- RLS plan: signed-in students can read open carts, members edit their own row,
-- only the host updates status, tax, shipping and paid flags. Phone numbers are
-- only visible to members of the same cart.
alter table profiles enable row level security;
alter table carts enable row level security;
alter table cart_members enable row level security;
-- TODO: policies
