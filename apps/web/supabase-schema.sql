-- Supabase schema for OpenClaw Web
-- Run this in the Supabase SQL editor to create the required tables

-- API Keys table
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  api_key text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- Telegram config table
create table if not exists public.telegram_config (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  bot_token text not null,
  bot_username text,
  bot_name text,
  status text default 'disconnected',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan text default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  status text default 'active' check (status in ('active', 'canceled', 'past_due')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat history table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  provider text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.api_keys enable row level security;
alter table public.telegram_config enable row level security;
alter table public.subscriptions enable row level security;
alter table public.chat_messages enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can manage their own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own Telegram config"
  on public.telegram_config for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own subscription"
  on public.subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own chat messages"
  on public.chat_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create starter subscription on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'starter', 'active');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
