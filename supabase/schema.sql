-- Gwpm multi-tenant schema (Supabase / Postgres)
-- Run in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  org_id text not null references organizations(id) on delete cascade,
  email text not null unique,
  name text not null,
  company_name text not null default '',
  phone_e164 text not null default '',
  role_default text not null check (role_default in ('owner', 'trade_lead')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_org_id_idx on users(org_id);

create table if not exists projects (
  id text primary key,
  org_id text not null references organizations(id) on delete cascade,
  name text not null,
  location text not null default '',
  client_display_name text not null default '',
  status text not null,
  planned_start text not null default '',
  planned_end text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_org_id_idx on projects(org_id);

create table if not exists project_trades (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  name text not null,
  assignee_user_id text references users(id) on delete set null,
  status text not null,
  planned_start text not null default '',
  planned_end text not null default '',
  actual_start text,
  actual_end text,
  sort_order int not null default 0,
  notes text not null default ''
);

create table if not exists trade_dependencies (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  trade_id text not null references project_trades(id) on delete cascade,
  depends_on_trade_id text not null references project_trades(id) on delete cascade,
  required_status text not null
);

create table if not exists procurement_items (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  trade_id text references project_trades(id) on delete set null,
  name text not null,
  qty numeric not null default 1,
  unit text not null default '件',
  status text not null,
  supplier_note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists work_logs (
  id text primary key,
  project_trade_id text not null references project_trades(id) on delete cascade,
  author_user_id text not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists work_log_photos (
  id text primary key,
  work_log_id text not null references work_logs(id) on delete cascade,
  url text not null,
  width int not null default 0,
  height int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists trade_comments (
  id text primary key,
  project_trade_id text not null references project_trades(id) on delete cascade,
  author_user_id text not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  entity_type text not null,
  entity_id text not null,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Storage bucket for site photos (create via Dashboard or):
-- insert into storage.buckets (id, name, public) values ('gwpm-uploads', 'gwpm-uploads', true);
