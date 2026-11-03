-- Gwpm multi-tenant schema (Supabase / Postgres)
-- Run in the Supabase SQL Editor after creating the project. Safe to re-run.
--
-- The Next.js server calls gwpm_load_data() and gwpm_replace_data(payload, revision)
-- with the service role. Org isolation stays in the app (session org id).
-- RLS is enabled with no policies, so the anon key cannot read password hashes.

-- Optional. Gwpm ids are generated in the app; skip quietly if the image has no pgcrypto.
do $$
begin
  create extension if not exists pgcrypto;
exception
  when others then
    raise notice 'pgcrypto unavailable (%). Continuing.', sqlerrm;
end $$;

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

create table if not exists gwpm_meta (
  id int primary key check (id = 1),
  revision bigint not null default 0
);

insert into gwpm_meta (id, revision) values (1, 0)
on conflict (id) do nothing;

alter table organizations enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table project_trades enable row level security;
alter table trade_dependencies enable row level security;
alter table procurement_items enable row level security;
alter table work_logs enable row level security;
alter table work_log_photos enable row level security;
alter table trade_comments enable row level security;
alter table notifications enable row level security;
alter table gwpm_meta enable row level security;

-- No policies: anon and authenticated are denied. Service role bypasses RLS.
-- The security-definer functions below run as the table owner.

create or replace function gwpm_load_data()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  rev bigint;
begin
  select revision into rev from gwpm_meta where id = 1;
  if rev is null then
    rev := 0;
  end if;

  return jsonb_build_object(
    'revision', rev,
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'createdAt', o.created_at
      ) order by o.id)
      from organizations o
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id,
        'orgId', u.org_id,
        'email', u.email,
        'name', u.name,
        'companyName', u.company_name,
        'phoneE164', u.phone_e164,
        'roleDefault', u.role_default,
        'passwordHash', u.password_hash,
        'createdAt', u.created_at
      ) order by u.id)
      from users u
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'orgId', p.org_id,
        'name', p.name,
        'location', p.location,
        'clientDisplayName', p.client_display_name,
        'status', p.status,
        'plannedStart', p.planned_start,
        'plannedEnd', p.planned_end,
        'notes', p.notes,
        'createdAt', p.created_at,
        'updatedAt', p.updated_at
      ) order by p.id)
      from projects p
    ), '[]'::jsonb),
    'trades', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'projectId', t.project_id,
        'name', t.name,
        'assigneeUserId', t.assignee_user_id,
        'status', t.status,
        'plannedStart', t.planned_start,
        'plannedEnd', t.planned_end,
        'actualStart', t.actual_start,
        'actualEnd', t.actual_end,
        'sortOrder', t.sort_order,
        'notes', t.notes
      ) order by t.sort_order, t.id)
      from project_trades t
    ), '[]'::jsonb),
    'dependencies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'projectId', d.project_id,
        'tradeId', d.trade_id,
        'dependsOnTradeId', d.depends_on_trade_id,
        'requiredStatus', d.required_status
      ) order by d.id)
      from trade_dependencies d
    ), '[]'::jsonb),
    'procurements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'projectId', i.project_id,
        'tradeId', i.trade_id,
        'name', i.name,
        'qty', i.qty,
        'unit', i.unit,
        'status', i.status,
        'supplierNote', i.supplier_note,
        'updatedAt', i.updated_at
      ) order by i.id)
      from procurement_items i
    ), '[]'::jsonb),
    'workLogs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'projectTradeId', l.project_trade_id,
        'authorUserId', l.author_user_id,
        'body', l.body,
        'createdAt', l.created_at
      ) order by l.created_at, l.id)
      from work_logs l
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ph.id,
        'workLogId', ph.work_log_id,
        'url', ph.url,
        'width', ph.width,
        'height', ph.height,
        'createdAt', ph.created_at
      ) order by ph.id)
      from work_log_photos ph
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'projectTradeId', c.project_trade_id,
        'authorUserId', c.author_user_id,
        'body', c.body,
        'createdAt', c.created_at
      ) order by c.created_at, c.id)
      from trade_comments c
    ), '[]'::jsonb),
    'notifications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id,
        'userId', n.user_id,
        'type', n.type,
        'title', n.title,
        'body', n.body,
        'entityType', n.entity_type,
        'entityId', n.entity_id,
        'href', n.href,
        'readAt', n.read_at,
        'createdAt', n.created_at
      ) order by n.created_at, n.id)
      from notifications n
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function gwpm_replace_data(payload jsonb, expected_revision bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  current_rev bigint;
begin
  insert into gwpm_meta (id, revision) values (1, 0)
  on conflict (id) do nothing;

  select revision into current_rev
  from gwpm_meta
  where id = 1
  for update;

  if expected_revision is not null and current_rev is distinct from expected_revision then
    raise exception 'revision_conflict' using errcode = '40001';
  end if;

  delete from work_log_photos;
  delete from trade_comments;
  delete from work_logs;
  delete from trade_dependencies;
  delete from procurement_items;
  delete from notifications;
  delete from project_trades;
  delete from projects;
  delete from users;
  delete from organizations;

  insert into organizations (id, name, created_at)
  select id, name, coalesce("createdAt", now())
  from jsonb_to_recordset(coalesce(payload->'organizations', '[]'::jsonb))
    as x(id text, name text, "createdAt" timestamptz);

  insert into users (
    id, org_id, email, name, company_name, phone_e164, role_default, password_hash, created_at
  )
  select
    id,
    "orgId",
    email,
    name,
    coalesce("companyName", ''),
    coalesce("phoneE164", ''),
    "roleDefault",
    "passwordHash",
    coalesce("createdAt", now())
  from jsonb_to_recordset(coalesce(payload->'users', '[]'::jsonb))
    as x(
      id text,
      "orgId" text,
      email text,
      name text,
      "companyName" text,
      "phoneE164" text,
      "roleDefault" text,
      "passwordHash" text,
      "createdAt" timestamptz
    );

  insert into projects (
    id, org_id, name, location, client_display_name, status,
    planned_start, planned_end, notes, created_at, updated_at
  )
  select
    id,
    "orgId",
    name,
    coalesce(location, ''),
    coalesce("clientDisplayName", ''),
    status,
    coalesce("plannedStart", ''),
    coalesce("plannedEnd", ''),
    coalesce(notes, ''),
    coalesce("createdAt", now()),
    coalesce("updatedAt", now())
  from jsonb_to_recordset(coalesce(payload->'projects', '[]'::jsonb))
    as x(
      id text,
      "orgId" text,
      name text,
      location text,
      "clientDisplayName" text,
      status text,
      "plannedStart" text,
      "plannedEnd" text,
      notes text,
      "createdAt" timestamptz,
      "updatedAt" timestamptz
    );

  insert into project_trades (
    id, project_id, name, assignee_user_id, status,
    planned_start, planned_end, actual_start, actual_end, sort_order, notes
  )
  select
    id,
    "projectId",
    name,
    nullif("assigneeUserId", ''),
    status,
    coalesce("plannedStart", ''),
    coalesce("plannedEnd", ''),
    nullif("actualStart", ''),
    nullif("actualEnd", ''),
    coalesce("sortOrder", 0),
    coalesce(notes, '')
  from jsonb_to_recordset(coalesce(payload->'trades', '[]'::jsonb))
    as x(
      id text,
      "projectId" text,
      name text,
      "assigneeUserId" text,
      status text,
      "plannedStart" text,
      "plannedEnd" text,
      "actualStart" text,
      "actualEnd" text,
      "sortOrder" int,
      notes text
    );

  insert into trade_dependencies (
    id, project_id, trade_id, depends_on_trade_id, required_status
  )
  select id, "projectId", "tradeId", "dependsOnTradeId", "requiredStatus"
  from jsonb_to_recordset(coalesce(payload->'dependencies', '[]'::jsonb))
    as x(
      id text,
      "projectId" text,
      "tradeId" text,
      "dependsOnTradeId" text,
      "requiredStatus" text
    );

  insert into procurement_items (
    id, project_id, trade_id, name, qty, unit, status, supplier_note, updated_at
  )
  select
    id,
    "projectId",
    nullif("tradeId", ''),
    name,
    coalesce(qty, 1),
    coalesce(unit, '件'),
    status,
    coalesce("supplierNote", ''),
    coalesce("updatedAt", now())
  from jsonb_to_recordset(coalesce(payload->'procurements', '[]'::jsonb))
    as x(
      id text,
      "projectId" text,
      "tradeId" text,
      name text,
      qty numeric,
      unit text,
      status text,
      "supplierNote" text,
      "updatedAt" timestamptz
    );

  insert into work_logs (id, project_trade_id, author_user_id, body, created_at)
  select id, "projectTradeId", "authorUserId", body, coalesce("createdAt", now())
  from jsonb_to_recordset(coalesce(payload->'workLogs', '[]'::jsonb))
    as x(
      id text,
      "projectTradeId" text,
      "authorUserId" text,
      body text,
      "createdAt" timestamptz
    );

  insert into work_log_photos (id, work_log_id, url, width, height, created_at)
  select
    id,
    "workLogId",
    url,
    coalesce(width, 0),
    coalesce(height, 0),
    coalesce("createdAt", now())
  from jsonb_to_recordset(coalesce(payload->'photos', '[]'::jsonb))
    as x(
      id text,
      "workLogId" text,
      url text,
      width int,
      height int,
      "createdAt" timestamptz
    );

  insert into trade_comments (id, project_trade_id, author_user_id, body, created_at)
  select id, "projectTradeId", "authorUserId", body, coalesce("createdAt", now())
  from jsonb_to_recordset(coalesce(payload->'comments', '[]'::jsonb))
    as x(
      id text,
      "projectTradeId" text,
      "authorUserId" text,
      body text,
      "createdAt" timestamptz
    );

  insert into notifications (
    id, user_id, type, title, body, entity_type, entity_id, href, read_at, created_at
  )
  select
    id,
    "userId",
    type,
    title,
    body,
    "entityType",
    "entityId",
    href,
    "readAt",
    coalesce("createdAt", now())
  from jsonb_to_recordset(coalesce(payload->'notifications', '[]'::jsonb))
    as x(
      id text,
      "userId" text,
      type text,
      title text,
      body text,
      "entityType" text,
      "entityId" text,
      href text,
      "readAt" timestamptz,
      "createdAt" timestamptz
    );

  update gwpm_meta set revision = current_rev + 1 where id = 1;
  return current_rev + 1;
end;
$$;

revoke all on function public.gwpm_load_data() from public;
revoke all on function public.gwpm_replace_data(jsonb, bigint) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function public.gwpm_load_data() from anon';
    execute 'revoke all on function public.gwpm_replace_data(jsonb, bigint) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on function public.gwpm_load_data() from authenticated';
    execute 'revoke all on function public.gwpm_replace_data(jsonb, bigint) from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.gwpm_load_data() to service_role';
    execute 'grant execute on function public.gwpm_replace_data(jsonb, bigint) to service_role';
  end if;
end $$;

-- Photo bucket. Skipped when this file is applied outside Supabase.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    execute $sql$
      insert into storage.buckets (id, name, "public")
      values ('gwpm-uploads', 'gwpm-uploads', true)
      on conflict (id) do update set "public" = excluded."public"
    $sql$;
  end if;

  if to_regclass('storage.objects') is not null
     and not exists (
       select 1 from pg_policies
       where schemaname = 'storage'
         and tablename = 'objects'
         and policyname = 'gwpm_uploads_public_read'
     ) then
    execute $sql$
      create policy gwpm_uploads_public_read
      on storage.objects
      for select
      to public
      using (bucket_id = 'gwpm-uploads')
    $sql$;
  end if;
end $$;

notify pgrst, 'reload schema';
