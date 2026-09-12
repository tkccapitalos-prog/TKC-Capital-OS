begin;

-- Tracked handovers are durable operational topics. An unresolved item remains
-- visible across shifts; no copy is created and no previous history is changed.
create table public.handover_topics (
  id uuid primary key default gen_random_uuid(),
  property_code text not null default 'ibis_nogent',
  source_department text not null,
  target_departments text[] not null,
  title text not null,
  details text not null,
  location text,
  priority text not null default 'normal',
  status text not null default 'open',
  shift_code text not null default 'other',
  due_at timestamptz,
  created_by_operator_id uuid not null,
  owner_operator_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint handover_topics_created_by_operator_id_fkey
    foreign key (created_by_operator_id) references public.operator_profiles(id) on delete restrict,
  constraint handover_topics_owner_operator_id_fkey
    foreign key (owner_operator_id) references public.operator_profiles(id) on delete set null,
  constraint handover_topics_property_code_check
    check (char_length(btrim(property_code)) between 1 and 80),
  constraint handover_topics_source_department_check
    check (char_length(btrim(source_department)) between 1 and 80),
  constraint handover_topics_target_departments_check
    check (cardinality(target_departments) between 1 and 12),
  constraint handover_topics_title_check
    check (char_length(btrim(title)) between 1 and 160),
  constraint handover_topics_details_check
    check (char_length(btrim(details)) between 1 and 4000),
  constraint handover_topics_location_check
    check (location is null or char_length(btrim(location)) between 1 and 80),
  constraint handover_topics_priority_check
    check (priority in ('normal', 'urgent', 'blocked')),
  constraint handover_topics_status_check
    check (status in ('open', 'in_progress', 'blocked', 'done')),
  constraint handover_topics_shift_code_check
    check (shift_code in ('morning', 'evening', 'night', 'other')),
  constraint handover_topics_closed_at_check
    check ((status = 'done' and closed_at is not null) or (status <> 'done' and closed_at is null))
);

create index handover_topics_open_idx
  on public.handover_topics (property_code, priority, created_at desc)
  where status <> 'done';
create index handover_topics_source_department_idx
  on public.handover_topics (source_department, created_at desc);
create index handover_topics_target_departments_idx
  on public.handover_topics using gin (target_departments);
create index handover_topics_owner_idx
  on public.handover_topics (owner_operator_id, status);

create table public.handover_acknowledgements (
  topic_id uuid not null,
  operator_id uuid not null,
  acknowledged_at timestamptz not null default now(),
  constraint handover_acknowledgements_pkey primary key (topic_id, operator_id),
  constraint handover_acknowledgements_topic_id_fkey
    foreign key (topic_id) references public.handover_topics(id) on delete cascade,
  constraint handover_acknowledgements_operator_id_fkey
    foreign key (operator_id) references public.operator_profiles(id) on delete restrict
);

create index handover_acknowledgements_operator_idx
  on public.handover_acknowledgements (operator_id, acknowledged_at desc);

alter table public.handover_topics enable row level security;
alter table public.handover_acknowledgements enable row level security;

revoke all on table public.handover_topics from anon, authenticated;
revoke all on table public.handover_acknowledgements from anon, authenticated;
grant select, insert on table public.handover_topics to authenticated;
grant update (status, owner_operator_id, updated_at, closed_at)
  on table public.handover_topics to authenticated;
grant select, insert on table public.handover_acknowledgements to authenticated;

create or replace function app_private.can_access_handover(
  target_source_department text,
  target_departments text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_direction(), false)
    or app_private.can_access_department(target_source_department)
    or exists (
      select 1
      from unnest(coalesce(target_departments, '{}'::text[])) department_id
      where app_private.can_access_department(department_id)
    );
$$;

create or replace function app_private.can_access_handover_id(target_topic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.handover_topics topic
    where topic.id = target_topic_id
      and app_private.can_access_handover(topic.source_department, topic.target_departments)
  );
$$;

revoke all on function app_private.can_access_handover(text, text[]) from public, anon;
revoke all on function app_private.can_access_handover_id(uuid) from public, anon;
grant execute on function app_private.can_access_handover(text, text[]) to authenticated;
grant execute on function app_private.can_access_handover_id(uuid) to authenticated;

create policy handover_topics_read_authorized
on public.handover_topics
for select
to authenticated
using (app_private.can_access_handover(source_department, target_departments));

create policy handover_topics_insert_authorized
on public.handover_topics
for insert
to authenticated
with check (
  property_code = 'ibis_nogent'
  and created_by_operator_id = app_private.current_operator_id()
  and (
    app_private.is_direction()
    or app_private.can_access_department(source_department)
  )
);

create policy handover_topics_update_authorized
on public.handover_topics
for update
to authenticated
using (app_private.can_access_handover(source_department, target_departments))
with check (app_private.can_access_handover(source_department, target_departments));

create policy handover_acknowledgements_read_authorized
on public.handover_acknowledgements
for select
to authenticated
using (app_private.can_access_handover_id(topic_id));

create policy handover_acknowledgements_insert_own
on public.handover_acknowledgements
for insert
to authenticated
with check (
  operator_id = app_private.current_operator_id()
  and app_private.can_access_handover_id(topic_id)
);

commit;
