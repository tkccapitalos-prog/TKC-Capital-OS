function throwIfError(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

function groupByDepartment(rows, mapper) {
  return (rows || []).reduce((groups, row) => {
    const department = row.department_id;
    groups[department] = [...(groups[department] || []), mapper(row)];
    return groups;
  }, {});
}

async function signedFileUrl(supabase, bucketId, objectPath) {
  if (!bucketId || !objectPath) return "";
  const { data } = await supabase.storage
    .from(bucketId)
    .createSignedUrl(objectPath, 60 * 60);
  return data?.signedUrl || "";
}

async function mapTask(supabase, task) {
  const attachments = await Promise.all(
    (task.task_attachments || []).map(async (attachment) => ({
      id: attachment.id,
      type: "photo",
      reason: attachment.reason,
      name: attachment.file_name,
      size: Number(attachment.file_size) || 0,
      url: await signedFileUrl(supabase, attachment.bucket_id, attachment.object_path),
      createdAt: attachment.created_at,
    }))
  );

  return {
    id: task.id,
    department: task.department_id,
    eventType: task.event_type,
    room: task.room || "",
    priority: task.priority,
    status: task.status,
    title: task.metadata?.title || "",
    note: task.note,
    createdAt: task.created_at,
    comments: (task.task_comments || []).map((comment) => ({
      id: comment.id,
      text: comment.comment,
      createdAt: comment.created_at,
    })),
    attachments: attachments.filter((attachment) => attachment.url),
  };
}

function parisDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function loadTasks(supabase, profile) {
  let query = supabase
    .from("tasks")
    .select(`
      id,
      department_id,
      event_type,
      room,
      priority,
      status,
      note,
      metadata,
      created_at,
      task_comments(id, comment, created_at),
      task_attachments(id, reason, bucket_id, object_path, file_name, file_size, created_at)
    `);

  if (profile.isRoomOperator) {
    query = query
      .in("department_id", ["housekeeping", "maintenance"])
      .not("room", "is", null);
  } else if (!profile.isDirection && profile.departments?.length) {
    query = query.in("department_id", profile.departments);
  }

  const result = await query.order("created_at", { ascending: false }).limit(120);
  const tasks = throwIfError(result, "load_tasks") || [];
  return Promise.all(tasks.map((task) => mapTask(supabase, task)));
}

async function loadMessages(supabase, profile) {
  const result = await supabase
    .from("department_messages")
    .select("id, department_id, author_operator_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = throwIfError(result, "load_messages") || [];
  return groupByDepartment(rows, (message) => ({
    id: message.id,
    department: message.department_id,
    author: message.author_operator_id === profile.id ? profile.full_name : "Equipe TKC",
    text: message.body,
    createdAt: message.created_at,
  }));
}

async function loadDocuments(supabase) {
  const result = await supabase
    .from("department_documents")
    .select("id, department_id, title, document_type, note, bucket_id, object_path, file_name, mime_type, file_size, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = throwIfError(result, "load_documents") || [];
  const withUrls = await Promise.all(rows.map(async (document) => ({
    ...document,
    fileData: await signedFileUrl(supabase, document.bucket_id, document.object_path),
  })));

  return groupByDepartment(withUrls, (document) => ({
    id: document.id,
    department: document.department_id,
    title: document.title,
    type: document.document_type,
    note: document.note || "",
    fileName: document.file_name,
    mimeType: document.mime_type || "application/octet-stream",
    fileSize: Number(document.file_size) || 0,
    fileData: document.fileData,
    createdAt: document.created_at,
  }));
}

async function loadOperators(supabase) {
  const result = await supabase
    .from("operator_profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      language,
      status,
      account_status,
      first_login_required,
      invited_at,
      invite_count,
      account_created_at,
      created_at,
      operator_departments(department_id)
    `)
    .order("created_at", { ascending: false });
  const rows = throwIfError(result, "load_operators") || [];
  return rows.map((operator) => ({
    id: operator.id,
    email: operator.email,
    name: operator.full_name,
    role: operator.role,
    language: operator.language,
    status: operator.status,
    accountStatus: operator.account_status,
    firstLoginRequired: operator.first_login_required,
    inviteStatus: operator.account_status === "active" ? "sent" : "pending",
    inviteCount: operator.invite_count || 0,
    lastInviteAt: operator.invited_at,
    accountCreatedAt: operator.account_created_at,
    createdAt: operator.created_at,
    departments: (operator.operator_departments || []).map((item) => item.department_id),
  }));
}

async function loadHousekeeping(supabase) {
  const assignmentDate = parisDateString();
  const planResult = await supabase
    .from("housekeeping_plans")
    .select("id, service_date, source, legacy_url, status")
    .order("service_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = throwIfError(planResult, "load_housekeeping_plan");
  if (!plan) return null;

  const [binomesResult, roomsResult, assignmentsResult] = await Promise.all([
    supabase
      .from("housekeeping_binomes")
      .select("id, code, label, zone, members, sort_order")
      .eq("plan_id", plan.id)
      .order("sort_order"),
    supabase
      .from("housekeeping_rooms")
      .select("id, binome_id, room, service, status, note, updated_at")
      .eq("plan_id", plan.id)
      .order("room"),
    supabase
      .from("housekeeping_binome_assignments")
      .select(`
        binome_id,
        operator_id,
        operator_profiles!housekeeping_binome_assignments_operator_id_fkey(full_name)
      `)
      .eq("service_date", assignmentDate),
  ]);
  const binomes = throwIfError(binomesResult, "load_housekeeping_binomes") || [];
  const rooms = throwIfError(roomsResult, "load_housekeeping_rooms") || [];
  const assignments = throwIfError(assignmentsResult, "load_housekeeping_assignments") || [];

  return {
    id: plan.id,
    date: plan.service_date,
    source: plan.source,
    status: plan.status,
    assignmentDate,
    legacyUrl: plan.legacy_url || "",
    binomes: binomes.map((binome) => {
      const binomeAssignments = assignments.filter((item) => item.binome_id === binome.id);
      return {
        id: binome.id,
        code: binome.code,
        label: binome.label,
        zone: binome.zone,
        operatorIds: binomeAssignments.map((item) => item.operator_id),
        members: binomeAssignments
          .map((item) => item.operator_profiles?.full_name)
          .filter(Boolean),
        rooms: rooms
          .filter((room) => room.binome_id === binome.id)
          .map((room) => ({
            id: room.id,
            room: room.room,
            service: room.service,
            status: room.status,
            note: room.note || "",
            updatedAt: room.updated_at,
          })),
      };
    }),
  };
}

export async function loadHotelWorkspace(supabase, authUserId) {
  const profileResult = await supabase
    .from("operator_profiles")
    .select(`
      id,
      auth_user_id,
      email,
      full_name,
      role,
      language,
      status,
      account_status,
      operator_departments(department_id)
    `)
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  const profile = throwIfError(profileResult, "load_operator_profile");
  if (!profile) return { profile: null };

  const departments = (profile.operator_departments || []).map((item) => item.department_id);
  const isDirection = ["manager", "admin"].includes(profile.role);
  const isRoomOperator = profile.role === "operator" && departments.includes("housekeeping");
  const workspaceProfile = { ...profile, departments, isDirection, isRoomOperator };
  const [tasks, messages, documents, housekeeping, operators] = await Promise.all([
    loadTasks(supabase, workspaceProfile),
    loadMessages(supabase, profile),
    loadDocuments(supabase),
    loadHousekeeping(supabase),
    isDirection ? loadOperators(supabase) : Promise.resolve([]),
  ]);

  return {
    profile: workspaceProfile,
    tasks,
    messages,
    documents,
    housekeeping,
    operators,
  };
}

export async function createTask(supabase, payload, operatorId) {
  const result = await supabase
    .from("tasks")
    .insert({
      department_id: payload.department,
      event_type: payload.eventType,
      room: payload.room || null,
      priority: payload.priority,
      status: payload.status || "open",
      note: payload.note,
      metadata: payload.metadata || (payload.title ? { title: payload.title } : {}),
      created_by_operator_id: operatorId,
    })
    .select("id")
    .single();
  return throwIfError(result, "create_task");
}

export async function createTasks(supabase, tasks, operatorId) {
  if (!tasks.length) return [];
  const result = await supabase
    .from("tasks")
    .insert(tasks.map((task) => ({
      department_id: task.department,
      event_type: task.eventType,
      room: task.room || null,
      priority: task.priority,
      status: task.status || "open",
      note: task.note,
      metadata: task.metadata || (task.title ? { title: task.title } : {}),
      created_by_operator_id: operatorId,
    })))
    .select("id");
  return throwIfError(result, "create_tasks") || [];
}

export async function updateTask(supabase, taskId, values) {
  const body = { ...values, updated_at: new Date().toISOString() };
  if (values.status === "done") body.completed_at = new Date().toISOString();
  if (values.status && values.status !== "done") body.completed_at = null;
  const result = await supabase.from("tasks").update(body).eq("id", taskId);
  throwIfError(result, "update_task");
}

export async function createTaskComment(supabase, taskId, comment, operatorId) {
  const result = await supabase.from("task_comments").insert({
    task_id: taskId,
    author_operator_id: operatorId,
    comment,
  });
  throwIfError(result, "create_task_comment");
}

function safeFileName(fileName) {
  return fileName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
}

export async function uploadTaskPhoto(supabase, task, file, reason, operatorId) {
  const objectPath = `${task.department}/${task.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const upload = await supabase.storage.from("task-photos").upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  throwIfError(upload, "upload_task_photo");

  const metadata = await supabase.from("task_attachments").insert({
    task_id: task.id,
    uploaded_by_operator_id: operatorId,
    reason,
    bucket_id: "task-photos",
    object_path: objectPath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
  });
  throwIfError(metadata, "store_task_photo");
}

export async function createDepartmentMessage(supabase, departmentId, body, operatorId) {
  const result = await supabase.from("department_messages").insert({
    department_id: departmentId,
    author_operator_id: operatorId,
    body,
  });
  throwIfError(result, "create_department_message");
}

export async function uploadDepartmentDocument(supabase, document, file, operatorId) {
  const objectPath = `${document.department}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const upload = await supabase.storage.from("department-documents").upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  throwIfError(upload, "upload_department_document");

  const metadata = await supabase.from("department_documents").insert({
    department_id: document.department,
    uploaded_by_operator_id: operatorId,
    title: document.title,
    document_type: document.type,
    note: document.note || null,
    bucket_id: "department-documents",
    object_path: objectPath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
  });
  throwIfError(metadata, "store_department_document");
}

export async function updateHousekeepingRoom(supabase, roomId, status, operatorId) {
  const result = await supabase
    .from("housekeeping_rooms")
    .update({
      status,
      updated_by_operator_id: operatorId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  throwIfError(result, "update_housekeeping_room");
}

export async function setHousekeepingBinomeAssignments(
  supabase,
  binomeId,
  serviceDate,
  operatorIds
) {
  const result = await supabase.rpc("set_housekeeping_binome_assignments", {
    target_binome_id: binomeId,
    target_service_date: serviceDate,
    target_operator_ids: operatorIds,
  });
  throwIfError(result, "set_housekeeping_binome_assignments");
}

export async function updateOperatorLanguage(supabase, operatorId, language) {
  const result = await supabase
    .from("operator_profiles")
    .update({ language, updated_at: new Date().toISOString() })
    .eq("id", operatorId);
  throwIfError(result, "update_operator_language");
}
