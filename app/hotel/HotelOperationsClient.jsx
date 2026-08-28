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
  setHousekeepingBinomeAssignments,
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
    helpKey: "channelHousekeepingHelp"
  },
  reception: {
    channel: "#01-reception",
    label: "Reception",
    helpKey: "channelReceptionHelp"
  },
  maintenance: {
    channel: "#03-maintenance",
    label: "Maintenance",
    helpKey: "channelMaintenanceHelp"
  },
  pdj_bar: {
    channel: "#04-pdj-bar",
    label: "PDJ / Bar",
    helpKey: "channelPdjHelp"
  },
  incidents: {
    channel: "#05-incidents",
    label: "Incidents",
    helpKey: "channelIncidentsHelp"
  },
  handover: {
    channel: "#00-handover",
    label: "Handover",
    helpKey: "channelHandoverHelp"
  },
  direction: {
    channel: "#06-direction-prive",
    label: "Direction",
    helpKey: "channelDirectionHelp"
  }
};

const EVENT_LABELS = {
  department_task: "Tarefa de departamento",
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
const IBIS_LOGO_URL = "https://images.group.accor.com/yrj0orc8tx24/7dFUOI9ugM7daxneFKLsiT/013e03109cadf22a89435390b151f4eb/LogoMarque-Groupe_ibis.svg";

const LANGUAGE_OPTIONS = [
  { id: "fr", label: "Français" },
  { id: "pt", label: "Português" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
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
    appTitle: "Système d'exploitation hôtelier",
    heroEyebrow: "TKC Capital / Opérations hôtelières",
    heroTitle: "Une plateforme TKC pour piloter les chambres, les tâches, les équipes et les décisions.",
    heroCopy: "Tâches par service, chambres, maintenance, incidents, documents et messagerie dans une seule app.",
    roomsDone: "Chambres faites",
    openMaintenance: "Pannes ouvertes",
    incidents: "Incidents",
    openTasks: "Tâches ouvertes",
    housekeepingTitle: "Binômes et chambres à faire",
    totalRooms: "chambres",
    pending: "en attente",
    done: "faites",
    blocked: "bloquées",
    importedStructure: "Structure importée dans le système unique",
    legacyNotice: "TKC Rooms devient l'ancien site ; l'opération quotidienne vit ici.",
    plannedTime: "Temps prévu",
    generateTasks: "Générer les tâches Housekeeping",
    resetRooms: "Réinitialiser les 74 chambres",
    singleSystem: "Système unique",
    legacyIntegrated: "TKC Rooms intégré",
    officialApp: "App officielle",
    module: "Module",
    oldSite: "Ancien site",
    nextStep: "Prochaine étape",
    redirectOldLink: "rediriger l'ancien lien",
    noTwoSystems: "Pas deux logins, deux listes de chambres ou deux historiques.",
    viewLegacy: "Voir TKC Rooms ancien",
    start: "Démarrer",
    control: "Contrôle",
    ok: "OK",
    blockShort: "Bloq.",
    activeProfile: "Profil",
    directionMode: "Direction/global",
    exitProfile: "Quitter le profil",
    useProfile: "Utiliser le profil",
    addPhoto: "Ajouter une photo",
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

const localized = (pt, fr, en, es, it, pl) => ({ pt, fr, en, es, it, pl });

const UI_TEXT_EXTRA = {
  propertyHotel: localized("Hotel abrangido", "Hôtel concerné", "Hotel", "Hotel", "Hotel", "Hotel"),
  propertyInternal: localized("Ferramenta operacional interna", "Outil opérationnel interne", "Internal operations tool", "Herramienta operativa interna", "Strumento operativo interno", "Wewnętrzne narzędzie operacyjne"),
  propertyReminder: localized("Esta pagina operacional destina-se exclusivamente ao hotel ibis Nogent-sur-Marne.", "Cette page opérationnelle concerne exclusivement l'hôtel ibis Nogent-sur-Marne.", "This operations page is exclusively for ibis Nogent-sur-Marne hotel.", "Esta página operativa corresponde exclusivamente al hotel ibis Nogent-sur-Marne.", "Questa pagina operativa è riservata esclusivamente all'hotel ibis Nogent-sur-Marne.", "Ta strona operacyjna jest przeznaczona wyłącznie dla hotelu ibis Nogent-sur-Marne."),
  departmentTasksEyebrow: localized("Tarefas por departamento", "Tâches par département", "Tasks by department", "Tareas por departamento", "Attività per reparto", "Zadania według działu"),
  departmentTasksTitle: localized("Plano de tarefas da equipa", "Plan de tâches des équipes", "Team task plan", "Plan de tareas del equipo", "Piano attività dei team", "Plan zadań zespołów"),
  departmentTaskFilter: localized("Filtrar por departamento", "Filtrer par département", "Filter by department", "Filtrar por departamento", "Filtra per reparto", "Filtruj według działu"),
  allDepartments: localized("Todos os departamentos", "Tous les départements", "All departments", "Todos los departamentos", "Tutti i reparti", "Wszystkie działy"),
  newDepartmentTask: localized("Nova tarefa", "Nouvelle tâche", "New task", "Nueva tarea", "Nuova attività", "Nowe zadanie"),
  taskTitle: localized("Titulo da tarefa", "Titre de la tâche", "Task title", "Título de la tarea", "Titolo dell'attività", "Tytuł zadania"),
  taskTitlePlaceholder: localized("Ex.: Verificar fecho de caixa", "Ex. : Vérifier la clôture de caisse", "E.g. Check cash closing", "Ej.: Verificar cierre de caja", "Es.: Verificare la chiusura cassa", "Np. Sprawdzić zamknięcie kasy"),
  taskDescription: localized("Descricao", "Description", "Description", "Descripción", "Descrizione", "Opis"),
  taskDescriptionPlaceholder: localized("Indique o que deve ser feito e o resultado esperado.", "Indiquez ce qui doit être fait et le résultat attendu.", "Describe what must be done and the expected result.", "Indique qué debe hacerse y el resultado esperado.", "Indicare cosa deve essere fatto e il risultato atteso.", "Opisz, co należy zrobić i jaki ma być oczekiwany rezultat."),
  createDepartmentTask: localized("Criar tarefa", "Créer la tâche", "Create task", "Crear tarea", "Crea attività", "Utwórz zadanie"),
  noDepartmentTasks: localized("Nenhuma tarefa de departamento em curso.", "Aucune tâche départementale en cours.", "No department tasks in progress.", "No hay tareas de departamento en curso.", "Nessuna attività di reparto in corso.", "Brak zadań działowych w toku."),
  directionOnlyTaskCreation: localized("Apenas a direcao pode criar tarefas de departamento. Pode atualizar o estado das tarefas dos seus departamentos.", "Seule la direction peut créer des tâches départementales. Vous pouvez mettre à jour l'état des tâches de vos services.", "Only management can create department tasks. You can update tasks for your departments.", "Solo la dirección puede crear tareas de departamento. Puede actualizar las tareas de sus departamentos.", "Solo la direzione può creare attività di reparto. Puoi aggiornare quelle dei tuoi reparti.", "Tylko dyrekcja może tworzyć zadania działowe. Możesz aktualizować zadania swoich działów."),
  savingDepartmentTask: localized("A guardar tarefa", "Enregistrement de la tâche", "Saving task", "Guardando tarea", "Salvataggio attività", "Zapisywanie zadania"),
  departmentTaskSaved: localized("Tarefa criada", "Tâche créée", "Task created", "Tarea creada", "Attività creata", "Zadanie utworzone"),
  departmentTaskError: localized("Erro ao criar tarefa", "Erreur lors de la création de la tâche", "Error creating task", "Error al crear la tarea", "Errore durante la creazione dell'attività", "Błąd podczas tworzenia zadania"),
  previewLocal: localized("Pre-visualizacao local", "Apercu local", "Local preview", "Vista previa local", "Anteprima locale", "Podglad lokalny"),
  targetDomain: localized("Dominio alvo", "Domaine cible", "Target domain", "Dominio objetivo", "Dominio di destinazione", "Domena docelowa"),
  domain: localized("Dominio", "Domaine", "Domain", "Dominio", "Dominio", "Domena"),
  operationalSummary: localized("Resumo operacional", "Resume operationnel", "Operational summary", "Resumen operativo", "Riepilogo operativo", "Podsumowanie operacyjne"),
  operationalEvent: localized("Evento operacional", "Evenement operationnel", "Operational event", "Evento operativo", "Evento operativo", "Zdarzenie operacyjne"),
  createAlert: localized("Criar alerta", "Creer une alerte", "Create alert", "Crear alerta", "Crea avviso", "Utworz alert"),
  clearDemo: localized("Limpar demo", "Effacer la demo", "Clear demo", "Borrar demo", "Cancella demo", "Wyczysc demo"),
  department: localized("Departamento", "Departement", "Department", "Departamento", "Reparto", "Dzial"),
  eventType: localized("Tipo de evento", "Type d'evenement", "Event type", "Tipo de evento", "Tipo di evento", "Typ zdarzenia"),
  roomZone: localized("Quarto / zona", "Chambre / zone", "Room / area", "Habitacion / zona", "Camera / zona", "Pokoj / strefa"),
  priority: localized("Prioridade", "Priorite", "Priority", "Prioridad", "Priorita", "Priorytet"),
  normal: localized("Normal", "Normale", "Normal", "Normal", "Normale", "Normalny"),
  urgent: localized("Urgente", "Urgente", "Urgent", "Urgente", "Urgente", "Pilne"),
  blocking: localized("Bloqueante", "Bloquante", "Blocking", "Bloqueante", "Bloccante", "Blokujace"),
  operationalNote: localized("Nota operacional", "Note operationnelle", "Operational note", "Nota operativa", "Nota operativa", "Notatka operacyjna"),
  notePlaceholder: localized("Ex.: TV nao funciona, quarto pronto para controlo, falta stock...", "Ex. : TV en panne, chambre prete pour controle, stock manquant...", "E.g. TV not working, room ready for inspection, stock missing...", "Ej.: TV no funciona, habitacion lista para control, falta stock...", "Es.: TV non funziona, camera pronta per il controllo, stock mancante...", "Np. telewizor nie dziala, pokoj gotowy do kontroli, brak zapasu..."),
  saveSendAlert: localized("Guardar e enviar alerta", "Enregistrer et envoyer l'alerte", "Save and send alert", "Guardar y enviar alerta", "Salva e invia avviso", "Zapisz i wyslij alert"),
  loadExample: localized("Carregar exemplo", "Charger un exemple", "Load example", "Cargar ejemplo", "Carica esempio", "Wczytaj przyklad"),
  operationalStructure: localized("Estrutura operacional", "Structure operationnelle", "Operational structure", "Estructura operativa", "Struttura operativa", "Struktura operacyjna"),
  appDepartments: localized("Departamentos da app", "Departements de l'app", "App departments", "Departamentos de la app", "Reparti dell'app", "Dzialy aplikacji"),
  channelHousekeepingHelp: localized("Quartos prontos, recouches, bloqueios e prioridades.", "Chambres pretes, recouches, blocages et priorites.", "Ready rooms, stayovers, blocks and priorities.", "Habitaciones listas, estancias, bloqueos y prioridades.", "Camere pronte, fermate, blocchi e priorita.", "Gotowe pokoje, pobyty, blokady i priorytety."),
  channelReceptionHelp: localized("Reservas, pedidos especiais, chegada e passagem de turno.", "Reservations, demandes speciales, arrivees et passation.", "Bookings, special requests, arrivals and handover.", "Reservas, solicitudes especiales, llegadas y cambio de turno.", "Prenotazioni, richieste speciali, arrivi e passaggio turno.", "Rezerwacje, prosby specjalne, przyjazdy i przekazanie zmiany."),
  channelMaintenanceHelp: localized("Avarias, fotos, quartos bloqueados e acompanhamento.", "Pannes, photos, chambres bloquees et suivi.", "Faults, photos, blocked rooms and follow-up.", "Averias, fotos, habitaciones bloqueadas y seguimiento.", "Guasti, foto, camere bloccate e monitoraggio.", "Usterki, zdjecia, zablokowane pokoje i dalsze dzialania."),
  channelPdjHelp: localized("Stock, mise en place, pequeno-almoco e bar.", "Stock, mise en place, petit-dejeuner et bar.", "Stock, setup, breakfast and bar.", "Stock, preparacion, desayuno y bar.", "Scorte, preparazione, colazione e bar.", "Zapasy, przygotowanie, sniadanie i bar."),
  channelIncidentsHelp: localized("Problemas operacionais sem dados pessoais sensiveis.", "Problemes operationnels sans donnees personnelles sensibles.", "Operational issues without sensitive personal data.", "Problemas operativos sin datos personales sensibles.", "Problemi operativi senza dati personali sensibili.", "Problemy operacyjne bez wrazliwych danych osobowych."),
  channelHandoverHelp: localized("Resumo de turno, pendentes e prioridades.", "Resume de service, points en attente et priorites.", "Shift summary, pending items and priorities.", "Resumen de turno, pendientes y prioridades.", "Riepilogo turno, attivita in sospeso e priorita.", "Podsumowanie zmiany, oczekujace zadania i priorytety."),
  channelDirectionHelp: localized("Decisoes, arbitragem e assuntos de direcao.", "Decisions, arbitrages et sujets de direction.", "Decisions, arbitration and management matters.", "Decisiones, arbitraje y asuntos de direccion.", "Decisioni, arbitraggio e temi della direzione.", "Decyzje, rozstrzygniecia i sprawy dyrekcji."),
  filesByDepartment: localized("Ficheiros por departamento", "Fichiers par departement", "Files by department", "Archivos por departamento", "File per reparto", "Pliki wedlug dzialu"),
  documentSetTitle: localized("Circulares, SOPs e fichas", "Circulaires, SOP et fiches de poste", "Circulars, SOPs and job sheets", "Circulares, SOP y fichas de puesto", "Circolari, SOP e schede mansione", "Okolniki, SOP i opisy stanowisk"),
  files: localized("ficheiros", "fichiers", "files", "archivos", "file", "plikow"),
  type: localized("Tipo", "Type", "Type", "Tipo", "Tipo", "Typ"),
  title: localized("Titulo", "Titre", "Title", "Titulo", "Titolo", "Tytul"),
  file: localized("Ficheiro", "Fichier", "File", "Archivo", "File", "Plik"),
  note: localized("Nota", "Note", "Note", "Nota", "Nota", "Notatka"),
  docTitlePlaceholder: localized("Ex.: SOP limpeza de quarto", "Ex. : SOP nettoyage de chambre", "E.g. room-cleaning SOP", "Ej.: SOP limpieza de habitacion", "Es.: SOP pulizia camera", "Np. SOP sprzatania pokoju"),
  docNotePlaceholder: localized("Quando usar, quem aplica, versao...", "Quand l'utiliser, qui l'applique, version...", "When to use, who applies it, version...", "Cuando usar, quien aplica, version...", "Quando usarlo, chi lo applica, versione...", "Kiedy uzywac, kto stosuje, wersja..."),
  addFile: localized("Adicionar ficheiro", "Ajouter le fichier", "Add file", "Agregar archivo", "Aggiungi file", "Dodaj plik"),
  noFiles: localized("Sem ficheiros neste departamento.", "Aucun fichier dans ce departement.", "No files in this department.", "No hay archivos en este departamento.", "Nessun file in questo reparto.", "Brak plikow w tym dziale."),
  openDocument: localized("Abrir", "Ouvrir", "Open", "Abrir", "Apri", "Otworz"),
  metadataOnly: localized("Apenas metadados", "Metadonnees uniquement", "Metadata only", "Solo metadatos", "Solo metadati", "Tylko metadane"),
  documentBase: localized("Base documental", "Base documentaire", "Document base", "Base documental", "Archivio documentale", "Baza dokumentow"),
  documentsTogetherTitle: localized("Documentacao centralizada", "Documentation centralisee", "Centralized documentation", "Documentacion centralizada", "Documentazione centralizzata", "Scentralizowana dokumentacja"),
  documentsTogetherCopy: localized("Cada departamento guarda aqui SOPs, circulares, fichas de posto e checklists. Menos procura, mais execucao.", "Chaque departement conserve ici ses SOP, circulaires, fiches de poste et checklists. Moins de recherche, plus d'execution.", "Each department keeps SOPs, circulars, job sheets and checklists here. Less searching, more execution.", "Cada departamento guarda aqui SOP, circulares, fichas de puesto y listas. Menos busqueda, mas ejecucion.", "Ogni reparto conserva qui SOP, circolari, schede mansione e checklist. Meno ricerca, piu esecuzione.", "Kazdy dzial przechowuje tu SOP, okólniki, opisy stanowisk i listy kontrolne. Mniej szukania, wiecej dzialania."),
  operationalHistory: localized("Historico operacional", "Historique operationnel", "Operational history", "Historial operativo", "Storico operativo", "Historia operacyjna"),
  recentEvents: localized("Eventos recentes", "Evenements recents", "Recent events", "Eventos recientes", "Eventi recenti", "Ostatnie zdarzenia"),
  events: localized("eventos", "evenements", "events", "eventos", "eventi", "zdarzen"),
  noEvents: localized("Sem eventos ainda. Crie um alerta ou teste a demo.", "Aucun evenement pour le moment. Creez une alerte ou testez la demo.", "No events yet. Create an alert or test the demo.", "Aun no hay eventos. Cree una alerta o pruebe la demo.", "Nessun evento. Crea un avviso o prova la demo.", "Brak zdarzen. Utworz alert lub przetestuj demo."),
  ownDomain: localized("Dominio proprio", "Domaine personnalise", "Custom domain", "Dominio propio", "Dominio personalizzato", "Wlasna domena"),
  brandReady: localized("Preparado para a marca TKC", "Pret pour la marque TKC", "Ready for the TKC brand", "Preparado para la marca TKC", "Pronto per il marchio TKC", "Gotowe dla marki TKC"),
  data: localized("Dados", "Donnees", "Data", "Datos", "Dati", "Dane"),
  invites: localized("Convites", "Invitations", "Invitations", "Invitaciones", "Inviti", "Zaproszenia"),
  dataValue: localized("Supabase com RLS por departamento", "Supabase avec RLS par departement", "Supabase with department RLS", "Supabase con RLS por departamento", "Supabase con RLS per reparto", "Supabase z RLS wedlug dzialu"),
  invitesValue: localized("Email e primeiro acesso protegido", "E-mail et premier acces protege", "Email and protected first access", "Email y primer acceso protegido", "Email e primo accesso protetto", "Email i chroniony pierwszy dostep"),
  officialSystemCopy: localized("A app e o sistema operacional oficial. Tarefas, mensagens, documentos e quartos deixam de depender de ferramentas externas.", "L'app est le systeme operationnel officiel. Les taches, messages, documents et chambres ne dependent plus d'outils externes.", "The app is the official operating system. Tasks, messages, documents and rooms no longer depend on external tools.", "La app es el sistema operativo oficial. Tareas, mensajes, documentos y habitaciones ya no dependen de herramientas externas.", "L'app e il sistema operativo ufficiale. Attivita, messaggi, documenti e camere non dipendono piu da strumenti esterni.", "Aplikacja jest oficjalnym systemem operacyjnym. Zadania, wiadomosci, dokumenty i pokoje nie zaleza juz od zewnetrznych narzedzi."),
  accesses: localized("Acessos", "Acces", "Access", "Accesos", "Accessi", "Dostepy"),
  operatorProfiles: localized("Perfis de operadores", "Profils des operateurs", "Operator profiles", "Perfiles de operadores", "Profili operatori", "Profile operatorow"),
  profiles: localized("perfis", "profils", "profiles", "perfiles", "profili", "profili"),
  name: localized("Nome", "Nom", "Name", "Nombre", "Nome", "Imie"),
  role: localized("Papel", "Role", "Role", "Rol", "Ruolo", "Rola"),
  authorizedDepartments: localized("Departamentos autorizados", "Departements autorises", "Authorized departments", "Departamentos autorizados", "Reparti autorizzati", "Autoryzowane dzialy"),
  createProfileBeforeLogin: localized("Criar perfil antes do login", "Creer le profil avant la connexion", "Create profile before login", "Crear perfil antes de iniciar sesion", "Crea profilo prima dell'accesso", "Utworz profil przed logowaniem"),
  noOperators: localized("Nenhum operador criado. A direcao define os departamentos antes do primeiro acesso.", "Aucun operateur cree. La direction definit les departements avant le premier acces.", "No operator created. Management assigns departments before first access.", "Ningun operador creado. La direccion define los departamentos antes del primer acceso.", "Nessun operatore creato. La direzione assegna i reparti prima del primo accesso.", "Nie utworzono operatora. Dyrekcja przydziela dzialy przed pierwszym dostepem."),
  resendInvite: localized("Reenviar convite", "Renvoyer l'invitation", "Resend invitation", "Reenviar invitacion", "Reinvia invito", "Wyslij zaproszenie ponownie"),
  accessInfo: localized("Info acesso", "Info acces", "Access info", "Info acceso", "Info accesso", "Informacje o dostepie"),
  accountConfirmed: localized("Conta confirmada", "Compte confirme", "Account confirmed", "Cuenta confirmada", "Account confermato", "Konto potwierdzone"),
  accountCreated: localized("Conta criada", "Compte cree", "Account created", "Cuenta creada", "Account creato", "Konto utworzone"),
  firstLogin: localized("Primeiro login", "Premier acces", "First login", "Primer acceso", "Primo accesso", "Pierwszy dostep"),
  correctFlow: localized("Fluxo correto", "Parcours correct", "Correct flow", "Flujo correcto", "Percorso corretto", "Prawidlowy proces"),
  flowProfile: localized("A direcao cria o perfil e atribui os departamentos.", "La direction cree le profil et attribue les departements.", "Management creates the profile and assigns departments.", "La direccion crea el perfil y asigna los departamentos.", "La direzione crea il profilo e assegna i reparti.", "Dyrekcja tworzy profil i przydziela dzialy."),
  flowInvite: localized("O operador recebe o convite por email.", "L'operateur recoit l'invitation par e-mail.", "The operator receives the invitation by email.", "El operador recibe la invitacion por email.", "L'operatore riceve l'invito via email.", "Operator otrzymuje zaproszenie e-mailem."),
  flowPassword: localized("O operador cria a palavra-passe.", "L'operateur cree son mot de passe.", "The operator creates a password.", "El operador crea la contrasena.", "L'operatore crea la password.", "Operator tworzy haslo."),
  flowDetails: localized("O operador completa os dados autorizados.", "L'operateur complete les donnees autorisees.", "The operator completes the authorized information.", "El operador completa los datos autorizados.", "L'operatore completa i dati autorizzati.", "Operator uzupelnia dozwolone dane."),
  flowOpen: localized("A app abre apenas os departamentos permitidos.", "L'app ouvre uniquement les departements autorises.", "The app opens only authorized departments.", "La app abre solo los departamentos permitidos.", "L'app apre solo i reparti autorizzati.", "Aplikacja otwiera tylko dozwolone dzialy."),
  departmentChat: localized("Chat por departamento", "Chat par departement", "Department chat", "Chat por departamento", "Chat per reparto", "Czat dzialu"),
  accessApproved: localized("Acesso aprovado pela direcao", "Acces approuve par la direction", "Access approved by management", "Acceso aprobado por la direccion", "Accesso approvato dalla direzione", "Dostep zatwierdzony przez dyrekcje"),
  operatorsWithAccess: localized("operador(es) com acesso a este departamento", "operateur(s) autorise(s) dans ce departement", "operator(s) with access to this department", "operador(es) con acceso a este departamento", "operatore/i con accesso a questo reparto", "operatorow z dostepem do tego dzialu"),
  noAuthorizedOperator: localized("Sem operador autorizado", "Aucun operateur autorise", "No authorized operator", "Sin operador autorizado", "Nessun operatore autorizzato", "Brak autoryzowanego operatora"),
  departmentMessagePlaceholder: localized("Mensagem para o departamento selecionado...", "Message pour le departement selectionne...", "Message for the selected department...", "Mensaje para el departamento seleccionado...", "Messaggio per il reparto selezionato...", "Wiadomosc do wybranego dzialu..."),
  sendToDepartment: localized("Enviar ao departamento", "Envoyer au departement", "Send to department", "Enviar al departamento", "Invia al reparto", "Wyslij do dzialu"),
  noDepartmentMessages: localized("Sem mensagens neste departamento.", "Aucun message dans ce departement.", "No messages in this department.", "No hay mensajes en este departamento.", "Nessun messaggio in questo reparto.", "Brak wiadomosci w tym dziale."),
  authorization: localized("Autorizacao", "Autorisation", "Authorization", "Autorizacion", "Autorizzazione", "Autoryzacja"),
  noOpenChannel: localized("Sem canal aberto", "Aucun canal ouvert", "No open channel", "Sin canal abierto", "Nessun canale aperto", "Brak otwartego kanalu"),
  authorizationCopy: localized("O operador ve apenas o chat dos departamentos atribuidos pela direcao. Em producao, a regra e protegida por RLS no Supabase.", "L'operateur voit uniquement le chat des departements attribues par la direction. En production, cette regle est protegee par RLS dans Supabase.", "The operator sees only chats for departments assigned by management. In production, this rule is protected by Supabase RLS.", "El operador solo ve el chat de los departamentos asignados por la direccion. En produccion, la regla esta protegida por RLS en Supabase.", "L'operatore vede solo le chat dei reparti assegnati dalla direzione. In produzione, la regola e protetta da RLS in Supabase.", "Operator widzi tylko czaty dzialow przydzielonych przez dyrekcje. W produkcji zasada jest chroniona przez RLS w Supabase."),
  generalChat: localized("Chat geral", "Chat general", "General chat", "Chat general", "Chat generale", "Czat ogolny"),
  ideasDecisions: localized("Ideias e decisoes", "Idees et decisions", "Ideas and decisions", "Ideas y decisiones", "Idee e decisioni", "Pomysly i decyzje"),
  messages: localized("mensagens", "messages", "messages", "mensajes", "messaggi", "wiadomosci"),
  ideaPlaceholder: localized("Trocar ideia, registar decisao, nota de direcao...", "Partager une idee, enregistrer une decision, note de direction...", "Share an idea, record a decision, management note...", "Compartir idea, registrar decision, nota de direccion...", "Condividi un'idea, registra una decisione, nota della direzione...", "Podziel sie pomyslem, zapisz decyzje, notatke dyrekcji..."),
  add: localized("Adicionar", "Ajouter", "Add", "Agregar", "Aggiungi", "Dodaj"),
  noGeneralMessages: localized("Sem mensagens. Use este espaco para ideias, decisoes e notas gerais.", "Aucun message. Utilisez cet espace pour les idees, decisions et notes generales.", "No messages. Use this space for ideas, decisions and general notes.", "Sin mensajes. Use este espacio para ideas, decisiones y notas generales.", "Nessun messaggio. Usa questo spazio per idee, decisioni e note generali.", "Brak wiadomosci. Uzyj tego miejsca na pomysly, decyzje i notatki ogolne."),
  internalChat: localized("Chat interno", "Chat interne", "Internal chat", "Chat interno", "Chat interna", "Czat wewnetrzny"),
  autonomousApp: localized("App autonoma", "App autonome", "Standalone app", "App autonoma", "App autonoma", "Samodzielna aplikacja"),
  internalChatCopy: localized("Tarefas, comentarios, ideias e conversas ficam na app TKC, com acesso definido pela direcao.", "Les taches, commentaires, idees et conversations restent dans l'app TKC, avec un acces defini par la direction.", "Tasks, comments, ideas and conversations stay in the TKC app, with access set by management.", "Tareas, comentarios, ideas y conversaciones quedan en la app TKC, con acceso definido por la direccion.", "Attivita, commenti, idee e conversazioni restano nell'app TKC, con accesso definito dalla direzione.", "Zadania, komentarze, pomysly i rozmowy pozostaja w aplikacji TKC, z dostepem ustalonym przez dyrekcje."),
  accessInformation: localized("Informacao de acesso", "Informations d'acces", "Access information", "Informacion de acceso", "Informazioni di accesso", "Informacje o dostepie"),
  operatorAccess: localized("Acesso operador", "Acces operateur", "Operator access", "Acceso operador", "Accesso operatore", "Dostep operatora"),
  close: localized("Fechar", "Fermer", "Close", "Cerrar", "Chiudi", "Zamknij"),
  account: localized("Conta", "Compte", "Account", "Cuenta", "Account", "Konto"),
  invitations: localized("Convites", "Invitations", "Invitations", "Invitaciones", "Inviti", "Zaproszenia"),
  lastInvite: localized("Ultimo convite", "Derniere invitation", "Last invitation", "Ultima invitacion", "Ultimo invito", "Ostatnie zaproszenie"),
  accountCreatedOn: localized("Conta criada em", "Compte cree le", "Account created on", "Cuenta creada el", "Account creato il", "Konto utworzone"),
  notSentYet: localized("Ainda nao enviado", "Pas encore envoye", "Not sent yet", "Aun no enviado", "Non ancora inviato", "Jeszcze nie wyslano"),
  pendingStatus: localized("Pendente", "En attente", "Pending", "Pendiente", "In attesa", "Oczekuje"),
  accessModalCopy: localized("Se a conta ja existir, reenviar o convite serve para repor o acesso ou concluir o primeiro login, sem criar uma segunda conta.", "Si le compte existe deja, renvoyer l'invitation sert a retablir l'acces ou terminer le premier acces, sans creer un second compte.", "If the account already exists, resending the invitation restores access or completes first login without creating a second account.", "Si la cuenta ya existe, reenviar la invitacion restablece el acceso o completa el primer inicio sin crear otra cuenta.", "Se l'account esiste gia, reinviare l'invito ripristina l'accesso o completa il primo accesso senza creare un secondo account.", "Jesli konto juz istnieje, ponowne wyslanie zaproszenia przywraca dostep lub konczy pierwsze logowanie bez tworzenia drugiego konta."),
  markAccountCreated: localized("Marcar conta criada", "Marquer le compte comme cree", "Mark account created", "Marcar cuenta creada", "Segna account creato", "Oznacz konto jako utworzone"),
  returnLogin: localized("Voltar ao login", "Retour a la connexion", "Back to login", "Volver al acceso", "Torna all'accesso", "Wroc do logowania"),
  taskState: localized("Estado da tarefa", "Etat de la tache", "Task status", "Estado de la tarea", "Stato attivita", "Status zadania"),
  photoType: localized("Tipo de foto", "Type de photo", "Photo type", "Tipo de foto", "Tipo di foto", "Typ zdjecia"),
  addComment: localized("Adicionar comentario", "Ajouter un commentaire", "Add comment", "Agregar comentario", "Aggiungi commento", "Dodaj komentarz"),
  ready: localized("Pronto", "Pret", "Ready", "Listo", "Pronto", "Gotowe"),
  syncing: localized("A sincronizar", "Synchronisation", "Syncing", "Sincronizando", "Sincronizzazione", "Synchronizacja"),
  syncedSupabase: localized("Sincronizado com Supabase", "Synchronise avec Supabase", "Synced with Supabase", "Sincronizado con Supabase", "Sincronizzato con Supabase", "Zsynchronizowano z Supabase"),
  syncError: localized("Erro de sincronizacao", "Erreur de synchronisation", "Sync error", "Error de sincronizacion", "Errore di sincronizzazione", "Blad synchronizacji"),
  savingTask: localized("A guardar tarefa", "Enregistrement de la tache", "Saving task", "Guardando tarea", "Salvataggio attivita", "Zapisywanie zadania"),
  saveTaskError: localized("Erro ao guardar tarefa", "Erreur d'enregistrement de la tache", "Error saving task", "Error al guardar tarea", "Errore nel salvare l'attivita", "Blad zapisu zadania"),
  savedApp: localized("Guardado na app", "Enregistre dans l'app", "Saved in app", "Guardado en la app", "Salvato nell'app", "Zapisano w aplikacji"),
  exampleLoaded: localized("Exemplo carregado", "Exemple charge", "Example loaded", "Ejemplo cargado", "Esempio caricato", "Przyklad wczytany"),
  sendingPhoto: localized("A enviar foto", "Envoi de la photo", "Sending photo", "Enviando foto", "Invio foto", "Wysylanie zdjecia"),
  sendPhotoError: localized("Erro ao enviar foto", "Erreur d'envoi de la photo", "Error sending photo", "Error al enviar foto", "Errore invio foto", "Blad wysylania zdjecia"),
  sendingDocument: localized("A enviar documento", "Envoi du document", "Sending document", "Enviando documento", "Invio documento", "Wysylanie dokumentu"),
  sendDocumentError: localized("Erro ao enviar documento", "Erreur d'envoi du document", "Error sending document", "Error al enviar documento", "Errore invio documento", "Blad wysylania dokumentu"),
  productionStructureProtected: localized("A estrutura de producao nao e apagada pela app", "La structure de production n'est pas supprimee par l'app", "The production structure is not deleted by the app", "La estructura de produccion no se elimina desde la app", "La struttura di produzione non viene eliminata dall'app", "Struktura produkcyjna nie jest usuwana przez aplikacje"),
  generatingTasks: localized("A gerar tarefas Housekeeping", "Generation des taches Housekeeping", "Generating Housekeeping tasks", "Generando tareas Housekeeping", "Generazione attivita Housekeeping", "Generowanie zadan Housekeeping"),
  generateTasksError: localized("Erro ao gerar tarefas", "Erreur de generation des taches", "Error generating tasks", "Error al generar tareas", "Errore nella generazione delle attivita", "Blad generowania zadan"),
  sendingInvite: localized("A enviar convite", "Envoi de l'invitation", "Sending invitation", "Enviando invitacion", "Invio invito", "Wysylanie zaproszenia"),
  resendingInvite: localized("A reenviar convite", "Renvoi de l'invitation", "Resending invitation", "Reenviando invitacion", "Reinvio invito", "Ponowne wysylanie zaproszenia"),
  inviteSent: localized("Convite enviado", "Invitation envoyee", "Invitation sent", "Invitacion enviada", "Invito inviato", "Zaproszenie wyslane"),
  invitePrepared: localized("Convite preparado", "Invitation preparee", "Invitation prepared", "Invitacion preparada", "Invito preparato", "Zaproszenie przygotowane"),
  inviteError: localized("Erro no convite", "Erreur d'invitation", "Invitation error", "Error de invitacion", "Errore invito", "Blad zaproszenia"),
  accountActive: localized("Conta ja ativa", "Compte deja actif", "Account already active", "Cuenta ya activa", "Account gia attivo", "Konto jest juz aktywne"),
  checkingSession: localized("A verificar sessao", "Verification de la session", "Checking session", "Verificando sesion", "Verifica sessione", "Sprawdzanie sesji"),
  connectingSupabase: localized("A ligar a app TKC Capital Ops ao Supabase.", "Connexion de l'app TKC Capital Ops a Supabase.", "Connecting the TKC Capital Ops app to Supabase.", "Conectando la app TKC Capital Ops a Supabase.", "Connessione dell'app TKC Capital Ops a Supabase.", "Laczenie aplikacji TKC Capital Ops z Supabase."),
  profileNoAccess: localized("Perfil sem acesso ativo", "Profil sans acces actif", "Profile without active access", "Perfil sin acceso activo", "Profilo senza accesso attivo", "Profil bez aktywnego dostepu"),
  profileMissing: localized("Perfil operacional em falta", "Profil operationnel manquant", "Operational profile missing", "Falta perfil operativo", "Profilo operativo mancante", "Brak profilu operacyjnego"),
  contactManagement: localized("Contacte a direcao para ativar o seu perfil operacional.", "Contactez la direction pour activer votre profil operationnel.", "Contact management to activate your operational profile.", "Contacte con la direccion para activar su perfil operativo.", "Contatta la direzione per attivare il profilo operativo.", "Skontaktuj sie z dyrekcja, aby aktywowac profil operacyjny."),
  oldSiteValue: localized("TKC Rooms legado", "TKC Rooms (ancien)", "Legacy TKC Rooms", "TKC Rooms anterior", "TKC Rooms precedente", "Poprzedni TKC Rooms"),
  assignedToday: localized("Atribuidos hoje", "Affectes aujourd'hui", "Assigned today", "Asignados hoy", "Assegnati oggi", "Przydzieleni dzisiaj"),
  assignmentDate: localized("Atribuicao do dia", "Affectation du jour", "Daily assignment", "Asignacion del dia", "Assegnazione del giorno", "Dzisiejszy przydzial"),
  noAssignedOperator: localized("Sem operador atribuido", "Aucun operateur affecte", "No assigned operator", "Sin operador asignado", "Nessun operatore assegnato", "Brak przypisanego operatora"),
  noActiveRoomOperators: localized("Crie e ative primeiro os operadores do departamento Housekeeping.", "Creez et activez d'abord les operateurs du service Etages.", "Create and activate Housekeeping operators first.", "Cree y active primero los operadores de Pisos.", "Crea e attiva prima gli operatori Camere.", "Najpierw utworz i aktywuj operatorow dzialu Pokoje."),
  dailyAccessNotice: localized("Os operadores veem apenas os quartos dos binomes que lhes forem atribuidos hoje, bem como as tarefas e avarias desses quartos.", "Les operateurs voient uniquement les chambres des binomes qui leur sont affectes aujourd'hui, ainsi que les taches et pannes de ces chambres.", "Operators only see rooms in teams assigned to them today, plus tasks and faults for those rooms.", "Los operadores solo ven las habitaciones de los equipos asignados hoy, junto con sus tareas y averias.", "Gli operatori vedono solo le camere dei gruppi assegnati oggi, con le relative attivita e guasti.", "Operatorzy widza tylko pokoje w zespolach przydzielonych im dzisiaj oraz ich zadania i usterki."),
  savingAssignments: localized("A guardar atribuicoes", "Enregistrement des affectations", "Saving assignments", "Guardando asignaciones", "Salvataggio assegnazioni", "Zapisywanie przydzialow"),
  assignmentSaved: localized("Atribuicoes guardadas", "Affectations enregistrees", "Assignments saved", "Asignaciones guardadas", "Assegnazioni salvate", "Przydzialy zapisane"),
  assignmentError: localized("Erro ao guardar atribuicoes", "Erreur d'enregistrement des affectations", "Error saving assignments", "Error al guardar asignaciones", "Errore nel salvataggio delle assegnazioni", "Blad zapisu przydzialow"),
  assignedRoomsOnly: localized("Apenas os quartos que lhe foram atribuidos hoje.", "Uniquement les chambres qui vous sont affectees aujourd'hui.", "Only rooms assigned to you today.", "Solo las habitaciones que le han sido asignadas hoy.", "Solo le camere assegnate oggi.", "Tylko pokoje przydzielone dzisiaj."),
  selectAssignedRoom: localized("Selecionar quarto atribuido", "Selectionner une chambre affectee", "Select assigned room", "Seleccionar habitacion asignada", "Seleziona camera assegnata", "Wybierz przypisany pokoj"),
  accountPending: localized("Acesso pendente", "Acces en attente", "Access pending", "Acceso pendiente", "Accesso in attesa", "Dostep oczekuje"),
  invitePending: localized("Primeiro login pendente", "Premier acces en attente", "First login pending", "Primer acceso pendiente", "Primo accesso in attesa", "Pierwszy dostep oczekuje"),
  profileMissingDetail: localized("A conta existe, mas ainda nao tem um perfil operacional TKC.", "Le compte existe, mais aucun profil operationnel TKC ne lui est encore associe.", "The account exists, but it does not yet have a TKC operational profile.", "La cuenta existe, pero aun no tiene un perfil operativo TKC.", "L'account esiste, ma non ha ancora un profilo operativo TKC.", "Konto istnieje, ale nie ma jeszcze profilu operacyjnego TKC."),
  profileBlockedDetail: localized("Este perfil ainda nao esta ativo. Contacte a direcao.", "Ce profil n'est pas encore actif. Contactez la direction.", "This profile is not active yet. Contact management.", "Este perfil aun no esta activo. Contacte con la direccion.", "Questo profilo non e ancora attivo. Contatta la direzione.", "Ten profil nie jest jeszcze aktywny. Skontaktuj sie z dyrekcja."),
  taskUpdateError: localized("Erro ao atualizar tarefa", "Erreur de mise a jour de la tache", "Error updating task", "Error al actualizar la tarea", "Errore nell'aggiornamento dell'attivita", "Blad aktualizacji zadania"),
  commentSaveError: localized("Erro ao guardar comentario", "Erreur d'enregistrement du commentaire", "Error saving comment", "Error al guardar el comentario", "Errore nel salvataggio del commento", "Blad zapisu komentarza"),
  messageSendError: localized("Erro ao enviar mensagem", "Erreur d'envoi du message", "Error sending message", "Error al enviar el mensaje", "Errore nell'invio del messaggio", "Blad wysylania wiadomosci"),
  roomUpdateError: localized("Erro ao atualizar quarto", "Erreur de mise a jour de la chambre", "Error updating room", "Error al actualizar la habitacion", "Errore nell'aggiornamento della camera", "Blad aktualizacji pokoju"),
  demoNote: localized("Demo: a TV nao funciona. Enviar um tecnico quando possivel.", "Demo : la TV ne fonctionne pas. Envoyer un technicien des que possible.", "Demo: the TV is not working. Send a technician when possible.", "Demo: la TV no funciona. Enviar un tecnico cuando sea posible.", "Demo: la TV non funziona. Inviare un tecnico appena possibile.", "Demo: telewizor nie dziala. Wyslac technika, gdy bedzie to mozliwe."),
  demoComment: localized("Controlo da rececao: avisar o cliente se o quarto ficar bloqueado.", "Controle reception : prevenir le client si la chambre reste bloquee.", "Reception check: notify the guest if the room remains blocked.", "Control de recepcion: avisar al cliente si la habitacion queda bloqueada.", "Controllo reception: avvisare il cliente se la camera resta bloccata.", "Kontrola recepcji: powiadomic goscia, jesli pokoj pozostanie zablokowany."),
  fileStoredSupabase: localized("O ficheiro sera guardado no Supabase Storage.", "Le fichier sera enregistre dans Supabase Storage.", "The file will be stored in Supabase Storage.", "El archivo se guardara en Supabase Storage.", "Il file verra salvato in Supabase Storage.", "Plik zostanie zapisany w Supabase Storage."),
  largeFilePreview: localized("Ficheiro grande: apenas metadados na pre-visualizacao.", "Fichier volumineux : metadonnees uniquement dans l'apercu.", "Large file: metadata only in preview.", "Archivo grande: solo metadatos en la vista previa.", "File grande: solo metadati nell'anteprima.", "Duzy plik: tylko metadane w podgladzie."),
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

const initialDepartmentTaskForm = {
  department: "reception",
  title: "",
  description: "",
  priority: "normal"
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
  department_task: { pt: "Tarefa de departamento", fr: "Tâche départementale", en: "Department task", es: "Tarea de departamento", it: "Attività di reparto", pl: "Zadanie działowe" },
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

function todayInParis() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function buildHousekeepingPlan() {
  return {
    source: "tkc_rooms_integrated",
    legacyUrl: TKC_ROOMS_LEGACY_URL,
    date: "",
    assignmentDate: todayInParis(),
    binomes: [
      {
        id: "binome_a",
        label: "Binome A",
        zone: "Etage 1",
        members: [],
        rooms: buildFloorRooms(1, 18)
      },
      {
        id: "binome_b",
        label: "Binome B",
        zone: "Etage 2",
        members: [],
        rooms: buildFloorRooms(2, 18)
      },
      {
        id: "binome_c",
        label: "Binome C",
        zone: "Etage 3",
        members: [],
        rooms: buildFloorRooms(3, 18)
      },
      {
        id: "binome_d",
        label: "Binome D",
        zone: "Etage 4",
        members: [],
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
  const [departmentTaskForm, setDepartmentTaskForm] = useState(initialDepartmentTaskForm);
  const [departmentTaskFilter, setDepartmentTaskFilter] = useState("all");
  const [operatorForm, setOperatorForm] = useState(initialOperatorForm);
  const [departmentChats, setDepartmentChats] = useState({});
  const [departmentDocs, setDepartmentDocs] = useState({});
  const [activeChatDepartment, setActiveChatDepartment] = useState("housekeeping");
  const [chatDraft, setChatDraft] = useState("");
  const [docForm, setDocForm] = useState(initialDocForm);
  const [accessOperatorId, setAccessOperatorId] = useState(null);
  const [ideaText, setIdeaText] = useState("");
  const [syncState, setSyncState] = useState("ready");
  const [inviteState, setInviteState] = useState("ready");
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

    if (!silent) setSyncState("syncing");
    try {
      const workspace = await loadHotelWorkspace(supabase, authUserId);
      if (!workspace.profile) {
        setCurrentProfile(null);
        setAuthMode("profile_missing");
        setWorkspaceError("profileMissingDetail");
        return null;
      }
      if (workspace.profile.status !== "active" || workspace.profile.account_status !== "active") {
        setCurrentProfile(workspace.profile);
        setAuthMode("blocked");
        setWorkspaceError("profileBlockedDetail");
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
      setSyncState("syncedSupabase");
      return workspace;
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "syncError");
      setSyncState("syncError");
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
  const isRoomOperator = Boolean(currentProfile?.isRoomOperator);
  const availableDepartments = currentProfile && !currentProfile.isDirection
    ? DEPARTMENT_OPTIONS.filter((department) => currentProfile.departments.includes(department.id))
    : DEPARTMENT_OPTIONS;
  const taskDepartments = isRoomOperator
    ? DEPARTMENT_OPTIONS.filter((department) => ["housekeeping", "maintenance"].includes(department.id))
    : availableDepartments;
  const taskEventTypes = isRoomOperator
    ? ["room_cleaning", "room_ready", "room_blocked", "maintenance_created"]
    : Object.keys(EVENT_LABEL_TRANSLATIONS).filter((eventType) => eventType !== "department_task");
  const canUseHousekeeping = isDirection || availableDepartments.some((department) => department.id === "housekeeping");
  const docsForDepartment = departmentDocs[docForm.department] || [];
  const housekeepingStats = getHousekeepingStats(housekeepingPlan);
  const t = (key) => translate(activeLanguage, key);
  const assignedRooms = housekeepingPlan.binomes.flatMap((binome) => binome.rooms);
  const roomOperators = operators.filter((operator) =>
    operator.status === "active" &&
    operator.accountStatus === "active" &&
    ["operator", "supervisor"].includes(operator.role) &&
    (operator.departments || []).includes("housekeeping")
  );
  const departmentTasks = events.filter((event) => event.eventType === "department_task");
  const operationalEvents = events.filter((event) => event.eventType !== "department_task");
  const filteredDepartmentTasks = departmentTaskFilter === "all"
    ? departmentTasks
    : departmentTasks.filter((event) => event.department === departmentTaskFilter);

  if (authMode === "checking") {
    return <AccessState title={t("checkingSession")} message={t("connectingSupabase")} returnLabel={t("returnLogin")} />;
  }

  if (authMode === "profile_missing" || authMode === "blocked") {
    return (
      <AccessState
        title={authMode === "blocked" ? t("profileNoAccess") : t("profileMissing")}
        message={workspaceError ? t(workspaceError) : t("contactManagement")}
        returnLabel={t("returnLogin")}
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
    if (isRoomOperator && !assignedRooms.some((room) => room.room === payload.room)) {
      setWorkspaceError("assignedRoomsOnly");
      return;
    }

    if (isProduction && supabaseRef.current && currentProfile?.id) {
      setSyncState("savingTask");
      try {
        await createTask(supabaseRef.current, payload, currentProfile.id);
        await refreshWorkspace();
        setForm({ ...initialForm, department: payload.department });
      } catch (error) {
        setSyncState("saveTaskError");
        setWorkspaceError(error instanceof Error ? error.message : "saveTaskError");
      }
      return;
    }

    addEvent(payload);
    setForm({ ...initialForm, department: payload.department });
    setSyncState("savedApp");
  }

  function handleDepartmentTaskChange(event) {
    const { name, value } = event.target;
    setDepartmentTaskForm((current) => ({ ...current, [name]: value }));
  }

  async function submitDepartmentTask(event) {
    event.preventDefault();
    if (!isDirection) return;

    const title = departmentTaskForm.title.trim();
    const description = departmentTaskForm.description.trim();
    if (!title || !description) return;

    const payload = {
      id: crypto.randomUUID(),
      department: departmentTaskForm.department,
      eventType: "department_task",
      room: "",
      priority: departmentTaskForm.priority,
      status: "open",
      title,
      note: description,
      metadata: { title, kind: "department_task" },
      comments: [],
      createdAt: new Date().toISOString()
    };

    if (isProduction && supabaseRef.current && currentProfile?.id) {
      setSyncState("savingDepartmentTask");
      try {
        await createTask(supabaseRef.current, payload, currentProfile.id);
        await refreshWorkspace();
        setDepartmentTaskForm((current) => ({ ...initialDepartmentTaskForm, department: current.department }));
        setSyncState("departmentTaskSaved");
        setWorkspaceError("");
      } catch (error) {
        setSyncState("departmentTaskError");
        setWorkspaceError(error instanceof Error ? error.message : "departmentTaskError");
      }
      return;
    }

    addEvent(payload);
    setDepartmentTaskForm((current) => ({ ...initialDepartmentTaskForm, department: current.department }));
    setSyncState("departmentTaskSaved");
  }

  function addEvent(payload) {
    setEvents((current) => [payload, ...current].slice(0, 50));
  }

  function handleChange(event) {
    const { id, value } = event.target;
    setForm((current) => {
      if (isRoomOperator && id === "department") {
        return {
          ...current,
          department: value,
          eventType: value === "maintenance" ? "maintenance_created" : "room_cleaning",
        };
      }
      return { ...current, [id]: value };
    });
  }

  async function changeLanguage(language) {
    setUiLanguage(language);
    if (isProduction && supabaseRef.current && currentProfile?.id) {
      try {
        await updateOperatorLanguage(supabaseRef.current, currentProfile.id, language);
        setCurrentProfile((profile) => profile ? { ...profile, language } : profile);
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "syncError");
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
      note: t("demoNote"),
      status: "open",
      comments: [
        {
          id: crypto.randomUUID(),
          text: t("demoComment"),
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    });
    setSyncState("exampleLoaded");
  }

  function resetDemo() {
    setEvents([]);
    setSyncState("ready");
  }

  async function updateTaskStatus(id, status) {
    if (isProduction && supabaseRef.current) {
      try {
        await updateTask(supabaseRef.current, id, { status });
        await refreshWorkspace({ silent: true });
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "taskUpdateError");
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
        setWorkspaceError(error instanceof Error ? error.message : "commentSaveError");
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
    setInviteState(mode === "resend" ? "resendingInvite" : "sendingInvite");
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
      setInviteState(inviteStatus === "sent" ? "inviteSent" : inviteStatus === "dry_run" ? "invitePrepared" : "inviteError");
      if (response.status === 409 && result.error === "account_already_active") {
        setInviteState("accountActive");
      }
      if (response.ok && isProduction) await refreshWorkspace({ silent: true });
    } catch {
      setOperators((current) =>
        current.map((item) =>
          item.id === operator.id ? { ...item, inviteStatus: "error" } : item
        )
      );
      setInviteState("inviteError");
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
        setWorkspaceError(error instanceof Error ? error.message : "messageSendError");
      }
      return;
    }

    const message = {
      id: crypto.randomUUID(),
      department: activeChatDepartment,
      author: departmentLabel("direction", activeLanguage),
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
        setSyncState("sendingPhoto");
        await uploadTaskPhoto(
          supabaseRef.current,
          task,
          attachment.file,
          attachment.reason,
          currentProfile.id
        );
        await refreshWorkspace();
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "sendPhotoError");
        setSyncState("sendPhotoError");
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
        storageNote: isProduction ? t("fileStoredSupabase") : t("largeFilePreview")
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
        setSyncState("sendingDocument");
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
        setWorkspaceError(error instanceof Error ? error.message : "sendDocumentError");
        setSyncState("sendDocumentError");
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
        setWorkspaceError(error instanceof Error ? error.message : "roomUpdateError");
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

  async function updateBinomeAssignments(binomeId, operatorIds) {
    if (!isDirection || !isProduction || !supabaseRef.current) return;
    try {
      setSyncState("savingAssignments");
      await setHousekeepingBinomeAssignments(
        supabaseRef.current,
        binomeId,
        housekeepingPlan.assignmentDate,
        operatorIds
      );
      await refreshWorkspace({ silent: true });
      setSyncState("assignmentSaved");
      setWorkspaceError("");
    } catch (error) {
      setSyncState("assignmentError");
      setWorkspaceError(error instanceof Error ? error.message : "assignmentError");
    }
  }

  function resetHousekeepingPlan() {
    if (isProduction) {
      setSyncState("productionStructureProtected");
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
        setSyncState("generatingTasks");
        await createTasks(supabaseRef.current, tasks, currentProfile.id);
        await refreshWorkspace();
      } catch (error) {
        setWorkspaceError(error instanceof Error ? error.message : "generateTasksError");
        setSyncState("generateTasksError");
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
            {!activeOperator && authMode === "preview" && <small>{t("previewLocal")}</small>}
          </div>
          <div className="domain-pill" title={t("targetDomain")}>
            <span>{t("domain")}</span>
            <strong>{domainLabel}</strong>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className="property-brand-strip" aria-label={t("propertyHotel")}>
          <div className="ibis-logo-frame">
            {/* Official ibis wordmark is served from Accor's brand asset host. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="ibis" height="96" src={IBIS_LOGO_URL} width="180" />
          </div>
          <div className="property-brand-copy">
            <p className="eyebrow">{t("propertyHotel")}</p>
            <h2>ibis Nogent-sur-Marne</h2>
            <p>{t("propertyReminder")}</p>
          </div>
          <span className="property-internal-badge">{t("propertyInternal")}</span>
        </section>

        <section className="hero-band">
          <div className="hero-copy">
            <p className="eyebrow">{t("heroEyebrow")}</p>
            <h2>{t("heroTitle")}</h2>
            <p>{t("heroCopy")}</p>
          </div>
          <div className="status-grid" aria-label={t("operationalSummary")}>
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
              <small>{t(syncState)}</small>
            </article>
          </div>
        </section>

        {workspaceError && <div className="sync-error">{t(workspaceError)}</div>}

        <section className="workspace-grid bottom department-task-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("departmentTasksEyebrow")}</p>
                <h2>{t("departmentTasksTitle")}</h2>
              </div>
              <label className="compact-label">
                <span>{t("departmentTaskFilter")}</span>
                <select value={departmentTaskFilter} onChange={(event) => setDepartmentTaskFilter(event.target.value)}>
                  <option value="all">{t("allDepartments")}</option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="event-list">
              {filteredDepartmentTasks.length === 0 ? (
                <div className="empty">{t("noDepartmentTasks")}</div>
              ) : (
                filteredDepartmentTasks.map((task) => (
                  <EventItem
                    event={task}
                    key={task.id}
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

          <aside className="panel department-task-creator">
            <p className="eyebrow">{t("departmentTasksEyebrow")}</p>
            <h2>{t("newDepartmentTask")}</h2>
            {isDirection ? (
              <form className="operator-form" onSubmit={submitDepartmentTask}>
                <label>
                  {t("department")}
                  <select name="department" value={departmentTaskForm.department} onChange={handleDepartmentTaskChange} required>
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("taskTitle")}
                  <input
                    maxLength={160}
                    name="title"
                    onChange={handleDepartmentTaskChange}
                    placeholder={t("taskTitlePlaceholder")}
                    required
                    value={departmentTaskForm.title}
                  />
                </label>
                <label>
                  {t("priority")}
                  <select name="priority" value={departmentTaskForm.priority} onChange={handleDepartmentTaskChange} required>
                    <option value="normal">{t("normal")}</option>
                    <option value="urgent">{t("urgent")}</option>
                    <option value="blocked">{t("blocking")}</option>
                  </select>
                </label>
                <label>
                  {t("taskDescription")}
                  <textarea
                    maxLength={4000}
                    name="description"
                    onChange={handleDepartmentTaskChange}
                    placeholder={t("taskDescriptionPlaceholder")}
                    required
                    rows={5}
                    value={departmentTaskForm.description}
                  />
                </label>
                <div className="actions">
                  <button type="submit">{t("createDepartmentTask")}</button>
                </div>
              </form>
            ) : (
              <p className="notice">{t("directionOnlyTaskCreation")}</p>
            )}
          </aside>
        </section>

        {canUseHousekeeping && (
          <HousekeepingBoard
            plan={housekeepingPlan}
            stats={housekeepingStats}
            language={activeLanguage}
            isDirection={isDirection}
            operators={roomOperators}
            onAssignmentsChange={updateBinomeAssignments}
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
                <p className="eyebrow">{t("operationalEvent")}</p>
                <h2>{t("createAlert")}</h2>
              </div>
              {!isProduction && <button className="secondary" onClick={resetDemo} type="button">{t("clearDemo")}</button>}
            </div>

            <form className="event-form" onSubmit={handleSubmit}>
              <label>
                {t("department")}
                <select id="department" value={form.department} onChange={handleChange} required>
                  {taskDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>

              <label>
                {t("eventType")}
                <select id="eventType" value={form.eventType} onChange={handleChange} required>
                  {taskEventTypes.map((eventType) => (
                    <option key={eventType} value={eventType}>{eventLabel(eventType, activeLanguage)}</option>
                  ))}
                </select>
              </label>

              <label>
                {t("roomZone")}
                {isRoomOperator ? (
                  <select id="room" value={form.room} onChange={handleChange} required>
                    <option value="">{t("selectAssignedRoom")}</option>
                    {assignedRooms.map((room) => (
                      <option key={room.id} value={room.room}>{room.room}</option>
                    ))}
                  </select>
                ) : (
                  <input id="room" value={form.room} onChange={handleChange} placeholder="204, lobby, bar..." maxLength={32} />
                )}
              </label>

              <label>
                {t("priority")}
                <select id="priority" value={form.priority} onChange={handleChange} required>
                  <option value="normal">{t("normal")}</option>
                  <option value="urgent">{t("urgent")}</option>
                  <option value="blocked">{t("blocking")}</option>
                </select>
              </label>

              <label className="full">
                {t("operationalNote")}
                <textarea
                  id="note"
                  rows={4}
                  value={form.note}
                  onChange={handleChange}
                  placeholder={t("notePlaceholder")}
                  required
                />
              </label>

              <div className="actions full">
                <button type="submit">{t("saveSendAlert")}</button>
                {!isProduction && <button className="secondary" onClick={runDemo} type="button">{t("loadExample")}</button>}
              </div>
            </form>
          </div>

          <aside className="panel">
            <p className="eyebrow">{t("operationalStructure")}</p>
            <h2>{t("appDepartments")}</h2>
            <div className="channel-list">
              {Object.entries(CHANNELS).map(([department, item]) => (
                <article className="channel" key={department}>
                  <strong><span>{departmentLabel(department, activeLanguage)}</span></strong>
                  <span>{t(item.helpKey)}</span>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("filesByDepartment")}</p>
                <h2>{t("documentSetTitle")}</h2>
              </div>
              <span className="badge">{docsForDepartment.length} {t("files")}</span>
            </div>

            <form className="operator-form" onSubmit={addDepartmentDoc}>
              <label>
                {t("department")}
                <select id="department" value={docForm.department} onChange={handleDocChange}>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
              <label>
                {t("type")}
                <select id="type" value={docForm.type} onChange={handleDocChange}>
                  {DOCUMENT_TYPE_OPTIONS.map((type) => (
                    <option key={type.id} value={type.id}>{documentTypeLabel(type.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
              <label>
                {t("title")}
                <input id="title" value={docForm.title} onChange={handleDocChange} placeholder={t("docTitlePlaceholder")} required />
              </label>
              <label>
                {t("file")}
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleDocFileChange}
                  required
                  type="file"
                />
              </label>
              <label className="full">
                {t("note")}
                <textarea id="note" rows={3} value={docForm.note} onChange={handleDocChange} placeholder={t("docNotePlaceholder")} />
              </label>
              {docForm.fileName && (
                <div className="file-preview full">
                  <span className="badge">{docForm.fileName}</span>
                  <span>{formatFileSize(docForm.fileSize)}</span>
                  {docForm.storageNote && <span>{docForm.storageNote}</span>}
                </div>
              )}
              <div className="actions full">
                <button type="submit">{t("addFile")}</button>
              </div>
            </form>

            <div className="document-list">
              {docsForDepartment.length === 0 ? (
                <div className="empty">{t("noFiles")}</div>
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
                        <a className="button-link" href={document.fileData} rel="noreferrer" target="_blank">{t("openDocument")}</a>
                      ) : (
                        <span className="badge urgent">{t("metadataOnly")}</span>
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
            <p className="eyebrow">{t("documentBase")}</p>
            <h2>{t("documentsTogetherTitle")}</h2>
            <p className="notice">{t("documentsTogetherCopy")}</p>
          </aside>
        </section>

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("operationalHistory")}</p>
                <h2>{t("recentEvents")}</h2>
              </div>
              <span className="badge">{operationalEvents.length} {t("events")}</span>
            </div>

            <div className="event-list">
              {operationalEvents.length === 0 ? (
                <div className="empty">{t("noEvents")}</div>
              ) : (
                operationalEvents.map((event) => (
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
            <p className="eyebrow">{t("ownDomain")}</p>
            <h2>{t("brandReady")}</h2>
            <ul className="setup-list">
              <li><strong>Frontend:</strong> app.tkccapital.pt</li>
              <li><strong>API:</strong> api.tkccapital.pt</li>
              <li><strong>{t("data")}:</strong> {t("dataValue")}</li>
              <li><strong>{t("invites")}:</strong> {t("invitesValue")}</li>
            </ul>
            <p className="notice">
              {t("officialSystemCopy")}
            </p>
          </aside>
        </section>

        {isDirection && (
        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("accesses")}</p>
                <h2>{t("operatorProfiles")}</h2>
              </div>
              <div className="event-meta">
                <span className="badge">{operators.length} {t("profiles")}</span>
                <span className={`badge ${inviteClass(inviteState)}`}>{t(inviteState)}</span>
              </div>
            </div>

            <form className="operator-form" onSubmit={createOperator}>
              <label>
                {t("name")}
                <input id="name" value={operatorForm.name} onChange={handleOperatorChange} placeholder={t("name")} required />
              </label>
              <label>
                Email
                <input id="email" type="email" value={operatorForm.email} onChange={handleOperatorChange} placeholder="operador@email.com" required />
              </label>
              <label>
                {t("role")}
                <select id="role" value={operatorForm.role} onChange={handleOperatorChange}>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.id} value={role.id}>{roleLabel(role.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
              <label>
                {t("language")}
                <select id="language" value={operatorForm.language} onChange={handleOperatorChange}>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.id} value={language.id}>{language.label}</option>
                  ))}
                </select>
              </label>
              <fieldset className="department-fieldset full">
                <legend>{t("authorizedDepartments")}</legend>
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
                <button type="submit">{t("createProfileBeforeLogin")}</button>
              </div>
            </form>

            <div className="operator-list">
              {operators.length === 0 ? (
                <div className="empty">{t("noOperators")}</div>
              ) : (
                operators.map((operator) => (
                  <article className="operator-card" key={operator.id}>
                    <strong>{operator.name}</strong>
                    <span>{operator.email}</span>
                    <div className="event-meta">
                      <span className="badge">{roleLabel(operator.role, activeLanguage)}</span>
                      <span className="badge">{operator.language.toUpperCase()}</span>
                      <span className={`badge ${inviteClass(operator.inviteStatus)}`}>{inviteLabel(operator.inviteStatus, activeLanguage)}</span>
                      <span className={`badge ${operatorAccountClass(operator)}`}>{operatorAccountLabel(operator, activeLanguage)}</span>
                    </div>
                    <div className="operator-departments">
                      {operator.departments.map((department) => (
                        <span className="badge" key={department}>{departmentLabel(department, activeLanguage)}</span>
                      ))}
                    </div>
                    <div className="task-actions">
                      {!isProduction && <button className="secondary" type="button" onClick={() => setActiveOperatorId(operator.id)}>{t("useProfile")}</button>}
                      <button className="secondary" type="button" onClick={() => sendOperatorInvite(operator, "resend")}>{t("resendInvite")}</button>
                      <button className="secondary" type="button" onClick={() => setAccessOperatorId(operator.id)}>{t("accessInfo")}</button>
                      {!isProduction && <button type="button" onClick={() => markAccountCreated(operator.id)}>
                        {operatorAccountStatus(operator) === "active" ? t("accountConfirmed") : t("accountCreated")}
                      </button>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">{t("firstLogin")}</p>
            <h2>{t("correctFlow")}</h2>
            <ol className="setup-list">
              <li>{t("flowProfile")}</li>
              <li>{t("flowInvite")}</li>
              <li>{t("flowPassword")}</li>
              <li>{t("flowDetails")}</li>
              <li>{t("flowOpen")}</li>
            </ol>
          </aside>
        </section>
        )}

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("departmentChat")}</p>
                <h2>{departmentLabel(activeChatDepartment, activeLanguage)}</h2>
              </div>
              <label className="compact-label">
                {t("department")}
                <select value={activeChatDepartment} onChange={(event) => setActiveChatDepartment(event.target.value)}>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>{departmentLabel(department.id, activeLanguage)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="access-strip">
              <strong>{t("accessApproved")}</strong>
              <span>{authorizedChatOperators.length} {t("operatorsWithAccess")}</span>
              <div className="operator-departments">
                {authorizedChatOperators.length === 0 ? (
                  <span className="badge blocked">{t("noAuthorizedOperator")}</span>
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
                placeholder={t("departmentMessagePlaceholder")}
              />
              <button type="submit">{t("sendToDepartment")}</button>
            </form>

            <div className="chat-list">
              {activeChatMessages.length === 0 ? (
                <div className="empty">{t("noDepartmentMessages")}</div>
              ) : (
                activeChatMessages.map((item) => (
                  <article className="chat-message" key={item.id}>
                    <p>{item.text}</p>
                    <small>{item.author} - {formatDateTime(item.createdAt, activeLanguage)}</small>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">{t("authorization")}</p>
            <h2>{t("noOpenChannel")}</h2>
            <p className="notice">{t("authorizationCopy")}</p>
          </aside>
        </section>

        <section className="workspace-grid bottom">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">{t("generalChat")}</p>
                <h2>{t("ideasDecisions")}</h2>
              </div>
              <span className="badge">{ideas.length} {t("messages")}</span>
            </div>

            <form className="chat-form" onSubmit={addIdea}>
              <textarea
                rows={3}
                value={ideaText}
                onChange={(event) => setIdeaText(event.target.value)}
                placeholder={t("ideaPlaceholder")}
              />
              <button type="submit">{t("add")}</button>
            </form>

            <div className="chat-list">
              {ideas.length === 0 ? (
                <div className="empty">{t("noGeneralMessages")}</div>
              ) : (
                ideas.map((item) => (
                  <article className="chat-message" key={item.id}>
                    <p>{item.text}</p>
                    <small>{formatDateTime(item.createdAt, activeLanguage)}</small>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="panel">
            <p className="eyebrow">{t("internalChat")}</p>
            <h2>{t("autonomousApp")}</h2>
            <p className="notice">{t("internalChatCopy")}</p>
          </aside>
        </section>

        {activeAccessOperator && (
          <div className="modal-backdrop" role="presentation" onClick={() => setAccessOperatorId(null)}>
            <section className="modal" role="dialog" aria-modal="true" aria-label={t("accessInformation")} onClick={(event) => event.stopPropagation()}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">{t("operatorAccess")}</p>
                  <h2>{activeAccessOperator.name}</h2>
                </div>
                <button className="secondary" type="button" onClick={() => setAccessOperatorId(null)}>{t("close")}</button>
              </div>
              <div className="access-detail">
                <p><strong>Email:</strong> {activeAccessOperator.email}</p>
                <p><strong>{t("account")}:</strong> {operatorAccountLabel(activeAccessOperator, activeLanguage)}</p>
                <p><strong>{t("invitations")}:</strong> {activeAccessOperator.inviteCount || 0}</p>
                <p><strong>{t("lastInvite")}:</strong> {activeAccessOperator.lastInviteAt ? formatDateTime(activeAccessOperator.lastInviteAt, activeLanguage) : t("notSentYet")}</p>
                <p><strong>{t("accountCreatedOn")}:</strong> {activeAccessOperator.accountCreatedAt ? formatDateTime(activeAccessOperator.accountCreatedAt, activeLanguage) : t("pendingStatus")}</p>
                <div>
                  <strong>{t("authorizedDepartments")}</strong>
                  <div className="operator-departments">
                    {(activeAccessOperator.departments || []).map((department) => (
                      <span className="badge" key={department}>{departmentLabel(department, activeLanguage)}</span>
                    ))}
                  </div>
                </div>
                <p className="notice">{t("accessModalCopy")}</p>
              </div>
              <div className="actions">
                <button className="secondary" type="button" onClick={() => sendOperatorInvite(activeAccessOperator, "resend")}>{t("resendInvite")}</button>
                {!isProduction && <button type="button" onClick={() => markAccountCreated(activeAccessOperator.id)}>{t("markAccountCreated")}</button>}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function HousekeepingBoard({
  language,
  plan,
  stats,
  isDirection,
  operators,
  onAssignmentsChange,
  onCreateTasks,
  onReset,
  onStatusChange,
  t,
}) {
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
          <span>{t("assignmentDate")}: {formatDate(plan.assignmentDate, language)}</span>
          <span>{t("plannedTime")}: {stats.minutes} min / {Math.ceil(stats.minutes / 60)} h</span>
        </div>

        {isDirection && (
          <div className="actions housekeeping-actions">
            <button type="button" onClick={onCreateTasks}>{t("generateTasks")}</button>
            <button className="secondary" type="button" onClick={onReset}>{t("resetRooms")}</button>
          </div>
        )}

        <div className="binome-grid">
          {plan.binomes.map((binome) => (
            <article className="binome-card" key={binome.id}>
              <div className="binome-head">
                <div>
                  <strong>{binome.label}</strong>
                  <span>{binome.zone}</span>
                </div>
                <span className="badge">
                  {binome.members.length > 0 ? binome.members.join(" + ") : t("noAssignedOperator")}
                </span>
              </div>

              {isDirection && (
                <fieldset className="binome-assignment">
                  <legend>{t("assignedToday")}</legend>
                  {operators.length === 0 ? (
                    <p className="notice">{t("noActiveRoomOperators")}</p>
                  ) : (
                    <div className="check-grid">
                      {operators.map((operator) => {
                        const checked = (binome.operatorIds || []).includes(operator.id);
                        return (
                          <label className="check-row" key={operator.id}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onAssignmentsChange(
                                binome.id,
                                checked
                                  ? (binome.operatorIds || []).filter((id) => id !== operator.id)
                                  : [...(binome.operatorIds || []), operator.id]
                              )}
                            />
                            <span>{operator.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              )}

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
          <li><strong>{t("oldSite")}:</strong> {t("oldSiteValue")}</li>
          <li><strong>{t("nextStep")}:</strong> {t("redirectOldLink")}</li>
        </ul>
        <p className="notice">
          {t("dailyAccessNotice")}
        </p>
        <a className="button-link muted-link" href={plan.legacyUrl} rel="noreferrer" target="_blank">{t("viewLegacy")}</a>
      </aside>
    </section>
  );
}

function AccessState({ title, message, returnLabel }) {
  return (
    <div className="hotel-ops">
      <main className="shell access-state">
        <section className="panel">
          <p className="eyebrow">TKC Capital Ops</p>
          <h1>{title}</h1>
          <p className="notice">{message}</p>
          <Link className="button-link" href="/login?next=%2Fhotel">{returnLabel}</Link>
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
  const heading = event.title || eventLabel(event.eventType, language);
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
        <span>{heading}{room}</span>
        <span className="event-badges">
          <span className={`badge ${badgeClass}`}>{t(event.priority === "blocked" ? "blocking" : event.priority)}</span>
          <span className={`badge ${statusClass(status)}`}>{statusLabel(status, language)}</span>
        </span>
      </strong>
      <p>{event.note}</p>
      <div className="event-meta">
        {event.title && <span className="badge">{eventLabel(event.eventType, language)}</span>}
        <span className="badge">{channel}</span>
        <small>{formatDateTime(event.createdAt, language)}</small>
      </div>

      <div className="task-actions" aria-label={t("taskState")}>
        <button className="secondary" type="button" onClick={() => onStatusChange(event.id, "open")}>{statusLabel("open", language)}</button>
        <button className="secondary" type="button" onClick={() => onStatusChange(event.id, "in_progress")}>{statusLabel("in_progress", language)}</button>
        <button className="secondary" type="button" onClick={() => onStatusChange(event.id, "blocked")}>{statusLabel("blocked", language)}</button>
        <button type="button" onClick={() => onStatusChange(event.id, "done")}>{statusLabel("done", language)}</button>
      </div>

      <div className="photo-actions">
        <select value={photoReason} onChange={(changeEvent) => setPhotoReason(changeEvent.target.value)} aria-label={t("photoType")}>
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
                <small>{formatDateTime(attachment.createdAt, language)}</small>
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
              <small>{formatDateTime(item.createdAt, language)}</small>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={submitComment}>
        <input
          aria-label={t("addComment")}
          placeholder={`${t("addComment")}...`}
          value={comment}
          onChange={(changeEvent) => setComment(changeEvent.target.value)}
        />
        <button className="secondary" type="submit">{t("comment")}</button>
      </form>
    </article>
  );
}

function translate(language, key) {
  return UI_TEXT[language]?.[key]
    || UI_TEXT_EXTRA[key]?.[language]
    || UI_TEXT.fr[key]
    || UI_TEXT_EXTRA[key]?.fr
    || UI_TEXT.pt[key]
    || UI_TEXT_EXTRA[key]?.pt
    || key;
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

function localeForLanguage(language) {
  return {
    fr: "fr-FR",
    pt: "pt-PT",
    en: "en-GB",
    es: "es-ES",
    it: "it-IT",
    pl: "pl-PL",
  }[language] || "fr-FR";
}

function formatDate(value, language) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    dateStyle: "medium",
    timeZone: "Europe/Paris",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatDateTime(value, language) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function operatorAccountStatus(operator) {
  if (operator.accountStatus) return operator.accountStatus;
  return operator.accountCreatedAt || operator.firstLoginRequired === false ? "active" : "pending";
}

function operatorAccountLabel(operator, language = "fr") {
  return translate(language, operatorAccountStatus(operator) === "active" ? "accountCreated" : "accountPending");
}

function operatorAccountClass(operator) {
  return operatorAccountStatus(operator) === "active" ? "done" : "urgent";
}

function inviteLabel(status, language = "fr") {
  const keys = {
    sending: "sendingInvite",
    sent: "inviteSent",
    dry_run: "invitePrepared",
    error: "inviteError",
  };
  return translate(language, keys[status] || "invitePending");
}

function inviteClass(status) {
  if (status === "sent" || status === "inviteSent") return "done";
  if (status === "error" || status === "inviteError") return "blocked";
  if (["sending", "sendingInvite", "resendingInvite", "dry_run", "invitePrepared"].includes(status)) return "urgent";
  return "";
}
