begin;

create table if not exists public.housekeeping_binome_assignments (
  service_date date not null,
  binome_id uuid not null,
  operator_id uuid not null,
  assigned_by_operator_id uuid,
  created_at timestamptz not null default now(),
  constraint housekeeping_binome_assignments_pkey
    primary key (service_date, binome_id, operator_id),
  constraint housekeeping_binome_assignments_binome_id_fkey
    foreign key (binome_id) references public.housekeeping_binomes(id) on delete cascade,
  constraint housekeeping_binome_assignments_operator_id_fkey
    foreign key (operator_id) references public.operator_profiles(id) on delete cascade,
  constraint housekeeping_binome_assignments_assigned_by_operator_id_fkey
    foreign key (assigned_by_operator_id) references public.operator_profiles(id) on delete set null
);

create index if not exists housekeeping_binome_assignments_operator_date_idx
  on public.housekeeping_binome_assignments (operator_id, service_date, binome_id);
create index if not exists housekeeping_binome_assignments_binome_date_idx
  on public.housekeeping_binome_assignments (binome_id, service_date);
create index if not exists housekeeping_binome_assignments_assigned_by_idx
  on public.housekeeping_binome_assignments (assigned_by_operator_id);
create index if not exists housekeeping_rooms_room_binome_idx
  on public.housekeeping_rooms (room, binome_id);
create index if not exists tasks_room_idx
  on public.tasks (room)
  where room is not null;

alter table public.housekeeping_binome_assignments enable row level security;
grant select, insert, delete on table public.housekeeping_binome_assignments to authenticated;

revoke update on table public.operator_profiles from authenticated;
grant update (language, phone, nationality, job_title, updated_at)
  on table public.operator_profiles to authenticated;

create or replace function app_private.is_room_operator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.operator_profiles op
    join public.operator_departments od on od.operator_id = op.id
    where op.auth_user_id = (select auth.uid())
      and op.status = 'active'
      and op.account_status = 'active'
      and op.role = 'operator'
      and od.department_id = 'housekeeping'
  );
$$;

create or replace function app_private.has_room_assignment_today(target_room text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_room is not null
    and exists (
      select 1
      from public.housekeeping_binome_assignments hba
      join public.housekeeping_rooms hr on hr.binome_id = hba.binome_id
      where hba.operator_id = app_private.current_operator_id()
        and hba.service_date = (now() at time zone 'Europe/Paris')::date
        and hr.room = target_room
    );
$$;

create or replace function app_private.can_access_housekeeping_binome(target_binome_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_direction(), false)
    or (
      app_private.can_access_department('housekeeping')
      and (
        not app_private.is_room_operator()
        or exists (
          select 1
          from public.housekeeping_binome_assignments hba
          where hba.binome_id = target_binome_id
            and hba.operator_id = app_private.current_operator_id()
            and hba.service_date = (now() at time zone 'Europe/Paris')::date
        )
      )
    );
$$;

create or replace function app_private.can_access_housekeeping_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_direction(), false)
    or (
      app_private.can_access_department('housekeeping')
      and (
        not app_private.is_room_operator()
        or exists (
          select 1
          from public.housekeeping_binomes hb
          join public.housekeeping_binome_assignments hba on hba.binome_id = hb.id
          where hb.plan_id = target_plan_id
            and hba.operator_id = app_private.current_operator_id()
            and hba.service_date = (now() at time zone 'Europe/Paris')::date
        )
      )
    );
$$;

create or replace function app_private.can_access_housekeeping_room(target_binome_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.can_access_housekeeping_binome(target_binome_id);
$$;

create or replace function app_private.can_access_task(
  target_department_id text,
  target_room text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_direction(), false)
    or case
      when app_private.is_room_operator() then
        target_department_id in ('housekeeping', 'maintenance')
        and app_private.has_room_assignment_today(target_room)
      else app_private.can_access_department(target_department_id)
    end;
$$;

create or replace function app_private.can_access_task_id(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = target_task_id
      and app_private.can_access_task(t.department_id, t.room)
  );
$$;

create or replace function app_private.can_access_storage_object(
  target_bucket_id text,
  target_name text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  path_parts text[] := string_to_array(coalesce(target_name, ''), '/');
  task_id_text text := path_parts[2];
begin
  if target_bucket_id = 'department-documents' then
    return app_private.can_access_department(path_parts[1]);
  end if;

  if target_bucket_id = 'task-photos'
     and task_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return app_private.can_access_task_id(task_id_text::uuid);
  end if;

  return false;
end;
$$;

revoke all on function app_private.is_room_operator() from public, anon;
revoke all on function app_private.has_room_assignment_today(text) from public, anon;
revoke all on function app_private.can_access_housekeeping_binome(uuid) from public, anon;
revoke all on function app_private.can_access_housekeeping_plan(uuid) from public, anon;
revoke all on function app_private.can_access_housekeeping_room(uuid) from public, anon;
revoke all on function app_private.can_access_task(text, text) from public, anon;
revoke all on function app_private.can_access_task_id(uuid) from public, anon;
revoke all on function app_private.can_access_storage_object(text, text) from public, anon;

grant execute on function app_private.is_room_operator() to authenticated;
grant execute on function app_private.has_room_assignment_today(text) to authenticated;
grant execute on function app_private.can_access_housekeeping_binome(uuid) to authenticated;
grant execute on function app_private.can_access_housekeeping_plan(uuid) to authenticated;
grant execute on function app_private.can_access_housekeeping_room(uuid) to authenticated;
grant execute on function app_private.can_access_task(text, text) to authenticated;
grant execute on function app_private.can_access_task_id(uuid) to authenticated;
grant execute on function app_private.can_access_storage_object(text, text) to authenticated;

drop policy if exists housekeeping_binome_assignments_read_authorized
  on public.housekeeping_binome_assignments;
create policy housekeeping_binome_assignments_read_authorized
on public.housekeeping_binome_assignments
for select
to authenticated
using (
  app_private.is_direction()
  or operator_id = app_private.current_operator_id()
  or (
    not app_private.is_room_operator()
    and app_private.can_access_department('housekeeping')
  )
);

drop policy if exists housekeeping_binome_assignments_insert_direction
  on public.housekeeping_binome_assignments;
create policy housekeeping_binome_assignments_insert_direction
on public.housekeeping_binome_assignments
for insert
to authenticated
with check (app_private.is_direction());

drop policy if exists housekeeping_binome_assignments_delete_direction
  on public.housekeeping_binome_assignments;
create policy housekeeping_binome_assignments_delete_direction
on public.housekeeping_binome_assignments
for delete
to authenticated
using (app_private.is_direction());

create or replace function public.set_housekeeping_binome_assignments(
  target_binome_id uuid,
  target_service_date date,
  target_operator_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public, app_private, pg_temp
as $$
declare
  clean_operator_ids uuid[] := coalesce(target_operator_ids, '{}'::uuid[]);
  valid_operator_count integer;
begin
  if not app_private.is_direction() then
    raise exception 'direction_access_required' using errcode = '42501';
  end if;

  if target_service_date <> (now() at time zone 'Europe/Paris')::date then
    raise exception 'assignments_must_use_today' using errcode = '22023';
  end if;

  if not exists (select 1 from public.housekeeping_binomes where id = target_binome_id) then
    raise exception 'housekeeping_binome_not_found' using errcode = '22023';
  end if;

  select count(distinct op.id)
  into valid_operator_count
  from unnest(clean_operator_ids) requested(operator_id)
  join public.operator_profiles op on op.id = requested.operator_id
  where op.status = 'active'
    and op.account_status = 'active'
    and op.role in ('operator', 'supervisor')
    and exists (
      select 1
      from public.operator_departments od
      where od.operator_id = op.id
        and od.department_id = 'housekeeping'
    );

  if valid_operator_count <> cardinality(clean_operator_ids) then
    raise exception 'invalid_housekeeping_operator' using errcode = '22023';
  end if;

  delete from public.housekeeping_binome_assignments
  where service_date = target_service_date
    and binome_id = target_binome_id;

  insert into public.housekeeping_binome_assignments (
    service_date,
    binome_id,
    operator_id,
    assigned_by_operator_id
  )
  select
    target_service_date,
    target_binome_id,
    requested.operator_id,
    app_private.current_operator_id()
  from unnest(clean_operator_ids) requested(operator_id);
end;
$$;

revoke all on function public.set_housekeeping_binome_assignments(uuid, date, uuid[])
  from public, anon;
grant execute on function public.set_housekeeping_binome_assignments(uuid, date, uuid[])
  to authenticated;

drop policy if exists housekeeping_plans_read_housekeeping_access
  on public.housekeeping_plans;
drop policy if exists housekeeping_plans_read_authorized
  on public.housekeeping_plans;
create policy housekeeping_plans_read_authorized
on public.housekeeping_plans
for select
to authenticated
using (app_private.can_access_housekeeping_plan(id));

drop policy if exists housekeeping_binomes_read_housekeeping_access
  on public.housekeeping_binomes;
drop policy if exists housekeeping_binomes_read_authorized
  on public.housekeeping_binomes;
create policy housekeeping_binomes_read_authorized
on public.housekeeping_binomes
for select
to authenticated
using (app_private.can_access_housekeeping_binome(id));

drop policy if exists housekeeping_rooms_read_housekeeping_access
  on public.housekeeping_rooms;
drop policy if exists housekeeping_rooms_read_authorized
  on public.housekeeping_rooms;
create policy housekeeping_rooms_read_authorized
on public.housekeeping_rooms
for select
to authenticated
using (app_private.can_access_housekeeping_room(binome_id));

drop policy if exists housekeeping_rooms_update_housekeeping_access
  on public.housekeeping_rooms;
drop policy if exists housekeeping_rooms_update_authorized
  on public.housekeeping_rooms;
create policy housekeeping_rooms_update_authorized
on public.housekeeping_rooms
for update
to authenticated
using (app_private.can_access_housekeeping_room(binome_id))
with check (app_private.can_access_housekeeping_room(binome_id));

drop policy if exists tasks_read_by_department_access on public.tasks;
drop policy if exists tasks_read_authorized on public.tasks;
create policy tasks_read_authorized
on public.tasks
for select
to authenticated
using (app_private.can_access_task(department_id, room));

drop policy if exists tasks_insert_by_department_access on public.tasks;
drop policy if exists tasks_insert_authorized on public.tasks;
create policy tasks_insert_authorized
on public.tasks
for insert
to authenticated
with check (
  app_private.can_access_task(department_id, room)
  and (
    created_by_operator_id is null
    or created_by_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
);

drop policy if exists tasks_update_by_department_access on public.tasks;
drop policy if exists tasks_update_authorized on public.tasks;
create policy tasks_update_authorized
on public.tasks
for update
to authenticated
using (app_private.can_access_task(department_id, room))
with check (app_private.can_access_task(department_id, room));

drop policy if exists task_comments_read_by_task_access on public.task_comments;
drop policy if exists task_comments_read_authorized on public.task_comments;
create policy task_comments_read_authorized
on public.task_comments
for select
to authenticated
using (app_private.can_access_task_id(task_id));

drop policy if exists task_comments_insert_by_task_access on public.task_comments;
drop policy if exists task_comments_insert_authorized on public.task_comments;
create policy task_comments_insert_authorized
on public.task_comments
for insert
to authenticated
with check (
  app_private.can_access_task_id(task_id)
  and (
    author_operator_id is null
    or author_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
);

drop policy if exists task_comments_update_own_or_direction on public.task_comments;
create policy task_comments_update_own_or_direction
on public.task_comments
for update
to authenticated
using (
  app_private.can_access_task_id(task_id)
  and (
    author_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
)
with check (
  app_private.can_access_task_id(task_id)
  and (
    author_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
);

drop policy if exists task_comments_delete_own_or_direction on public.task_comments;
create policy task_comments_delete_own_or_direction
on public.task_comments
for delete
to authenticated
using (
  app_private.can_access_task_id(task_id)
  and (
    author_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
);

drop policy if exists task_attachments_read_by_task_access on public.task_attachments;
drop policy if exists task_attachments_read_authorized on public.task_attachments;
create policy task_attachments_read_authorized
on public.task_attachments
for select
to authenticated
using (app_private.can_access_task_id(task_id));

drop policy if exists task_attachments_insert_by_task_access on public.task_attachments;
drop policy if exists task_attachments_insert_authorized on public.task_attachments;
create policy task_attachments_insert_authorized
on public.task_attachments
for insert
to authenticated
with check (
  app_private.can_access_task_id(task_id)
  and (
    uploaded_by_operator_id is null
    or uploaded_by_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
);

drop policy if exists task_attachments_delete_own_or_direction on public.task_attachments;
create policy task_attachments_delete_own_or_direction
on public.task_attachments
for delete
to authenticated
using (
  app_private.can_access_task_id(task_id)
  and (
    uploaded_by_operator_id = app_private.current_operator_id()
    or app_private.is_direction()
  )
);

drop policy if exists tkc_storage_read_department_files on storage.objects;
drop policy if exists tkc_storage_read_authorized_files on storage.objects;
create policy tkc_storage_read_authorized_files
on storage.objects
for select
to authenticated
using (app_private.can_access_storage_object(bucket_id, name));

drop policy if exists tkc_storage_insert_department_files on storage.objects;
drop policy if exists tkc_storage_insert_authorized_files on storage.objects;
create policy tkc_storage_insert_authorized_files
on storage.objects
for insert
to authenticated
with check (app_private.can_access_storage_object(bucket_id, name));

drop policy if exists tkc_storage_update_department_files on storage.objects;
drop policy if exists tkc_storage_update_authorized_files on storage.objects;
create policy tkc_storage_update_authorized_files
on storage.objects
for update
to authenticated
using (
  app_private.can_access_storage_object(bucket_id, name)
  and (owner = (select auth.uid()) or app_private.is_direction())
)
with check (
  app_private.can_access_storage_object(bucket_id, name)
  and (owner = (select auth.uid()) or app_private.is_direction())
);

drop policy if exists tkc_storage_delete_department_files on storage.objects;
drop policy if exists tkc_storage_delete_authorized_files on storage.objects;
create policy tkc_storage_delete_authorized_files
on storage.objects
for delete
to authenticated
using (
  app_private.can_access_storage_object(bucket_id, name)
  and (owner = (select auth.uid()) or app_private.is_direction())
);

commit;
