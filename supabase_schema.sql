-- MASTER SCHEMA for Billing & Usage System
-- Includes: Profiles, Chats, Transactions, and Strict RLS Policies.

-- 1. Enable Extensions
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  balance decimal(10, 2) default 0.00,
  is_admin boolean default false,
  stripe_customer_id text,
  stripe_payment_method_id text,
  allow_overdraft boolean default false,
  auto_topup boolean default false,
  billing_cycle_anchor timestamp with time zone,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. CHATS TABLE (Usage)
create table if not exists public.chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id text,
  title text,
  model text not null,
  base_cost decimal(10, 4) not null,
  final_cost decimal(10, 4) not null,
  markup_percentage int, 
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. TRANSACTIONS TABLE (Payments)
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  stripe_payment_id text,
  status text check (status in ('succeeded', 'pending', 'failed')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. STRICT ACCESS CONTROL (RLS)
-- Goal: No client-side modification. Data is read-only for the user (owner).
-- Only the Backend (Service Role) and Triggers can modify data.

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can view own profile." on public.profiles;

create policy "Users can view own profile."
  on public.profiles for select
  using ( auth.uid() = id );

-- Chats
alter table public.chats enable row level security;
drop policy if exists "Users can view own chats." on public.chats;

create policy "Users can view own chats."
  on public.chats for select
  using ( auth.uid() = user_id );

-- Transactions
alter table public.transactions enable row level security;
drop policy if exists "Users can view own transactions." on public.transactions;

create policy "Users can view own transactions."
  on public.transactions for select
  using ( auth.uid() = user_id );


-- 6. AUTOMATION (New User Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger to be safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 7. MAINTENANCE (Backfill Existing Users)
-- Insert missing profiles for users who already exist
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
