"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  createDepartmentMessage,
  createTask,
  createTaskComment,
  createTasks,
  loadHotelWorkspace,
  updateHousekeepingRoom,
  updateOperatorLanguage,
  updateTask,
  uploadDepartmentDocument,
  uploadTaskPhoto,
} from "@/lib/hotel-operations";

const CHANNELS = {
  housekeeping: {
    channel: "#02-housekeeping",
    label: "Housekeeping",
    help: "Quartos prontos, recouches, bloqueios e prioridades."
  },
  reception: {
    channel: "#01-reception",
    label: "Reception",
    help: "Reservas, pedidos especiais, chegada e passagem de turno."
  },
  maintenance: {
    channel: "#03-maintenance",
    label: "Maintenance",
    help: "Avarias, fotos, quartos bloqueados e acompanhamento."
  },
  pdj_bar: {
    channel: "#04-pdj-bar",
    label: "PDJ / Bar",
    help: "Stock, mise en place, pequeno-almoco e bar."
  },
  incidents: {
    channel: "#05-incidents",
    label: "Incidents",
    help: "Problemas operacionais sem dados pessoais sensiveis."
  },
  handover: {
    channel: "#00-handover",
    label: "Handover",
    help: "Resumo de turno, pendentes e prioridades."
  },
  direction: {
    channel: "#06-direction-prive",
    label: "Direction",
    help: "Decisoes, arbitragem e assuntos de direcao."
  }
};

const EVENT_LABELS = {
  room_cleaning: "Quarto a fazer",
  room_ready: "Quarto pronto",
  room_blocked: "Quarto bloqueado",
  maintenance_created: "Avaria criada",
  guest_incident: "Incidente cliente",
  stock_alert: "Alerta stock",
  shift_handover: "Passagem turno"
};

const STORAGE_KEY = "tkc-hotel-ops-events";
const IDEAS_STORAGE_KEY = "tkc-hotel-ops-ideas";
const OPERATORS_STORAGE_KEY = "tkc-hotel-ops-operators";
const DEPARTMENT_CHAT_STORAGE_KEY = "tkc-hotel-ops-department-chat";
const DOCUMENT_STORAGE_KEY = "tkc-hotel-ops-documents";
const HOUSEKEEPING_STORAGE_KEY = "tkc-hotel-ops-housekeeping-plan";
const LANGUAGE_STORAGE_KEY = "tkc-hotel-ops-language";
const ACTIVE_OPERATOR_STORAGE_KEY = "tkc-hotel-ops-active-operator";
const TKC_ROOMS_LEGACY_URL = "https://tkc-rooms-nogent.edreammotors.chatgpt.site";

const LANGUAGE_OPTIONS = [
  { id: "fr", label: "Francais" },
  { id: "pt", label: "Portugues" },
  { id: "en", label: "English" },
  { id: "es", label: "Espanol" },
  { id: "it", label: "Italiano" },
  { id: "pl", label: "Polski" }
];

const UI_TEXT = {
  pt: {
    language: "Idioma",
    appTitle: "Hotel Operations OS",
    heroEyebrow: "TKC Capital / Operacoes hoteleiras",
    heroTitle: "Uma plataforma TKC para dirigir quartos, tarefas, equipas e decisoes.",
    heroCopy: "Tarefas por departamento, quartos, manutencao, incidentes, documentos e chat numa app unica.",
    roomsDone: "Quartos feitos",
    openMaintenance: "Avarias abertas",
    incidents: "Incidentes",
    openTasks: "Tarefas abertas",
    housekeepingTitle: "Binomes e quartos a fazer",
    totalRooms: "quartos",
    pending: "pendentes",
    done: "feitos",
    blocked: "bloqueados",
    importedStructure: "Estrutura importada para sistema unico",
    legacyNotice: "TKC Rooms fica como legado; a operacao diaria passa a viver aqui.",
    plannedTime: "Tempo previsto",
    generateTasks: "Gerar tarefas Housekeeping",
    resetRooms: "Repor estrutura 74 quartos",
    singleSystem: "Sistema unico",
    legacyIntegrated: "TKC Rooms integrado",
    officialApp: "App oficial",
    module: "Modulo",
    oldSite: "Antigo site",
    nextStep: "Proximo passo",
    redirectOldLink: "redirecionar o link antigo",
    noTwoSystems: "Nao usar dois logins, duas listas de quartos ou dois historicos.",
    viewLegacy: "Ver TKC Rooms legado",
    start: "Start",
    control: "Controle",
    ok: "OK",
    blockShort: "Bloq.",
    activeProfile: "Perfil",
    directionMode: "Direcao/global",
    exitProfile: "Sair perfil",
    useProfile: "Usar perfil",
    addPhoto: "Adicionar foto",
    comment: "Comentar"
  },
  fr: {
    language: "Langue",
    appTitle: "Hotel Operations OS",
    heroEyebrow: "TKC Capital / Operations hotelieres",
    heroTitle: "Une plateforme TKC pour piloter chambres, taches, equipes et decisions.",
    heroCopy: "Taches par departement, chambres, maintenance, incidents, documents et chat dans une seule app.",
    roomsDone: "Chambres faites",
    openMaintenance: "Pannes ouvertes",
    incidents: "Incidents",
    openTasks: "Taches ouvertes",
    housekeepingTitle: "Binomes et chambres a faire",
    totalRooms: "chambres",
    pending: "en attente",
    done: "faites",
    blocked: "bloquees",
    importedStructure: "Structure importee dans le systeme unique",
    legacyNotice: "TKC Rooms devient l'ancien site; l'operation quotidienne vit ici.",
    plannedTime: "Temps prevu",
    generateTasks: "Generer les taches Housekeeping",
    resetRooms: "Reinitialiser les 74 chambres",
    singleSystem: "Systeme unique",
    legacyIntegrated: "TKC Rooms integre",
    officialApp: "App officielle",
    module: "Module",
    oldSite: "Ancien site",
    nextStep: "Prochaine etape",
    redirectOldLink: "rediriger l'ancien lien",
    noTwoSystems: "Pas deux logins, deux listes de chambres ou deux historiques.",
    viewLegacy: "Voir TKC Rooms ancien",
    start: "Start",
    control: "Controle",
    ok: "OK",
    blockShort: "Bloq.",
    activeProfile: "Profil",
    directionMode: "Direction/global",
    exitProfile: "Quitter profil",
    useProfile: "Utiliser profil",
    addPhoto: "Ajouter photo",
    comment: "Commenter"
  },
  en: {
    language: "Language",
    appTitle: "Hotel Operations OS",
    heroEyebrow: "TKC Capital / Hotel operations",
    heroTitle: "A TKC platform to run rooms, tasks, teams and decisions.",
    heroCopy: "Department tasks, rooms, maintenance, incidents, documents and chat in one app.",
    roomsDone: "Rooms done",
    openMaintenance: "Open maintenance",
    incidents: "Incidents",
    openTasks: "Open tasks",
    housekeepingTitle: "Teams and rooms to clean",
    totalRooms: "rooms",
    pending: "pending",
    done: "done",
    blocked: "blocked",
    importedStructure: "Structure imported into the single system",
    legacyNotice: "TKC Rooms becomes legacy; daily operations live here.",
    plannedTime: "Planned time",
    generateTasks: "Generate Housekeeping tasks",
    resetRooms: "Reset 74-room structure",
    singleSystem: "Single system",
    legacyIntegrated: "TKC Rooms integrated",
    officialApp: "Official app",
    module: "Module",
    oldSite: "Old site",
    nextStep: "Next step",
    redirectOldLink: "redirect old link",
    noTwoSystems: "Do not run two logins, two room lists or two histories.",
    viewLegacy: "View legacy TKC Rooms",
    start: "Start",
    control: "Control",
    ok: "OK",
    blockShort: "Block",
    activeProfile: "Profile",
    directionMode: "Management/global",
    exitProfile: "Exit profile",
    useProfile: "Use profile",
    addPhoto: "Add photo",
    comment: "Comment"
  },
  es: {
    language: "Idioma",
    appTitle: "Hotel Operations OS",
    heroEyebrow: "TKC Capital / Operaciones hoteleras",
    heroTitle: "Una plataforma TKC para dirigir habitaciones, tareas, equipos y decisiones.",
    heroCopy: "Tareas por departamento, habitaciones, mantenimiento, incidencias, documentos y chat en una sola app.",
    roomsDone: "Habitaciones hechas",
    openMaintenance: "Averias abiertas",
    incidents: "Incidencias",
    openTasks: "Tareas abiertas",
    housekeepingTitle: "Binomios y habitaciones por hacer",
    totalRooms: "habitaciones",
    pending: "pendientes",
    done: "hechas",
    blocked: "bloqueadas",
    importedStructure: "Estructura importada al sistema unico",
    legacyNotice: "TKC Rooms queda como legado; la operacion diaria vive aqui.",
    plannedTime: "Tiempo previsto",
    generateTasks: "Generar tareas Housekeeping",
    resetRooms: "Reiniciar estructura 74 habitaciones",
    singleSystem: "Sistema unico",
    legacyIntegrated: "TKC Rooms integrado",
    officialApp: "App oficial",
    module: "Modulo",
    oldSite: "Sitio antiguo",
    nextStep: "Proximo paso",
    redirectOldLink: "redirigir el enlace antiguo",
    noTwoSystems: "No usar dos logins, dos listas de habitaciones o dos historiales.",
    viewLegacy: "Ver TKC Rooms legado",
    start: "Start",
    control: "Control",
    ok: "OK",
    blockShort: "Bloq.",
    activeProfile: "Perfil",
    directionMode: "Direccion/global",
    exitProfile: "Salir perfil",
    useProfile: "Usar perfil",
    addPhoto: "Agregar foto",
    comment: "Comentar"
  },
  it: {
    language: "Lingua",
    appTitle: "Hotel Operations OS",
    heroEyebrow: "TKC Capital / Operazioni hotel",
    heroTitle: "Una piattaforma TKC per gestire camere, attivita, team e decisioni.",
    heroCopy: "Attivita per reparto, camere, manutenzione, incidenti, documenti e chat in una sola app.",
    roomsDone: "Camere fatte",
    openMaintenance: "Guasti aperti",
    incidents: "Incidenti",
    openTasks: "Attivita aperte",
    housekeepingTitle: "Coppie e camere da fare",
    totalRooms: "camere",
    pending: "in attesa",
    done: "fatte",
    blocked: "bloccate",
    importedStructure: "Struttura importata nel sistema unico",
    legacyNotice: "TKC Rooms resta legacy; l'operazione quotidiana vive qui.",
    plannedTime: "Tempo previsto",
    generateTasks: "Generare attivita Housekeeping",
    resetRooms: "Ripristinare struttura 74 camere",
    singleSystem: "Sistema unico",
    legacyIntegrated: "TKC Rooms integrato",
    officialApp: "App ufficiale",
    module: "Modulo",
    oldSite: "Vecchio sito",
    nextStep: "Prossimo passo",
    redirectOldLink: "reindirizzare il vecchio link",
    noTwoSystems: "Non usare due login, due liste camere o due storici.",
    viewLegacy: "Vedere TKC Rooms legacy",
    start: "Start",
    control: "Controllo",
    ok: "OK",
    blockShort: "Bloc.",
    activeProfile: "Profilo",
    directionMode: "Direzione/globale",
    exitProfile: "Uscire profilo",
    useProfile: "Usare profilo",
    addPhoto: "Aggiungere foto",
    comment: "Commentare"
  },
  pl: {
    language: "Jezyk",
    appTitle: "Hotel Operations OS",
    heroEyebrow: "TKC Capital / Operacje hotelowe",
    heroTitle: "Platforma TKC do prowadzenia pokoi, zadan, zespolow i decyzji.",
    heroCopy: "Zadania wedlug dzialu, pokoje, konserwacja, incydenty, dokumenty i chat w jednej app.",
    roomsDone: "Pokoje zrobione",
    openMaintenance: "Otwarte usterki",
    incidents: "Incydenty",
    openTasks: "Otwarte zadania",
    housekeepingTitle: "Pary i pokoje do zrobienia",
    totalRooms: "pokoje",
    pending: "oczekuje",
    done: "zrobione",
    blocked: "zablokowane",
    importedStructure: "Struktura przeniesiona do jednego systemu",
    legacyNotice: "TKC Rooms zostaje legacy; codzienna operacja jest tutaj.",
    plannedTime: "Planowany czas",
    generateTasks: "Generuj zadania Housekeeping",
    resetRooms: "Reset struktury 74 pokoi",
    singleSystem: "Jeden system",
    legacyIntegrated: "TKC Rooms zintegrowane",
    officialApp: "Oficjalna app",
    module: "Modul",
    oldSite: "Stara strona",
    nextStep: "Nastepny krok",
    redirectOldLink: "przekierowac stary link",
    noTwoSystems: "Nie uzywac dwoch loginow, dwoch list pokoi ani dwoch historii.",
    viewLegacy: "Zobacz legacy TKC Rooms",
    start: "Start",
    control: "Kontrola",
    ok: "OK",
    blockShort: "Blok.",
    activeProfile: "Profil",
    directionMode: "Dyrekcja/global",
    exitProfile: "Wyjdz z profilu",
    useProfile: "Uzyj profilu",
    addPhoto: "Dodaj zdjecie",
    comment: "Komentuj"
  }
};

const DEPARTMENT_OPTIONS = [
  { id: "reception", label: "Reception" },
  { id: "housekeeping", label: "Housekeeping" },
  { id: "maintenance", label: "Maintenance" },
  { id: "pdj_bar", label: "PDJ / Bar" },
  { id: "incidents", label: "Incidents" },
  { id: "handover", label: "Handover" },
  { id: "direction", label: "Direction" }
];

const ROLE_OPTIONS = [
  { id: "operator", label: "Operador" },
  { id: "supervisor", label: "Supervisor" },
  { id: "manager", label: "Direcao" },
  { id: "admin", label: "Admin" }
];

const initialForm = {
  department: "housekeeping",
  eventType: "room_ready",
  room: "",
  priority: "normal",
  note: ""
};

const initialOperatorForm = {
  name: "",
  email: "",
  role: "operator",
  language: "fr",
  departments: ["housekeeping"]
};

const PHOTO_REASON_OPTIONS = [
  { id: "maintenance_issue", label: "Problema manutencao" },
  { id: "lost_object", label: "Objeto perdido" },
  { id: "task_done", label: "Tarefa finalizada" },
  { id: "before_after", label: "Antes / depois" },
  { id: "other", label: "Outro" }
];

const DOCUMENT_TYPE_OPTIONS = [
  { id: "circular", label: "Circular" },
  { id: "sop", label: "SOP" },
  { id: "job_sheet", label: "Ficha de posto" },
  { id: "checklist", label: "Checklist" },
  { id: "other", label: "Outro" }
];

const HOUSEKEEPING_SERVICE_OPTIONS = [
  { id: "depart", label: "Depart", minutes: 30 },
  { id: "recouche", label: "Recouche", minutes: 10 },
  { id: "controle", label: "Controle", minutes: 8 },
  { id: "deep_clean", label: "Nettoyage fond", minutes: 45 }
];

const HOUSEKEEPING_SERVICE_LABELS = {
  depart: { pt: "Depart", fr: "Depart", en: "Departure", es: "Salida", it: "Partenza", pl: "Wyjazd" },
  recouche: { pt: "Recouche", fr: "Recouche", en: "Stayover", es: "Estancia", it: "Fermata", pl: "Pobyt" },
  controle: { pt: "Controle", fr: "Controle", en: "Control", es: "Control", it: "Controllo", pl: "Kontrola" },
  deep_clean: { pt: "Limpeza fundo", fr: "Nettoyage fond", en: "Deep clean", es: "Limpieza fondo", it: "Pulizia fondo", pl: "Sprzatanie gruntowne" }
};

const ROOM_STATUS_LABELS = {
  todo: { pt: "A fazer", fr: "A faire", en: "To do", es: "Por hacer", it: "Da fare", pl: "Do zrobienia" },
  in_progress: { pt: "Em curso", fr: "En cours", en: "In progress", es: "En curso", it: "In corso", pl: "W toku" },
  control: { pt: "A controlar", fr: "A controler", en: "To control", es: "A controlar", it: "Da controllare", pl: "Do kontroli" },
  done: { pt: "Feito", fr: "Fait", en: "Done", es: "Hecho", it: "Fatto", pl: "Zrobione" },
  blocked: { pt: "Bloqueado", fr: "Bloque", en: "Blocked", es: "Bloqueado", it: "Bloccato", pl: "Zablokowane" }
};

const DEPARTMENT_LABELS = {
  reception: { pt: "Recepcao", fr: "Reception", en: "Reception", es: "Recepcion", it: "Reception", pl: "Recepcja" },
  housekeeping: { pt: "Housekeeping", fr: "Etages", en: "Housekeeping", es: "Pisos", it: "Camere", pl: "Pokoje" },
  maintenance: { pt: "Manutencao", fr: "Maintenance", en: "Maintenance", es: "Mantenimiento", it: "Manutenzione", pl: "Konserwacja" },
  pdj_bar: { pt: "PDJ / Bar", fr: "PDJ / Bar", en: "Breakfast / Bar", es: "Desayuno / Bar", it: "Colazione / Bar", pl: "Sniadanie / Bar" },
  incidents: { pt: "Incidentes", fr: "Incidents", en: "Incidents", es: "Incidencias", it: "Incidenti", pl: "Incydenty" },
  handover: { pt: "Passagem turno", fr: "Passation", en: "Handover", es: "Cambio turno", it: "Passaggio turno", pl: "Przekazanie zmiany" },
  direction: { pt: "Direcao", fr: "Direction", en: "Management", es: "Direccion", it: "Direzione", pl: "Dyrekcja" }
};

const ROLE_LABELS = {
  operator: { pt: "Operador", fr: "Operateur", en: "Operator", es: "Operador", it: "Operatore", pl: "Operator" },
  supervisor: { pt: "Supervisor", fr: "Superviseur", en: "Supervisor", es: "Supervisor", it: "Supervisore", pl: "Supervisor" },
  manager: { pt: "Direcao", fr: "Direction", en: "Management", es: "Direccion", it: "Direzione", pl: "Dyrekcja" },
  admin: { pt: "Admin", fr: "Admin", en: "Admin", es: "Admin", it: "Admin", pl: "Admin" }
};

const EVENT_LABEL_TRANSLATIONS = {
  room_cleaning: { pt: "Quarto a fazer", fr: "Chambre a faire", en: "Room to clean", es: "Habitacion por hacer", it: "Camera da fare", pl: "Pokoj do zrobienia" },
  room_ready: { pt: "Quarto pronto", fr: "Chambre prete", en: "Room ready", es: "Habitacion lista", it: "Camera pronta", pl: "Pokoj gotowy" },
  room_blocked: { pt: "Quarto bloqueado", fr: "Chambre bloquee", en: "Room blocked", es: "Habitacion bloqueada", it: "Camera bloccata", pl: "Pokoj zablokowany" },
  maintenance_created: { pt: "Avaria criada", fr: "Panne creee", en: "Maintenance created", es: "Averia creada", it: "Guasto creato", pl: "Usterka utworzona" },
  guest_incident: { pt: "Incidente cliente", fr: "Incident client", en: "Guest incident", es: "Incidencia cliente", it: "Incidente cliente", pl: "Incydent goscia" },
  stock_alert: { pt: "Alerta stock", fr: "Alerte stock", en: "Stock alert", es: "Alerta stock", it: "Allerta stock", pl: "Alert zapasu" },
  shift_handover: { pt: "Passagem turno", fr: "Passation", en: "Shift handover", es: "Cambio turno", it: "Passaggio turno", pl: "Przekazanie zmiany" }
};

const TASK_STATUS_LABELS = {
  open: { pt: "Aberta", fr: "Ouverte", en: "Open", es: "Abierta", it: "Aperta", pl: "Otwarte" },
  in_progress: { pt: "Em curso", fr: "En cours", en: "In progress", es: "En curso", it: "In corso", pl: "W toku" },
  blocked: { pt: "Bloqueada", fr: "Bloquee", en: "Blocked", es: "Bloqueada", it: "Bloccata", pl: "Zablokowane" },
  done: { pt: "Feita", fr: "Faite", en: "Done", es: "Hecha", it: "Fatta", pl: "Zrobione" }
};

const PHOTO_REASON_LABELS = {
  maintenance_issue: { pt: "Problema manutencao", fr: "Probleme maintenance", en: "Maintenance issue", es: "Problema mantenimiento", it: "Problema manutenzione", pl: "Problem techniczny" },
  lost_object: { pt: "Objeto perdido", fr: "Objet trouve", en: "Lost object", es: "Objeto perdido", it: "Oggetto smarrito", pl: "Rzecz zgubiona" },
  task_done: { pt: "Tarefa finalizada", fr: "Tache terminee", en: "Task completed", es: "Tarea finalizada", it: "Attivita finita", pl: "Zadanie wykonane" },
  before_after: { pt: "Antes / depois", fr: "Avant / apres", en: "Before / after", es: "Antes / despues", it: "Prima / dopo", pl: "Przed / po" },
  other: { pt: "Outro", fr: "Autre", en: "Other", es: "Otro", it: "Altro", pl: "Inne" }
};

const DOCUMENT_TYPE_LABELS = {
  circular: { pt: "Circular", fr: "Circulaire", en: "Circular", es: "Circular", it: "Circolare", pl: "Okolnik" },
  sop: { pt: "SOP", fr: "SOP", en: "SOP", es: "SOP", it: "SOP", pl: "SOP" },
  job_sheet: { pt: "Ficha de posto", fr: "Fiche de poste", en: "Job sheet", es: "Ficha de puesto", it: "Scheda mansione", pl: "Opis stanowiska" },
  checklist: { pt: "Checklist", fr: "Checklist", en: "Checklist", es: "Checklist", it: "Checklist", pl: "Checklist" },
  other: { pt: "Outro", fr: "Autre", en: "Other", es: "Otro", it: "Altro", pl: "Inne" }
};

const initialDocForm = {
  department: "housekeeping",
  title: "",
  type: "sop",
  note: "",
  fileName: "",
  mimeType: "",
  fileSize: 0,
  fileData: "",
  storageNote: ""
};

function buildHousekeepingPlan() {
  return {
    source: "tkc_rooms_integrated",
    legacyUrl: TKC_ROOMS_LEGACY_URL,
    date: "",
    binomes: [
      {
        id: "binome_a",
        label: "Binome A",
        zone: "Etage 1",
        members: ["Operador 1", "Operador 2"],
        rooms: buildFloorRooms(1, 18)
      },
      {
        id: "binome_b",
        label: "Binome B",
        zone: "Etage 2",
        members: ["Operador 3", "Operador 4"],
        rooms: buildFloorRooms(2, 18)
      },
      {
        id: "binome_c",
        label: "Binome C",
        zone: "Etage 3",
        members: ["Operador 5", "Operador 6"],
        rooms: buildFloorRooms(3, 18)
      },
      {
        id: "binome_d",
        label: "Binome D",
        zone: "Etage 4",
        members: ["Operador 7", "Operador 8"],
        rooms: buildFloorRooms(4, 20)
      }
    ]
  };
}

function buildFloorRooms(floor, count) {
  return Array.from({ length: count }, (_, index) => {
    const room = `${floor}${String(index + 1).padStart(2, "0")}`;
    const service = index % 7 === 0
      ? "deep_clean"
      : index % 4 === 0
        ? "depart"
        : index % 3 === 0
          ? "controle"
          : "recouche";

    return {
      id: room,
      room,
      service,
      status: "todo",
      note: ""
    };
  });
}

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [operators, setOperators] = useState([]);
  const [housekeepingPlan, setHousekeepingPlan] = useState(buildHousekeepingPlan);
  const [form, setForm] = useState(initialForm);
  const [operatorForm, setOperatorForm] = useState(initialOperatorForm);
  const [departmentChats, setDepartmentChats] = useState({});
  const [departmentDocs, setDepartmentDocs] = useState({});
  const [activeChatDepartment, setActiveChatDepartment] = useState("housekeeping");
  const [chatDraft, setChatDraft] = useState("");
  const [docForm, setDocForm] = useState(initialDocForm);
  const [accessOperatorId, setAccessOperatorId] = useState(null);
  const [ideaText, setIdeaText] = useState("");
  const [syncState, setSyncState] = useState("Pronto");
  const [inviteState, setInviteState] = useState("Pronto");
  const [uiLanguage, setUiLanguage] = useState("fr");
  const [activeOperatorId, setActiveOperatorId] = useState("");
  const [domainLabel, setDomainLabel] = useState("app.tkccapital.pt");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [authMode, setAuthMode] = useState(() => getSupabaseBrowserClient() ? "checking" : "preview");
  const [currentProfile, setCurrentProfile] = useState(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [docFile, setDocFile] = useState(null);
  const supabaseRef = useRef(null);
  const authUserIdRef = useRef("");

  const refreshWorkspace = useCallback(async ({ silent = false } = {}) => {
    const supabase = supabaseRef.current;
    const authUserId = authUserIdRef.current;
    if (!supabase || !authUserId) return null;

    if (!silent) setSyncState("A sincronizar");
    try {
      const workspace = await loadHotelWorkspace(supabase, authUserId);
      if (!workspace.profile) {
        setCurrentProfile(null);
        setAuthMode("profile_missing");
        setWorkspaceError("A conta existe, mas ainda nao tem um perfil operacional TKC.");
        return null;
      }
      if (workspace.profile.status !== "active" || workspace.profile.account_status !== "active") {
        setCurrentProfile(workspace.profile);
        setAuthMode("blocked");
        setWorkspaceError("Este perfil ainda nao esta ativo. Contacte a direcao.");
        return null;
      }

      setCurrentProfile(workspace.profile);
      setEvents(workspace.tasks || []);
      setDepartmentChats(workspace.messages || {});
      setDepartmentDocs(workspace.documents || {});
      if (workspace.housekeeping) setHousekeepingPlan(workspace.housekeeping);
      setOperators(workspace.operators || []);
      setUiLanguage(workspace.profile.language || "fr");
      const allowedDepartments = workspace.profile.isDirection
        ? DEPARTMENT_OPTIONS.map((department) => department.id)
        : workspace.profile.departments;
      const fallbackDepartment = allowedDepartments[0] || "housekeeping";
      setActiveChatDepartment((current) =>
        allowedDepartments.length > 0 && !allowedDepartments.includes(current)
          ? fallbackDepartment
          : current
      );
      setForm((current) =>
        allowedDepartments.length > 0 && !allowedDepartments.includes(current.department)
          ? { ...current, department: fallbackDepartment }
          : current
      );
      setDocForm((current) =>
        allowedDepartments.length > 0 && !allowedDepartments.includes(current.department)
          ? { ...current, department: fallbackDepartment }
          : current
      );
      setWorkspaceError("");
      setAuthMode("authenticated");
      setSyncState("Sincronizado com Supabase");
      return workspace;
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Erro de sincronizacao");
      setSyncState("Erro de sincronizacao");
      return null;
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const host = window.location.host;
      const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
      setDomainLabel(isLocal || !host ? "app.tkccapital.pt" : host);

      try {
        setEvents(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
        setIdeas(JSON.parse(localStorage.getItem(IDEAS_STORAGE_KEY) || "[]"));
        setOperators(JSON.parse(localStorage.getItem(OPERATORS_STORAGE_KEY) || "[]"));
        setDepartmentChats(JSON.parse(localStorage.getItem(DEPARTMENT_CHAT_STORAGE_KEY) || "{}"));
        setDepartmentDocs(JSON.parse(localStorage.getItem(DOCUMENT_STORAGE_KEY) || "{}"));
        setHousekeepingPlan(JSON.parse(localStorage.getItem(HOUSEKEEPING_STORAGE_KEY) || "null") || buildHousekeepingPlan());
        setUiLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || "fr");
        setActiveOperatorId(localStorage.getItem(ACTIVE_OPERATOR_STORAGE_KEY) || "");
      } catch {
        setEvents([]);
        setIdeas([]);
        setOperators([]);
        setDepartmentChats({});
        setDepartmentDocs({});
        setHousekeepingPlan(buildHousekeepingPlan());
        setUiLanguage("fr");
        setActiveOperatorId("");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabaseRef.current = supabase;

    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        const next = encodeURIComponent("/hotel");
        window.location.replace(`/login?next=${next}`);
        return;
      }

      setSignedInEmail(data.user.email || "");
      authUserIdRef.current = data.user.id;
      await refreshWorkspace();
    });

    return () => {
      mounted = false;
    };
  }, [refreshWorkspace]);

  useEffect(() => {
    if (authMode !== "authenticated") return undefined;
    const timer = window.setInterval(() => {
      void refreshWorkspace({ silent: true });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [authMode, refreshWorkspace]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    localStorage.setItem(OPERATORS_STORAGE_KEY, JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem(DEPARTMENT_CHAT_STORAGE_KEY, JSON.stringify(departmentChats));
  }, [departmentChats]);

  useEffect(() => {
    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(departmentDocs));
  }, [departmentDocs]);

  useEffect(() => {
    localStorage.setItem(HOUSEKEEPING_STORAGE_KEY, JSON.stringify(housekeepingPlan));
  }, [housekeepingPlan]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_OPERATOR_STORAGE_KEY, activeOperatorId);
  }, [activeOperatorId]);

  const stats = useMemo(() => {
    const roomsDone = events.filter((event) => event.eventType === "room_ready").length;
    const openMaintenance = events.filter((event) =>
      event.department === "maintenance" ||
      event.eventType === "maintenance_created" ||
      event.eventType === "room_blocked"
    ).length;
    const openIncidents = events.filter((event) =>
      event.department === "incidents" || event.eventType === "guest_incident"
    ).length;
    const openTasks = events.filter((event) => (event.status || "open") !== "done").length;

    return { roomsDone, openMaintenance, openIncidents, openTasks };
  }, [events]);

  const activeChatMessages = departmentChats[activeChatDepartment] || [];
  const authorizedChatOperators = operators.filter((operator) =>
    (operator.departments || []).includes(activeChatDepartment)
  );
  const activeAccessOperator = accessOperatorId
    ? operators.find((operator) => operator.id === accessOperatorId)
    : null;
  const activeOperator = activeOperatorId
    ? operators.find((operator) => operator.id === activeOperatorId)
    : null;
  const activeLanguage = currentProfile?.language || activeOperator?.language || uiLanguage;
  const isProduction = authMode === "authenticated";
  const isDirection = Boolean(currentProfile?.isDirection) || authMode === "preview";
  const availableDepartments = currentProfile && !currentProfile.isDirection
    ? DEPARTMENT_OPTIONS.filter((department) => currentProfile.departments.includes(department.id))
    : DEPARTMENT_OPTIONS;
  const canUseHousekeeping = isDirection || availableDepartments.some((department) => department.id === "housekeeping");
  const docsForDepartment = departmentDocs[docForm.department] || [];
  const housekeepingStats = getHousekeepingStats(housekeepingPlan);
  const t = (key) => translate(activeLanguage, key);

  if (authMode === "checking") {
    return <AccessState title="A verificar sessao" message="A ligar a app TKC Capital Ops ao Supabase." />;
  }

  if (authMode === "profile_missing" || authMode === "blocked") {
    return (
      <AccessState
        title={authMode === "blocked" ? "Perfil sem acesso ativo" : "Perfil operacional em falta"}
        message={workspaceError || "Contacte a direcao para ativar o seu perfil operacional."}
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      id: crypto.randomUUID(),
      ...form,
      room: form.room.trim(),
      note: form.note.trim(),
      status: "open",
      comments: [],
      createdAt: new Date().toISOString()
    };

    if (!payload.note) return;

    if (isProduction && supabaseRef.current && currentProfile?.id) {
      setSyncState("A guardar tarefa");
      try {
        await createTask(supabaseRef.current, payload, currentProfile.id);
        await refreshWorkspace();
        setForm({ ...initialForm, department: payload.department });
      } catch (error) {
        setSyncState("Erro ao guardar tarefa");
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao guardar tarefa");
      }
      return;
    }

    addEvent(payload);
    setForm({ ...initialForm, department: payload.department });
    setSyncState("Guardado na app");
  }

  function addEvent(payload) {
    setEvents((current) => [payload, ...current].slice(0, 50));
  }

  function handleChange(event) {
    const { id, value } = event.target;
    setForm((current) => ({ ...current, [id]: value }));
  }

  async function changeLanguage(language) {
    setUiLanguage(language);
    if (isProduction && supabaseRef.current && currentProfile?.id) {
      try {
        await updateOperatorLanguage(supabaseRef.current, currentProfile.id, language);
        setCurrentProfile((profile) => profile ? { ...profile, language } : profile);
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao guardar idioma");
      }
      return;
    }
    if (!activeOperatorId) return;

    setOperators((current) =>
      current.map((operator) =>
        operator.id === activeOperatorId ? { ...operator, language } : operator
      )
    );
  }

  function runDemo() {
    addEvent({
      id: crypto.randomUUID(),
      department: "maintenance",
      eventType: "maintenance_created",
      room: "204",
      priority: "urgent",
      note: "Demo: TV nao funciona. Enviar tecnico quando possivel.",
      status: "open",
      comments: [
        {
          id: crypto.randomUUID(),
          text: "Controle reception: prevenir o cliente se o quarto ficar bloqueado.",
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    });
    setSyncState("Exemplo carregado");
  }

  function resetDemo() {
    setEvents([]);
    setSyncState("Pronto");
  }

  async function updateTaskStatus(id, status) {
    if (isProduction && supabaseRef.current) {
      try {
        await updateTask(supabaseRef.current, id, { status });
        await refreshWorkspace({ silent: true });
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao atualizar tarefa");
      }
      return;
    }
    setEvents((current) =>
      current.map((event) => event.id === id ? { ...event, status } : event)
    );
  }

  async function addComment(id, text) {
    const cleanText = text.trim();
    if (!cleanText) return;

    if (isProduction && supabaseRef.current && currentProfile?.id) {
      try {
        await createTaskComment(supabaseRef.current, id, cleanText, currentProfile.id);
        await refreshWorkspace({ silent: true });
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao guardar comentario");
      }
      return;
    }

    setEvents((current) =>
      current.map((event) => {
        if (event.id !== id) return event;
        return {
          ...event,
          comments: [
            ...(event.comments || []),
            {
              id: crypto.randomUUID(),
              text: cleanText,
              createdAt: new Date().toISOString()
            }
          ]
        };
      })
    );
  }

  function addIdea(event) {
    event.preventDefault();
    const cleanText = ideaText.trim();
    if (!cleanText) return;

    setIdeas((current) => [
      {
        id: crypto.randomUUID(),
        text: cleanText,
        createdAt: new Date().toISOString()
      },
      ...current
    ].slice(0, 100));
    setIdeaText("");
  }

  function handleOperatorChange(event) {
    const { id, value } = event.target;
    setOperatorForm((current) => ({ ...current, [id]: value }));
  }

  function toggleOperatorDepartment(id) {
    setOperatorForm((current) => {
      const departments = current.departments.includes(id)
        ? current.departments.filter((item) => item !== id)
        : [...current.departments, id];

      return {
        ...current,
        departments: departments.length > 0 ? departments : current.departments
      };
    });
  }

  async function createOperator(event) {
    event.preventDefault();
    const name = operatorForm.name.trim();
    const email = operatorForm.email.trim().toLowerCase();
    if (!name || !email) return;

    const operator = {
      id: crypto.randomUUID(),
      ...operatorForm,
      name,
      email,
      status: "profile_created",
      firstLoginRequired: true,
      inviteStatus: "sending",
      inviteCount: 0,
      accountStatus: "pending",
      createdAt: new Date().toISOString()
    };

    setOperatorForm(initialOperatorForm);
    if (!isProduction) {
      setOperators((current) => [operator, ...current]);
    }
    await sendOperatorInvite(operator, "create");
    if (isProduction) await refreshWorkspace({ silent: true });
  }

  async function sendOperatorInvite(operator, mode = "resend") {
    const requestId = crypto.randomUUID();
    setInviteState(mode === "resend" ? "A reenviar convite" : "A enviar convite");
    setOperators((current) =>
      current.map((item) =>
        item.id === operator.id ? { ...item, inviteStatus: "sending" } : item
      )
    );

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const accessToken = data.session?.access_token;
      const response = await fetch("/api/operators/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ ...operator, inviteRequestId: requestId })
      });
      const result = await response.json().catch(() => ({}));
      const inviteStatus = response.ok && result.ok
        ? result.dryRun ? "dry_run" : "sent"
        : "error";

      setOperators((current) =>
        current.map((item) =>
          item.id === operator.id
            ? {
                ...item,
                inviteStatus,
                inviteCount: (item.inviteCount || 0) + 1,
                lastInviteAt: new Date().toISOString(),
                inviteUrl: result.inviteUrl || item.inviteUrl,
                invitePreview: result.preview || item.invitePreview
              }
            : item
        )
      );
      setInviteState(inviteStatus === "sent" ? "Convite enviado" : inviteStatus === "dry_run" ? "Convite preparado" : "Erro no convite");
      if (response.status === 409 && result.error === "account_already_active") {
        setInviteState("Conta ja ativa");
      }
      if (response.ok && isProduction) await refreshWorkspace({ silent: true });
    } catch {
      setOperators((current) =>
        current.map((item) =>
          item.id === operator.id ? { ...item, inviteStatus: "error" } : item
        )
      );
      setInviteState("Erro no convite");
    }
  }

  function markAccountCreated(id) {
    setOperators((current) =>
      current.map((operator) =>
        operator.id === id
          ? {
              ...operator,
              accountStatus: "active",
              firstLoginRequired: false,
              accountCreatedAt: operator.accountCreatedAt || new Date().toISOString()
            }
          : operator
      )
    );
    setAccessOperatorId(id);
  }

  async function addDepartmentMessage(event) {
    event.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;

    if (isProduction && supabaseRef.current && currentProfile?.id) {
      try {
        await createDepartmentMessage(
          supabaseRef.current,
          activeChatDepartment,
          text,
          currentProfile.id
        );
        setChatDraft("");
        await refreshWorkspace({ silent: true });
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao enviar mensagem");
      }
      return;
    }

    const message = {
      id: crypto.randomUUID(),
      department: activeChatDepartment,
      author: "Direcao",
      text,
      createdAt: new Date().toISOString()
    };

    setDepartmentChats((current) => ({
      ...current,
      [activeChatDepartment]: [message, ...(current[activeChatDepartment] || [])].slice(0, 100)
    }));
    setChatDraft("");
  }

  async function addTaskPhoto(id, attachment) {
    if (isProduction && supabaseRef.current && currentProfile?.id && attachment.file) {
      const task = events.find((event) => event.id === id);
      if (!task) return;
      try {
        setSyncState("A enviar foto");
        await uploadTaskPhoto(
          supabaseRef.current,
          task,
          attachment.file,
          attachment.reason,
          currentProfile.id
        );
        await refreshWorkspace();
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao enviar foto");
        setSyncState("Erro ao enviar foto");
      }
      return;
    }
    if (!attachment.file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const localAttachment = {
        id: crypto.randomUUID(),
        type: "photo",
        reason: attachment.reason,
        name: attachment.file.name,
        size: attachment.file.size,
        url: String(reader.result || ""),
        createdAt: new Date().toISOString()
      };
      setEvents((current) =>
        current.map((event) => {
          if (event.id !== id) return event;
          return {
            ...event,
            attachments: [localAttachment, ...(event.attachments || [])].slice(0, 12)
          };
        })
      );
    };
    reader.readAsDataURL(attachment.file);
  }

  function handleDocChange(event) {
    const { id, value } = event.target;
    setDocForm((current) => ({ ...current, [id]: value }));
  }

  function handleDocFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocFile(file);

    const base = {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      storageNote: ""
    };

    if (isProduction || file.size > 1200000) {
      setDocForm((current) => ({
        ...current,
        ...base,
        fileData: "",
        storageNote: isProduction ? "O ficheiro sera guardado no Supabase Storage." : "Ficheiro grande: apenas metadata na pre-visualizacao."
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDocForm((current) => ({
        ...current,
        ...base,
        fileData: String(reader.result || "")
      }));
    };
    reader.readAsDataURL(file);
  }

  async function addDepartmentDoc(event) {
    event.preventDefault();
    const title = docForm.title.trim();
    if (!title || !docForm.fileName) return;

    if (isProduction && supabaseRef.current && currentProfile?.id && docFile) {
      try {
        setSyncState("A enviar documento");
        await uploadDepartmentDocument(
          supabaseRef.current,
          { ...docForm, title, note: docForm.note.trim() },
          docFile,
          currentProfile.id
        );
        setDocFile(null);
        setDocForm({ ...initialDocForm, department: docForm.department });
        event.currentTarget.reset();
        await refreshWorkspace();
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao enviar documento");
        setSyncState("Erro ao enviar documento");
      }
      return;
    }

    const document = {
      id: crypto.randomUUID(),
      ...docForm,
      title,
      note: docForm.note.trim(),
      createdAt: new Date().toISOString()
    };

    setDepartmentDocs((current) => ({
      ...current,
      [docForm.department]: [document, ...(current[docForm.department] || [])].slice(0, 80)
    }));
    setDocFile(null);
    setDocForm({ ...initialDocForm, department: docForm.department });
    event.currentTarget.reset();
  }

  async function updateHousekeepingRoomStatus(binomeId, roomId, status) {
    if (isProduction && supabaseRef.current && currentProfile?.id) {
      try {
        await updateHousekeepingRoom(supabaseRef.current, roomId, status, currentProfile.id);
        await refreshWorkspace({ silent: true });
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao atualizar quarto");
      }
      return;
    }
    setHousekeepingPlan((current) => ({
      ...current,
      binomes: current.binomes.map((binome) =>
        binome.id === binomeId
          ? {
              ...binome,
              rooms: binome.rooms.map((room) =>
                room.id === roomId
                  ? {
                      ...room,
                      status,
                      updatedAt: new Date().toISOString()
                    }
                  : room
              )
            }
          : binome
      )
    }));
  }

  function resetHousekeepingPlan() {
    if (isProduction) {
      setSyncState("A estrutura de producao nao e apagada pela app");
      return;
    }
    setHousekeepingPlan(buildHousekeepingPlan());
  }

  async function createHousekeepingTasks() {
    const tasks = housekeepingPlan.binomes.flatMap((binome) =>
      binome.rooms
        .filter((room) => room.status !== "done")
        .map((room) => ({
          id: crypto.randomUUID(),
          department: "housekeeping",
          eventType: "room_cleaning",
          room: room.room,
          priority: room.service === "depart" || room.service === "deep_clean" ? "urgent" : "normal",
          note: `${binome.label} - ${housekeepingServiceLabel(room.service, activeLanguage)} - ${binome.zone}`,
          status: room.status === "blocked" ? "blocked" : "open",
          comments: [],
          createdAt: new Date().toISOString()
        }))
    );

    if (tasks.length === 0) return;
    if (isProduction && supabaseRef.current && currentProfile?.id) {
      try {
        setSyncState("A gerar tarefas Housekeeping");
        await createTasks(supabaseRef.current, tasks, currentProfile.id);
        await refreshWorkspace();
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "Erro ao gerar tarefas");
        setSyncState("Erro ao gerar tarefas");
      }
      return;
    }
    setEvents((current) => [...tasks, ...current].slice(0, 120));
  }

  return (
    <div className="hotel-ops">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">TKC</div>
          <div>
            <p className="brand-kicker">TKC Capital</p>
            <h1>{t("appTitle")}</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <Link className="os-back-link" href="/">Capital OS</Link>
          <label className="language-picker">
            <span>{t("language")}</span>
            <select value={activeLanguage} onChange={(event) => changeLanguage(event.target.value)}>
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.id} value={language.id}>{language.label}</option>
              ))}
            </select>
          </label>
          <div className="session-pill">
            <span>{t("activeProfile")}</span>
            <strong>{activeOperator ? activeOperator.name : signedInEmail || t("directionMode")}</strong>
            {currentProfile?.full_name && !activeOperator && <small>{currentProfile.full_name}</small>}
            {activeOperator && (
              <button className="secondary" type="button" onClick={() => setActiveOperatorId("")}>{t("exitProfile")}</button>
            )}
            {!activeOperator && authMode === "preview" && <small>Preview local</small>}
          </div>
          <div className="domain-pill" title="Dominio alvo">
            <span>Dominio</span>
            <strong>{domainLabel}</strong>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="hero-band">
          <div className="hero-copy">
            <p className="eyebrow">{t("heroEyebrow")}</p>
            <h2>{t("heroTitle")}</h2>
            <p>{t("heroCopy")}</p>
          </div>
          <div className="status-grid" aria-label="Resumo operacional">
            <article>
              <span>{t("roomsDone")}</span>
              <strong>{housekeepingStats.done}/{housekeepingStats.total}</strong>
            </article>
            <article>
              <span>{t("openMaintenance")}</span>
              <strong>{stats.openMaintenance}</strong>
            </article>
            <article>
              <span>{t("incidents")}</span>
              <strong>{stats.openIncidents}</strong>
            </article>
            <article>
              <span>{t("openTasks")}</span>
              <strong>{stats.openTasks}</strong>
              <small>{syncState}</small>
            </article>
          </div>
        </section>

        {workspaceError && <div className="sync-error">{workspaceError}</div>}

        {canUseHousekeeping && (
          <HousekeepingBoard
            plan={housekeepingPlan}
            stats={housekeepingStats}
            language={activeLanguage}
            onCreateTasks={createHousekeepingTasks}
            onReset={resetHousekeepingPlan}
            onStatusChange={updateHousekeepingRoomStatus}
            t={t}
          />
        )}

        <section className="workspace-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Evento operacional</p>
                <h2>Criar alerta</h2>
              </div>
              {!isProduction && <button className="secondary" onClick={resetDemo} type="button">Limpar demo</button>}
            </div>

            <form className="event-form" onSubmit={handleSubmit}>
              <label>
                Departamento
                <select id="department" value={form.department} onChange={handleChange} required>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>

              <label>
                Tipo de evento
                <select id="eventType" value={form.eventType} onChange={handleChange} required>
                  {Object.keys(EVENT_LABEL_TRANSLATIONS).map((eventType) => (
                    <option key={eventType} value={eventType}>{eventLabel(eventType, activeLanguage)}</option>
                  ))}
                </select>
              </label>

              <label>
                Quarto / zona
                <input id="room" value={form.room} onChange={handleChange} placeholder="204, lobby, bar..." maxLength={32} />
              </label>

              <label>
                Prioridade
                <select id="priority" value={form.priority} onChange={handleChange} required>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                  <option value="blocked">Bloqueante</option>
                </select>
              </label>

              <label className="full">
                Nota operacional
                <textarea
                  id="note"
                  rows={4}
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Ex: TV nao funciona, quarto pronto para controlo, falta stock..."
                  required
                />
              </label>

              <div className="actions full">
                <button type="submit">Guardar e enviar alerta</button>
                {!isProduction && <button className="secondary" onClick={runDemo} type="button">Carregar exemplo</button>}
              </div>
            </form>
          </div>

          <aside className="panel">
            <p className="eyebrow">Estrutura operacional</p>
            <h2>Departamentos da app</h2>
            <div className="channel-list">
              {Object.values(CHANNELS).map((item) => (
                <article className="channel" key={item.label}>
                  <strong><span>{item.label}</span></strong>
                  <span>{item.help}</span>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Ficheiros por departamento</p>
                <h2>Circulares, SOPs e fichas</h2>
              </div>
              <span className="badge">{docsForDepartment.length} ficheiros</span>
            </div>

            <form className="operator-form" onSubmit={addDepartmentDoc}>
              <label>
                Departamento
                <select id="department" value={docForm.department} onChange={handleDocChange}>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
              <label>
                Tipo
                <select id="type" value={docForm.type} onChange={handleDocChange}>
                  {DOCUMENT_TYPE_OPTIONS.map((type) => (
                    <option key={type.id} value={type.id}>{documentTypeLabel(type.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
              <label>
                Titulo
                <input id="title" value={docForm.title} onChange={handleDocChange} placeholder="Ex: SOP limpeza quarto" required />
              </label>
              <label>
                Ficheiro
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleDocFileChange}
                  required
                  type="file"
                />
              </label>
              <label className="full">
                Nota
                <textarea id="note" rows={3} value={docForm.note} onChange={handleDocChange} placeholder="Quando usar, quem aplica, versao..." />
              </label>
              {docForm.fileName && (
                <div className="file-preview full">
                  <span className="badge">{docForm.fileName}</span>
                  <span>{formatFileSize(docForm.fileSize)}</span>
                  {docForm.storageNote && <span>{docForm.storageNote}</span>}
                </div>
              )}
              <div className="actions full">
                <button type="submit">Adicionar ficheiro</button>
              </div>
            </form>

            <div className="document-list">
              {docsForDepartment.length === 0 ? (
                <div className="empty">Sem ficheiros neste departamento.</div>
              ) : (
                docsForDepartment.map((document) => (
                  <article className="document-card" key={document.id}>
                    <div>
                      <strong>{document.title}</strong>
                      <span>{document.fileName} - {formatFileSize(document.fileSize)}</span>
                    </div>
                    <div className="event-meta">
                      <span className="badge">{documentTypeLabel(document.type, activeLanguage)}</span>
                      <span className="badge">{departmentLabel(document.department, activeLanguage)}</span>
                      {document.fileData ? (
                        <a className="button-link" href={document.fileData} rel="noreferrer" target="_blank">Abrir</a>
                      ) : (
                        <span className="badge urgent">Metadata</span>
                      )}
                    </div>
                    {document.note && <p>{document.note}</p>}
                    {document.storageNote && <small>{document.storageNote}</small>}
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">Base documental</p>
            <h2>Operacao sem WhatsApp perdido</h2>
            <p className="notice">
              Cada departamento deve ter os seus SOPs, circulares, fichas de posto
              e checklists no mesmo sitio das tarefas. Menos procura de ficheiros,
              mais execucao.
            </p>
          </aside>
        </section>

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Historico operacional</p>
                <h2>Eventos recentes</h2>
              </div>
              <span className="badge">{events.length} eventos</span>
            </div>

            <div className="event-list">
              {events.length === 0 ? (
                <div className="empty">Sem eventos ainda. Cria um alerta ou testa a demo.</div>
              ) : (
                events.map((event) => (
                  <EventItem
                    event={event}
                    key={event.id}
                    language={activeLanguage}
                    t={t}
                    onAddComment={addComment}
                    onAddPhoto={addTaskPhoto}
                    onStatusChange={updateTaskStatus}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">Dominio proprio</p>
            <h2>Preparado para marca TKC</h2>
            <ul className="setup-list">
              <li><strong>Frontend:</strong> app.tkccapital.pt</li>
              <li><strong>API:</strong> api.tkccapital.pt</li>
              <li><strong>Dados:</strong> Supabase com RLS por departamento</li>
              <li><strong>Convites:</strong> email e primeiro acesso protegido</li>
            </ul>
            <p className="notice">
              A app e o sistema operacional oficial. Tarefas, mensagens,
              documentos e quartos deixam de depender de ferramentas externas.
            </p>
          </aside>
        </section>

        {isDirection && (
        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Acessos</p>
                <h2>Perfis de operadores</h2>
              </div>
              <div className="event-meta">
                <span className="badge">{operators.length} perfis</span>
                <span className={`badge ${inviteClass(inviteState)}`}>{inviteState}</span>
              </div>
            </div>

            <form className="operator-form" onSubmit={createOperator}>
              <label>
                Nome
                <input id="name" value={operatorForm.name} onChange={handleOperatorChange} placeholder="Nome do operador" required />
              </label>
              <label>
                Email
                <input id="email" type="email" value={operatorForm.email} onChange={handleOperatorChange} placeholder="operador@email.com" required />
              </label>
              <label>
                Papel
                <select id="role" value={operatorForm.role} onChange={handleOperatorChange}>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.id} value={role.id}>{roleLabel(role.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
              <label>
                Idioma
                <select id="language" value={operatorForm.language} onChange={handleOperatorChange}>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.id} value={language.id}>{language.label}</option>
                  ))}
                </select>
              </label>
              <fieldset className="department-fieldset full">
                <legend>Departamentos autorizados</legend>
                <div className="check-grid">
                  {DEPARTMENT_OPTIONS.map((department) => (
                    <label className="check-row" key={department.id}>
                      <input
                        type="checkbox"
                        checked={operatorForm.departments.includes(department.id)}
                        onChange={() => toggleOperatorDepartment(department.id)}
                      />
                      <span>{departmentLabel(department.id, activeLanguage)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="actions full">
                <button type="submit">Criar perfil antes do login</button>
              </div>
            </form>

            <div className="operator-list">
              {operators.length === 0 ? (
                <div className="empty">Nenhum operador criado. A equipa nao escolhe departamento sozinha; a direcao define antes.</div>
              ) : (
                operators.map((operator) => (
                  <article className="operator-card" key={operator.id}>
                    <strong>{operator.name}</strong>
                    <span>{operator.email}</span>
                    <div className="event-meta">
                      <span className="badge">{roleLabel(operator.role, activeLanguage)}</span>
                      <span className="badge">{operator.language.toUpperCase()}</span>
                      <span className={`badge ${inviteClass(operator.inviteStatus)}`}>{inviteLabel(operator.inviteStatus)}</span>
                      <span className={`badge ${operatorAccountClass(operator)}`}>{operatorAccountLabel(operator)}</span>
                    </div>
                    <div className="operator-departments">
                      {operator.departments.map((department) => (
                        <span className="badge" key={department}>{departmentLabel(department, activeLanguage)}</span>
                      ))}
                    </div>
                    <div className="task-actions">
                      {!isProduction && <button className="secondary" type="button" onClick={() => setActiveOperatorId(operator.id)}>{t("useProfile")}</button>}
                      <button className="secondary" type="button" onClick={() => sendOperatorInvite(operator, "resend")}>Reenviar convite</button>
                      <button className="secondary" type="button" onClick={() => setAccessOperatorId(operator.id)}>Info acesso</button>
                      {!isProduction && <button type="button" onClick={() => markAccountCreated(operator.id)}>
                        {operatorAccountStatus(operator) === "active" ? "Conta confirmada" : "Conta criada"}
                      </button>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">Primeiro login</p>
            <h2>Fluxo correto</h2>
            <ol className="setup-list">
              <li>Direcao cria perfil e departamentos.</li>
              <li>Operador recebe convite por email.</li>
              <li>Operador cria palavra-passe.</li>
              <li>Operador completa dados autorizados.</li>
              <li>App abre so os departamentos permitidos.</li>
            </ol>
          </aside>
        </section>
        )}

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Chat por departamento</p>
                <h2>{departmentLabel(activeChatDepartment, activeLanguage)}</h2>
              </div>
              <label className="compact-label">
                Departamento
                <select value={activeChatDepartment} onChange={(event) => setActiveChatDepartment(event.target.value)}>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="access-strip">
              <strong>Acesso aprovado pela direcao</strong>
              <span>{authorizedChatOperators.length} operador(es) com acesso a este departamento</span>
              <div className="operator-departments">
                {authorizedChatOperators.length === 0 ? (
                  <span className="badge blocked">Sem operador autorizado</span>
                ) : (
                  authorizedChatOperators.map((operator) => (
                    <span className={`badge ${operatorAccountClass(operator)}`} key={operator.id}>{operator.name}</span>
                  ))
                )}
              </div>
            </div>

            <form className="chat-form" onSubmit={addDepartmentMessage}>
              <textarea
                rows={3}
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Mensagem para o departamento selecionado..."
              />
              <button type="submit">Enviar ao departamento</button>
            </form>

            <div className="chat-list">
              {activeChatMessages.length === 0 ? (
                <div className="empty">Sem mensagens neste departamento.</div>
              ) : (
                activeChatMessages.map((item) => (
                  <article className="chat-message" key={item.id}>
                    <p>{item.text}</p>
                    <small>{item.author} - {new Date(item.createdAt).toLocaleString("pt-PT")}</small>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">Autorizacao</p>
            <h2>Sem canal aberto</h2>
            <p className="notice">
              O operador so ve o chat dos departamentos atribuidos pela direcao.
              Em producao, esta regra fica protegida por RLS no Supabase e tambem refletida no ecran.
            </p>
          </aside>
        </section>

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Chat geral</p>
                <h2>Ideias e decisoes</h2>
              </div>
              <span className="badge">{ideas.length} mensagens</span>
            </div>

            <form className="chat-form" onSubmit={addIdea}>
              <textarea
                rows={3}
                value={ideaText}
                onChange={(event) => setIdeaText(event.target.value)}
                placeholder="Trocar ideia, registar decisao, nota de direcao..."
              />
              <button type="submit">Adicionar</button>
            </form>

            <div className="chat-list">
              {ideas.length === 0 ? (
                <div className="empty">Sem mensagens. Usa este espaco para ideias, decisoes e notas gerais.</div>
              ) : (
                ideas.map((item) => (
                  <article className="chat-message" key={item.id}>
                    <p>{item.text}</p>
                    <small>{new Date(item.createdAt).toLocaleString("pt-PT")}</small>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">Chat interno</p>
            <h2>App autonoma</h2>
            <p className="notice">
              Tarefas, comentarios, ideias e conversas por departamento ficam
              na app TKC, com o acesso definido pela direcao.
            </p>
          </aside>
        </section>

        {activeAccessOperator && (
          <div className="modal-backdrop" role="presentation" onClick={() => setAccessOperatorId(null)}>
            <section className="modal" role="dialog" aria-modal="true" aria-label="Informacao de acesso" onClick={(event) => event.stopPropagation()}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Acesso operador</p>
                  <h2>{activeAccessOperator.name}</h2>
                </div>
                <button className="secondary" type="button" onClick={() => setAccessOperatorId(null)}>Fechar</button>
              </div>
              <div className="access-detail">
                <p><strong>Email:</strong> {activeAccessOperator.email}</p>
                <p><strong>Conta:</strong> {operatorAccountLabel(activeAccessOperator)}</p>
                <p><strong>Convites:</strong> {activeAccessOperator.inviteCount || 0}</p>
                <p><strong>Ultimo convite:</strong> {activeAccessOperator.lastInviteAt ? new Date(activeAccessOperator.lastInviteAt).toLocaleString("pt-PT") : "Ainda nao enviado"}</p>
                <p><strong>Conta criada em:</strong> {activeAccessOperator.accountCreatedAt ? new Date(activeAccessOperator.accountCreatedAt).toLocaleString("pt-PT") : "Pendente"}</p>
                <div>
                  <strong>Departamentos autorizados</strong>
                  <div className="operator-departments">
                    {(activeAccessOperator.departments || []).map((department) => (
                      <span className="badge" key={department}>{departmentLabel(department, activeLanguage)}</span>
                    ))}
                  </div>
                </div>
                <p className="notice">
                  Se a conta ja estiver criada, reenviar convite deve servir para
                  reposicao de acesso ou primeiro login pendente, nao para criar
                  uma segunda conta.
                </p>
              </div>
              <div className="actions">
                <button className="secondary" type="button" onClick={() => sendOperatorInvite(activeAccessOperator, "resend")}>Reenviar convite</button>
                {!isProduction && <button type="button" onClick={() => markAccountCreated(activeAccessOperator.id)}>Marcar conta criada</button>}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function HousekeepingBoard({ language, plan, stats, onCreateTasks, onReset, onStatusChange, t }) {
  return (
    <section className="workspace-grid bottom">
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Housekeeping</p>
            <h2>{t("housekeepingTitle")}</h2>
          </div>
          <div className="event-meta">
            <span className="badge">{stats.total} {t("totalRooms")}</span>
            <span className="badge urgent">{stats.pending} {t("pending")}</span>
            <span className="badge done">{stats.done} {t("done")}</span>
            <span className="badge blocked">{stats.blocked} {t("blocked")}</span>
          </div>
        </div>

        <div className="access-strip">
          <strong>{t("importedStructure")}</strong>
          <span>{t("legacyNotice")}</span>
          <span>{t("plannedTime")}: {stats.minutes} min / {Math.ceil(stats.minutes / 60)} h</span>
        </div>

        <div className="actions housekeeping-actions">
          <button type="button" onClick={onCreateTasks}>{t("generateTasks")}</button>
          <button className="secondary" type="button" onClick={onReset}>{t("resetRooms")}</button>
        </div>

        <div className="binome-grid">
          {plan.binomes.map((binome) => (
            <article className="binome-card" key={binome.id}>
              <div className="binome-head">
                <div>
                  <strong>{binome.label}</strong>
                  <span>{binome.zone}</span>
                </div>
                <span className="badge">{binome.members.join(" + ")}</span>
              </div>

              <div className="room-grid">
                {binome.rooms.map((room) => (
                  <article className={`room-card ${room.status}`} key={room.id}>
                    <div className="room-main">
                      <strong>{room.room}</strong>
                      <span>{housekeepingServiceLabel(room.service, language)}</span>
                    </div>
                    <span className={`badge ${roomStatusClass(room.status)}`}>{roomStatusLabel(room.status, language)}</span>
                    <div className="room-actions">
                      <button className="secondary" type="button" onClick={() => onStatusChange(binome.id, room.id, "in_progress")}>{t("start")}</button>
                      <button className="secondary" type="button" onClick={() => onStatusChange(binome.id, room.id, "control")}>{t("control")}</button>
                      <button type="button" onClick={() => onStatusChange(binome.id, room.id, "done")}>{t("ok")}</button>
                      <button className="secondary" type="button" onClick={() => onStatusChange(binome.id, room.id, "blocked")}>{t("blockShort")}</button>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="panel">
        <p className="eyebrow">{t("singleSystem")}</p>
        <h2>{t("legacyIntegrated")}</h2>
        <ul className="setup-list">
          <li><strong>{t("officialApp")}:</strong> TKC Capital Ops</li>
          <li><strong>{t("module")}:</strong> Housekeeping / Rooms</li>
          <li><strong>{t("oldSite")}:</strong> TKC Rooms legado</li>
          <li><strong>{t("nextStep")}:</strong> {t("redirectOldLink")}</li>
        </ul>
        <p className="notice">
          {t("noTwoSystems")}
        </p>
        <a className="button-link muted-link" href={plan.legacyUrl} rel="noreferrer" target="_blank">{t("viewLegacy")}</a>
      </aside>
    </section>
  );
}

function AccessState({ title, message }) {
  return (
    <div className="hotel-ops">
      <main className="shell access-state">
        <section className="panel">
          <p className="eyebrow">TKC Capital Ops</p>
          <h1>{title}</h1>
          <p className="notice">{message}</p>
          <Link className="button-link" href="/login?next=%2Fhotel">Voltar ao login</Link>
        </section>
      </main>
    </div>
  );
}

function EventItem({ event, language, onAddComment, onAddPhoto, onStatusChange, t }) {
  const [comment, setComment] = useState("");
  const [photoReason, setPhotoReason] = useState("maintenance_issue");
  const channel = CHANNELS[event.department]?.channel || "#ops";
  const badgeClass = event.priority === "blocked" ? "blocked" : event.priority === "urgent" ? "urgent" : "done";
  const room = event.room ? ` - ${event.room}` : "";
  const status = event.status || "open";
  const comments = event.comments || [];
  const attachments = event.attachments || [];

  function submitComment(submitEvent) {
    submitEvent.preventDefault();
    onAddComment(event.id, comment);
    setComment("");
  }

  function handlePhotoChange(changeEvent) {
    const file = changeEvent.target.files?.[0];
    if (!file) return;
    onAddPhoto(event.id, { file, reason: photoReason });
    changeEvent.target.value = "";
  }

  return (
    <article className="event">
      <strong>
        <span>{eventLabel(event.eventType, language)}{room}</span>
        <span className="event-badges">
          <span className={`badge ${badgeClass}`}>{event.priority}</span>
          <span className={`badge ${statusClass(status)}`}>{statusLabel(status, language)}</span>
        </span>
      </strong>
      <p>{event.note}</p>
      <div className="event-meta">
        <span className="badge">{channel}</span>
        <small>{new Date(event.createdAt).toLocaleString("pt-PT")}</small>
      </div>

      <div className="task-actions" aria-label="Estado da tarefa">
        <button className="secondary" type="button" onClick={() => onStatusChange(event.id, "open")}>{statusLabel("open", language)}</button>
        <button className="secondary" type="button" onClick={() => onStatusChange(event.id, "in_progress")}>{statusLabel("in_progress", language)}</button>
        <button className="secondary" type="button" onClick={() => onStatusChange(event.id, "blocked")}>{statusLabel("blocked", language)}</button>
        <button type="button" onClick={() => onStatusChange(event.id, "done")}>{statusLabel("done", language)}</button>
      </div>

      <div className="photo-actions">
        <select value={photoReason} onChange={(changeEvent) => setPhotoReason(changeEvent.target.value)} aria-label="Tipo de foto">
          {PHOTO_REASON_OPTIONS.map((reason) => (
            <option key={reason.id} value={reason.id}>{photoReasonLabel(reason.id, language)}</option>
          ))}
        </select>
        <label className="file-button">
          {t("addPhoto")}
          <input accept="image/*" capture="environment" onChange={handlePhotoChange} type="file" />
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="attachment-grid">
          {attachments.map((attachment) => (
            <figure className="attachment-card" key={attachment.id}>
              <img alt={photoReasonLabel(attachment.reason, language)} src={attachment.url} />
              <figcaption>
                <span>{photoReasonLabel(attachment.reason, language)}</span>
                <small>{new Date(attachment.createdAt).toLocaleString("pt-PT")}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {comments.length > 0 && (
        <div className="comments">
          {comments.map((item) => (
            <div className="comment" key={item.id}>
              <p>{item.text}</p>
              <small>{new Date(item.createdAt).toLocaleString("pt-PT")}</small>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={submitComment}>
        <input
          aria-label="Adicionar comentario"
          placeholder="Adicionar comentario..."
          value={comment}
          onChange={(changeEvent) => setComment(changeEvent.target.value)}
        />
        <button className="secondary" type="submit">{t("comment")}</button>
      </form>
    </article>
  );
}

function translate(language, key) {
  return UI_TEXT[language]?.[key] || UI_TEXT.fr[key] || UI_TEXT.pt[key] || key;
}

function translatedLabel(map, id, language, fallback) {
  return map[id]?.[language] || map[id]?.fr || map[id]?.pt || fallback || id;
}

function statusLabel(status, language = "fr") {
  return translatedLabel(TASK_STATUS_LABELS, status, language, "Ouverte");
}

function statusClass(status) {
  if (status === "done") return "done";
  if (status === "blocked") return "blocked";
  if (status === "in_progress") return "urgent";
  return "";
}

function roleLabel(role, language = "fr") {
  return translatedLabel(ROLE_LABELS, role, language, "Operateur");
}

function departmentLabel(department, language = "fr") {
  return translatedLabel(DEPARTMENT_LABELS, department, language, department);
}

function getHousekeepingStats(plan) {
  const rooms = plan.binomes.flatMap((binome) => binome.rooms);
  const minutes = rooms
    .filter((room) => room.status !== "done")
    .reduce((total, room) => total + housekeepingServiceMinutes(room.service), 0);

  return {
    total: rooms.length,
    pending: rooms.filter((room) => !["done", "blocked"].includes(room.status)).length,
    done: rooms.filter((room) => room.status === "done").length,
    blocked: rooms.filter((room) => room.status === "blocked").length,
    minutes
  };
}

function eventLabel(eventType, language = "fr") {
  return translatedLabel(EVENT_LABEL_TRANSLATIONS, eventType, language, EVENT_LABELS[eventType] || "Evenement");
}

function housekeepingServiceLabel(service, language = "fr") {
  return translatedLabel(HOUSEKEEPING_SERVICE_LABELS, service, language, "Service");
}

function housekeepingServiceMinutes(service) {
  return HOUSEKEEPING_SERVICE_OPTIONS.find((item) => item.id === service)?.minutes || 0;
}

function roomStatusLabel(status, language = "fr") {
  return translatedLabel(ROOM_STATUS_LABELS, status, language, "A faire");
}

function roomStatusClass(status) {
  if (status === "done") return "done";
  if (status === "blocked") return "blocked";
  if (status === "control" || status === "in_progress") return "urgent";
  return "";
}

function photoReasonLabel(reason, language = "fr") {
  return translatedLabel(PHOTO_REASON_LABELS, reason, language, "Photo");
}

function documentTypeLabel(type, language = "fr") {
  return translatedLabel(DOCUMENT_TYPE_LABELS, type, language, "Document");
}

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function operatorAccountStatus(operator) {
  if (operator.accountStatus) return operator.accountStatus;
  return operator.accountCreatedAt || operator.firstLoginRequired === false ? "active" : "pending";
}

function operatorAccountLabel(operator) {
  return operatorAccountStatus(operator) === "active" ? "Conta criada" : "Acesso pendente";
}

function operatorAccountClass(operator) {
  return operatorAccountStatus(operator) === "active" ? "done" : "urgent";
}

function inviteLabel(status) {
  const labels = {
    sending: "A enviar convite",
    sent: "Convite enviado",
    dry_run: "Convite preparado",
    error: "Erro no convite"
  };
  return labels[status] || "Primeiro login pendente";
}

function inviteClass(status) {
  if (status === "sent" || status === "Convite enviado") return "done";
  if (status === "error" || status === "Erro no convite") return "blocked";
  if (status === "sending" || status === "A enviar convite" || status === "dry_run" || status === "Convite preparado") return "urgent";
  return "";
}
