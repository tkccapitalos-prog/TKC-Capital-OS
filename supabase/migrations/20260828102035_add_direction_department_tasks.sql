begin;

-- Department tasks reuse the existing tasks table. Their title is stored in
-- metadata while note remains the full operational description.
alter table public.tasks
  drop constraint if exists tasks_department_task_content_check;

alter table public.tasks
  add constraint tasks_department_task_content_check
  check (
    event_type <> 'department_task'
    or (
      char_length(btrim(coalesce(metadata ->> 'title', ''))) between 1 and 160
      and char_length(btrim(coalesce(note, ''))) between 1 and 4000
    )
  );

-- Operators keep the ability to report operational events in an authorized
-- department. Only direction can create a managed department task.
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
  and (
    event_type <> 'department_task'
    or app_private.is_direction()
  )
);

-- The client only needs to change execution state. Content, department and
-- assignment cannot be rewritten by an operator through the Data API.
revoke update on table public.tasks from authenticated;
grant update (status, completed_at, updated_at) on table public.tasks to authenticated;

commit;
