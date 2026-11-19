-- Lịch Desktop — Supabase PostgreSQL Schema (Offline-First + Cloud Sync)
-- Run this once in Supabase SQL Editor to enable multi-device Cloud Sync.

create extension if not exists "pgcrypto";

-- 1. Calendar Events
create table if not exists public.calendar_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  start_date date not null,
  end_date date not null,
  start_time text,
  end_time text,
  all_day boolean not null default true,
  category text not null default 'personal'
    check (category in ('work', 'personal', 'family', 'health', 'holiday', 'other')),
  color text not null default '#0D7A5F',
  recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly', 'lunar-monthly', 'lunar-yearly')),
  lunar_day smallint check (lunar_day is null or (lunar_day between 1 and 30)),
  lunar_month smallint check (lunar_month is null or (lunar_month between 1 and 12)),
  reminder_minutes integer check (reminder_minutes is null or reminder_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_calendar_events_user_date
  on public.calendar_events (user_id, start_date);
create index if not exists idx_calendar_events_user_updated
  on public.calendar_events (user_id, updated_at);

-- 2. Tasks
create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date);
create index if not exists idx_tasks_user_updated on public.tasks (user_id, updated_at);

-- 3. Habits & Habit Logs (Milestone 2)
create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#0D7A5F',
  target_days_per_week smallint not null default 7 check (target_days_per_week between 1 and 7),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.habit_logs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_habit_logs_user_date on public.habit_logs (user_id, log_date);

-- 4. Daily Notes & Mood (Milestone 2)
create table if not exists public.daily_notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  content text not null default '',
  mood text check (mood is null or mood in ('great', 'good', 'neutral', 'low', 'stressed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists idx_daily_notes_user_date
  on public.daily_notes (user_id, note_date) where deleted_at is null;

-- 5. Finance Transactions, Goals & Countdowns (Milestone 3)
create table if not exists public.finance_transactions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tx_date date not null,
  kind text not null check (kind in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  category text not null default 'Khác',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_finance_user_date on public.finance_transactions (user_id, tx_date);

create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date,
  progress smallint not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.countdowns (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date not null,
  is_lunar boolean not null default false,
  lunar_day smallint,
  lunar_month smallint,
  color text not null default '#D9381E',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Row Level Security (strict per-user isolation)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'calendar_events',
    'tasks',
    'habits',
    'habit_logs',
    'daily_notes',
    'finance_transactions',
    'goals',
    'countdowns'
  ]
  loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format('drop policy if exists "Users manage own rows" on public.%I;', tbl);
    execute format(
      'create policy "Users manage own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      tbl
    );
  end loop;
end $$;
