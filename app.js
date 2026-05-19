const SOURCE_URL = "https://sessionize.com/api/v2/3l2csdh0/view/Sessions?under=True";
const STORAGE_SESSIONS = "session-selector.sessions.v1";
const STORAGE_SELECTED = "session-selector.selected.v1";

const FALLBACK_SESSIONS = [
  {
    id: "fallback-1",
    title: "Keynote: Fabric Data Warehouse's Ultra-Modern Architecture",
    description: "How a modern serverless warehouse in Fabric is built for scale, isolation, and governed analytics.",
    room: "Ellehammer I",
    time: "Tue 8:45 am - 9:30 am"
  },
  {
    id: "fallback-2",
    title: "AI-Powered Data Engineering with Microsoft Fabric",
    description: "Using AI for code generation, living documentation, data quality, and lineage impact analysis.",
    room: "Ellehammer I",
    time: "Tue 10:00 am - 10:45 am"
  },
  {
    id: "fallback-3",
    title: "Mastering Fabric Capacities",
    description: "Advanced monitoring, planning, and scaling patterns for enterprise Fabric capacities.",
    room: "Ellehammer II",
    time: "Tue 10:00 am - 10:45 am"
  },
  {
    id: "fallback-4",
    title: "Databricks Lakeflow Declarative Pipelines",
    description: "Build batch and streaming flows with declarative pipeline design and quality expectations.",
    room: "Tyr",
    time: "Tue 10:00 am - 10:45 am"
  },
  {
    id: "fallback-5",
    title: "Agentic Coding in a Real-Life Data Platform Migration",
    description: "How coding agents accelerated SQL migration, documentation, standards, and team alignment.",
    room: "Ellehammer I",
    time: "Tue 11:00 am - 11:45 am"
  },
  {
    id: "fallback-6",
    title: "Centralise or Federate - How to Scale your Lakehouse",
    description: "Trade-offs and practical guidance for balancing central governance with federated autonomy.",
    room: "Ellehammer II",
    time: "Tue 11:00 am - 11:45 am"
  },
  {
    id: "fallback-7",
    title: "Protect, Discover & Understand data with Fabric & Purview",
    description: "Data protection, DLP, and catalog visibility with Microsoft Purview in Fabric.",
    room: "Tyr",
    time: "Tue 11:00 am - 11:45 am"
  },
  {
    id: "fallback-8",
    title: "Fabric Automation at Scale: From Chaos to Confidence",
    description: "Automation, environment setup, and CI/CD patterns for reliable Fabric platform operations.",
    room: "Ellehammer I",
    time: "Tue 1:00 pm - 1:45 pm"
  },
  {
    id: "fallback-9",
    title: "Using execution plans to write efficient Spark code",
    description: "A practical method for analyzing plans and fixing shuffles, skew, joins, and bottlenecks.",
    room: "Ellehammer II",
    time: "Tue 1:00 pm - 1:45 pm"
  },
  {
    id: "fallback-10",
    title: "From Flat to Sparkling: Monitoring Data Quality with Soda",
    description: "Automated data testing, contracts, and alerting for Fabric lakehouse and warehouse.",
    room: "Tyr",
    time: "Tue 1:00 pm - 1:45 pm"
  },
  {
    id: "fallback-11",
    title: "Adventures in Real-Time Data Analysis!",
    description: "Streaming ingestion and live medallion architecture scenarios for practical real-time analytics.",
    room: "Ellehammer I",
    time: "Tue 2:00 pm - 2:45 pm"
  },
  {
    id: "fallback-12",
    title: "OneLake Security: A Deep Dive",
    description: "How access controls, roles, and fine-grained permissions work end to end in Fabric.",
    room: "Ellehammer II",
    time: "Tue 2:00 pm - 2:45 pm"
  },
  {
    id: "fallback-13",
    title: "Your Neuro-Inclusive Workplace Toolkit",
    description: "Concrete strategies and communication patterns for a neuro-inclusive workplace.",
    room: "Tyr",
    time: "Tue 2:00 pm - 2:45 pm"
  },
  {
    id: "fallback-14",
    title: "Deep insights in your Microsoft Fabric landscape with FUAM",
    description: "Monitoring and auditing patterns for large-scale Fabric administration.",
    room: "Ellehammer I",
    time: "Tue 3:15 pm - 4:00 pm"
  },
  {
    id: "fallback-15",
    title: "When \"fast\" is not enough: pushing Fabric Warehouse",
    description: "Performance deep-dive with execution plans, statistics, and workload management.",
    room: "Ellehammer II",
    time: "Tue 3:15 pm - 4:00 pm"
  },
  {
    id: "fallback-16",
    title: "Build your ontology in a no-code way using Fabric Ontology",
    description: "Hands-on approach to ontology modeling and real-time enrichment in Fabric.",
    room: "Tyr",
    time: "Tue 3:15 pm - 4:00 pm"
  }
];

const state = {
  sessions: [],
  selectedIds: new Set(),
  activeTab: "selected",
  search: "",
  timeFilter: "all"
};

const statusEl = document.getElementById("status");
const selectedPanel = document.getElementById("selectedPanel");
const allPanel = document.getElementById("allPanel");
const tabSelected = document.getElementById("tabSelected");
const tabAll = document.getElementById("tabAll");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchInput");
const timeFilter = document.getElementById("timeFilter");
const cardTemplate = document.getElementById("sessionCardTemplate");

init();

async function init() {
  wireEvents();
  loadFromStorage();

  if (state.sessions.length === 0) {
    await refreshSessions();
  } else {
    render();
    setStatus("Data indlaest fra localStorage.");
  }
}

function wireEvents() {
  refreshBtn.addEventListener("click", refreshSessions);
  clearBtn.addEventListener("click", clearSelections);
  tabSelected.addEventListener("click", () => setTab("selected"));
  tabAll.addEventListener("click", () => setTab("all"));

  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim().toLowerCase();
    render();
  });

  timeFilter.addEventListener("change", () => {
    state.timeFilter = timeFilter.value;
    render();
  });
}

function loadFromStorage() {
  try {
    const storedSessions = JSON.parse(localStorage.getItem(STORAGE_SESSIONS) || "[]");
    const storedSelected = JSON.parse(localStorage.getItem(STORAGE_SELECTED) || "[]");

    if (Array.isArray(storedSessions) && storedSessions.length > 0) {
      state.sessions = normalizeSessions(storedSessions);
    }

    if (Array.isArray(storedSelected)) {
      state.selectedIds = new Set(storedSelected);
      enforceUniqueTimeSlots();
    }
  } catch {
    state.sessions = [];
    state.selectedIds = new Set();
  }
}

function saveStorage() {
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(state.sessions));
  localStorage.setItem(STORAGE_SELECTED, JSON.stringify(Array.from(state.selectedIds)));
}

async function refreshSessions() {
  setStatus("Henter sessions fra web...");

  try {
    const response = await fetch(SOURCE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Kunne ikke hente sessions.");
    }

    const html = await response.text();
    const parsed = parseSessionizeHtml(html);

    if (parsed.length === 0) {
      throw new Error("Ingen sessions fundet i kilden.");
    }

    state.sessions = normalizeSessions(parsed);
    keepOnlyExistingSelections();
    enforceUniqueTimeSlots();
    fillTimeFilter();
    saveStorage();
    render();
    setStatus(`Hentede ${state.sessions.length} sessions fra web.`);
  } catch {
    if (state.sessions.length === 0) {
      state.sessions = normalizeSessions(FALLBACK_SESSIONS);
      fillTimeFilter();
      saveStorage();
      render();
      setStatus("Kunne ikke hente live-data. Bruger indbygget fallback-liste.");
      return;
    }

    setStatus("Kunne ikke opdatere live-data. Viser eksisterende lokalt gemte data.");
  }
}

function parseSessionizeHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const cards = Array.from(doc.querySelectorAll(".sz-session"));

  return cards.map((card, index) => {
    const id = card.id?.trim() || `session-${index}`;
    const title = card.querySelector(".sz-session__title")?.textContent?.trim() || "Uden titel";
    const description = card.querySelector(".sz-session__description")?.textContent?.trim() || "Ingen beskrivelse.";
    const room = card.querySelector(".sz-session__room")?.textContent?.trim() || "Ukendt rum";
    const time = card.querySelector(".sz-session__time")?.textContent?.trim() || "Ukendt tid";

    return { id, title, description, room, time };
  });
}

function normalizeSessions(input) {
  return input
    .filter((item) => item && item.id && item.title)
    .map((item) => ({
      id: String(item.id),
      title: String(item.title).trim(),
      description: String(item.description || "Ingen beskrivelse.").replace(/\s+/g, " ").trim(),
      room: String(item.room || "Ukendt rum").trim(),
      time: String(item.time || "Ukendt tid").replace(/\s+/g, " ").trim(),
      slotKey: buildSlotKey(String(item.time || ""))
    }))
    .sort((a, b) => a.time.localeCompare(b.time) || a.room.localeCompare(b.room));
}

function buildSlotKey(timeText) {
  return timeText.toLowerCase().replace(/\s+/g, " ").trim();
}

function setTab(tabName) {
  state.activeTab = tabName;

  const onSelected = tabName === "selected";
  tabSelected.classList.toggle("active", onSelected);
  tabAll.classList.toggle("active", !onSelected);
  tabSelected.setAttribute("aria-selected", String(onSelected));
  tabAll.setAttribute("aria-selected", String(!onSelected));
  selectedPanel.classList.toggle("hidden", !onSelected);
  allPanel.classList.toggle("hidden", onSelected);
}

function clearSelections() {
  state.selectedIds.clear();
  saveStorage();
  render();
  setStatus("Dine valg er nulstillet.");
}

function toggleSelection(sessionId) {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) {
    return;
  }

  if (state.selectedIds.has(sessionId)) {
    state.selectedIds.delete(sessionId);
    saveStorage();
    render();
    return;
  }

  const conflicting = state.sessions.find(
    (s) => s.slotKey === session.slotKey && state.selectedIds.has(s.id)
  );

  if (conflicting) {
    setStatus("Du kan kun vaelge en session i samme tidsinterval.");
    return;
  }

  state.selectedIds.add(sessionId);
  saveStorage();
  render();
}

function keepOnlyExistingSelections() {
  const allowed = new Set(state.sessions.map((s) => s.id));
  state.selectedIds = new Set(Array.from(state.selectedIds).filter((id) => allowed.has(id)));
}

function enforceUniqueTimeSlots() {
  const selected = state.sessions.filter((s) => state.selectedIds.has(s.id));
  const bySlot = new Map();

  for (const session of selected) {
    if (!bySlot.has(session.slotKey)) {
      bySlot.set(session.slotKey, session.id);
    }
  }

  state.selectedIds = new Set(bySlot.values());
}

function fillTimeFilter() {
  const oldValue = state.timeFilter;
  const times = Array.from(new Set(state.sessions.map((s) => s.time))).sort((a, b) => a.localeCompare(b));

  timeFilter.innerHTML = "<option value=\"all\">Alle</option>";
  for (const time of times) {
    const opt = document.createElement("option");
    opt.value = time;
    opt.textContent = time;
    timeFilter.appendChild(opt);
  }

  state.timeFilter = times.includes(oldValue) ? oldValue : "all";
  timeFilter.value = state.timeFilter;
}

function getFilteredSessions() {
  return state.sessions.filter((session) => {
    const matchesTime = state.timeFilter === "all" || session.time === state.timeFilter;
    const searchArea = `${session.title} ${session.description}`.toLowerCase();
    const matchesSearch = state.search.length === 0 || searchArea.includes(state.search);
    return matchesTime && matchesSearch;
  });
}

function render() {
  fillTimeFilter();

  const filtered = getFilteredSessions();
  const selected = filtered.filter((s) => state.selectedIds.has(s.id));
  const unselected = filtered;

  renderList(selectedPanel, selected, true);
  renderList(allPanel, unselected, false);
}

function renderList(target, items, isFrontPage) {
  target.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = isFrontPage
      ? "Ingen valgte sessions matcher filteret endnu."
      : "Ingen sessions matcher filteret.";
    target.appendChild(empty);
    return;
  }

  for (const session of items) {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector(".session-card");
    const title = node.querySelector(".title");
    const desc = node.querySelector(".description");
    const room = node.querySelector(".room");
    const time = node.querySelector(".time");
    const pick = node.querySelector(".pick");

    title.textContent = session.title;
    desc.textContent = session.description;
    room.textContent = session.room;
    time.textContent = session.time;

    pick.checked = state.selectedIds.has(session.id);
    pick.addEventListener("change", () => toggleSelection(session.id));

    if (isFrontPage) {
      card.style.borderColor = "rgba(23, 98, 74, 0.36)";
      card.style.background = "rgba(236, 250, 244, 0.88)";
    }

    target.appendChild(node);
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}
