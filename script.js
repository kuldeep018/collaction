const firebaseConfig = {
  apiKey: "AIzaSyAHPpogPeP6KPo1JTmt9oO3oYjrG60G79M",
  authDomain: "web-collaction.firebaseapp.com",
  projectId: "web-collaction",
  storageBucket: "web-collaction.firebasestorage.app",
  messagingSenderId: "184895049860",
  appId: "1:184895049860:web:b5d986fa05f4437d26b2d1",
  measurementId: "G-NESVJRDWBG"
};

const SESSION_KEY = "projectHub.firebaseSession";
const THEME_KEY = "projectHub.theme";
const authBase = "https://identitytoolkit.googleapis.com/v1/accounts";
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const defaultCategories = [
  "Web Development",
  "Python",
  "AI",
  "Automation",
  "Cyber Security",
  "College Projects",
  "Personal Projects"
];

let currentUser = null;
let projects = [];
let activity = [];

const els = {
  authScreen: document.getElementById("authScreen"),
  app: document.getElementById("app"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginIdentity: document.getElementById("loginIdentity"),
  loginPassword: document.getElementById("loginPassword"),
  registerName: document.getElementById("registerName"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword"),
  userName: document.getElementById("userName"),
  logoutBtn: document.getElementById("logoutBtn"),
  themeBtn: document.getElementById("themeBtn"),
  menuBtn: document.getElementById("menuBtn"),
  sidebar: document.getElementById("sidebar"),
  totalProjects: document.getElementById("totalProjects"),
  totalCategories: document.getElementById("totalCategories"),
  mostUsedTech: document.getElementById("mostUsedTech"),
  recentProjects: document.getElementById("recentProjects"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  techFilter: document.getElementById("techFilter"),
  sortSelect: document.getElementById("sortSelect"),
  projectGrid: document.getElementById("projectGrid"),
  emptyState: document.getElementById("emptyState"),
  activityList: document.getElementById("activityList"),
  projectForm: document.getElementById("projectForm"),
  projectId: document.getElementById("projectId"),
  projectName: document.getElementById("projectName"),
  projectDescription: document.getElementById("projectDescription"),
  projectCategory: document.getElementById("projectCategory"),
  projectTech: document.getElementById("projectTech"),
  projectLiveUrl: document.getElementById("projectLiveUrl"),
  projectGithubUrl: document.getElementById("projectGithubUrl"),
  projectThumbnail: document.getElementById("projectThumbnail"),
  formTitle: document.getElementById("formTitle"),
  saveProjectBtn: document.getElementById("saveProjectBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  newProjectBtn: document.getElementById("newProjectBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  toast: document.getElementById("toast")
};

start();

async function start() {
  applyTheme();
  bindEvents();

  const saved = readSession();
  if (saved?.idToken) {
    currentUser = saved;
    await enterApp();
  }
}

function bindEvents() {
  els.loginTab.addEventListener("click", () => switchAuth("login"));
  els.registerTab.addEventListener("click", () => switchAuth("register"));
  els.loginForm.addEventListener("submit", login);
  els.registerForm.addEventListener("submit", register);
  els.logoutBtn.addEventListener("click", logout);
  els.themeBtn.addEventListener("click", toggleTheme);
  els.menuBtn.addEventListener("click", () => els.sidebar.classList.toggle("open"));
  els.searchInput.addEventListener("input", renderProjects);
  els.categoryFilter.addEventListener("change", renderProjects);
  els.techFilter.addEventListener("change", renderProjects);
  els.sortSelect.addEventListener("change", renderProjects);
  els.projectForm.addEventListener("submit", saveProject);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.newProjectBtn.addEventListener("click", focusProjectForm);
  els.exportBtn.addEventListener("click", exportProjects);
  els.importInput.addEventListener("change", importProjects);

  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
    if (event.key === "/" && !typing) {
      event.preventDefault();
      els.searchInput.focus();
    }
    if (event.key.toLowerCase() === "n" && !typing) focusProjectForm();
    if (event.key.toLowerCase() === "t" && !typing) toggleTheme();
  });
}

function switchAuth(mode) {
  const loginMode = mode === "login";
  els.loginTab.classList.toggle("active", loginMode);
  els.registerTab.classList.toggle("active", !loginMode);
  els.loginForm.classList.toggle("hidden", !loginMode);
  els.registerForm.classList.toggle("hidden", loginMode);
}

async function register(event) {
  event.preventDefault();
  try {
    const name = els.registerName.value.trim();
    const response = await authRequest("signUp", {
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value,
      returnSecureToken: true
    });

    currentUser = {
      uid: response.localId,
      email: response.email,
      name,
      idToken: response.idToken,
      refreshToken: response.refreshToken
    };
    saveSession();

    await setFirestoreDoc("users", currentUser.uid, { name, email: currentUser.email, createdAt: new Date().toISOString() });
    els.registerForm.reset();
    showToast("Account created");
    await enterApp();
  } catch (error) {
    showToast(readableAuthError(error.message));
  }
}

async function login(event) {
  event.preventDefault();
  try {
    const response = await authRequest("signInWithPassword", {
      email: els.loginIdentity.value.trim(),
      password: els.loginPassword.value,
      returnSecureToken: true
    });

    currentUser = {
      uid: response.localId,
      email: response.email,
      name: response.displayName || response.email.split("@")[0],
      idToken: response.idToken,
      refreshToken: response.refreshToken
    };
    saveSession();
    els.loginForm.reset();
    await enterApp();
  } catch (error) {
    showToast(readableAuthError(error.message));
  }
}

async function enterApp() {
  els.userName.textContent = currentUser.name || currentUser.email;
  els.authScreen.classList.add("hidden");
  els.app.classList.remove("hidden");
  await loadUserData();
  render();
}

function logout() {
  currentUser = null;
  projects = [];
  activity = [];
  localStorage.removeItem(SESSION_KEY);
  els.app.classList.add("hidden");
  els.authScreen.classList.remove("hidden");
  switchAuth("login");
  render();
  showToast("Logged out");
}

async function loadUserData() {
  projects = await queryCollection("projects");
  activity = await queryCollection("activity");
  projects.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  activity.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function render() {
  renderFilters();
  renderStats();
  renderProjects();
  renderActivity();
}

function renderFilters() {
  const selectedCategory = els.categoryFilter.value;
  const selectedTech = els.techFilter.value;
  const categories = [...new Set([...defaultCategories, ...projects.map((project) => project.category)])].filter(Boolean).sort();
  const techs = [...new Set(projects.flatMap((project) => project.technologies || []))].filter(Boolean).sort();

  els.categoryFilter.innerHTML = '<option value="">All categories</option>';
  categories.forEach((category) => els.categoryFilter.append(new Option(category, category)));
  els.categoryFilter.value = selectedCategory;

  els.techFilter.innerHTML = '<option value="">All technologies</option>';
  techs.forEach((tech) => els.techFilter.append(new Option(tech, tech)));
  els.techFilter.value = selectedTech;
}

function renderStats() {
  const categoryCount = new Set(projects.map((project) => project.category).filter(Boolean)).size;
  const techCounts = projects.flatMap((project) => project.technologies || []).reduce((acc, tech) => {
    acc[tech] = (acc[tech] || 0) + 1;
    return acc;
  }, {});
  const topTech = Object.entries(techCounts).sort((a, b) => b[1] - a[1])[0];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  els.totalProjects.textContent = projects.length;
  els.totalCategories.textContent = categoryCount;
  els.mostUsedTech.textContent = topTech ? topTech[0] : "None";
  els.recentProjects.textContent = projects.filter((project) => new Date(project.dateAdded).getTime() >= sevenDaysAgo).length;
}

function renderProjects() {
  const queryText = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const tech = els.techFilter.value;
  const sort = els.sortSelect.value;

  const visible = projects
    .filter((project) => project.name.toLowerCase().includes(queryText))
    .filter((project) => !category || project.category === category)
    .filter((project) => !tech || (project.technologies || []).includes(tech))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "oldest") return new Date(a.dateAdded) - new Date(b.dateAdded);
      if (sort === "az") return a.name.localeCompare(b.name);
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });

  els.projectGrid.innerHTML = "";
  els.emptyState.classList.toggle("hidden", visible.length > 0);
  visible.forEach((project) => els.projectGrid.append(createProjectCard(project)));
}

function createProjectCard(project) {
  const initials = project.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const card = document.createElement("article");
  card.className = "project-card";
  card.innerHTML = `
    <div class="thumb">${project.thumbnail ? `<img src="${escapeHtml(project.thumbnail)}" alt="${escapeHtml(project.name)} thumbnail">` : escapeHtml(initials)}</div>
    <div class="card-body">
      <div class="card-top">
        <h3>${escapeHtml(project.name)}</h3>
        <div>
          <button class="icon-btn ${project.favorite ? "active" : ""}" data-action="favorite" title="Favorite">★</button>
          <button class="icon-btn ${project.pinned ? "active" : ""}" data-action="pin" title="Pin">⌃</button>
        </div>
      </div>
      <p>${escapeHtml(project.description)}</p>
      <div class="tags">
        <span class="tag">${escapeHtml(project.category)}</span>
        ${(project.technologies || []).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
      </div>
      <span class="meta">Added ${formatDate(project.dateAdded)}</span>
      <div class="card-actions">
        <button class="small-btn" data-action="live">Live Site</button>
        <button class="small-btn" data-action="github">GitHub</button>
        <button class="small-btn" data-action="copy">Copy URL</button>
        <button class="small-btn" data-action="edit">Edit</button>
        <button class="danger-btn" data-action="delete">Delete</button>
      </div>
    </div>
  `;
  card.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (action) projectAction(action, project.id);
  });
  return card;
}

async function projectAction(action, id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;

  if (action === "live") return openUrl(project.liveUrl, "Live URL empty hai");
  if (action === "github") return openUrl(project.githubUrl, "GitHub URL empty hai");
  if (action === "copy") return copyUrl(project.liveUrl || project.githubUrl);
  if (action === "edit") return editProject(project);
  if (action === "delete") return deleteProject(project);

  if (action === "favorite") project.favorite = !project.favorite;
  if (action === "pin") project.pinned = !project.pinned;
  await setFirestoreDoc("projects", project.id, project);
  await addActivity(`${action === "favorite" ? "Favorite updated" : "Pin updated"}: ${project.name}`);
  await loadUserData();
  render();
}

async function saveProject(event) {
  event.preventDefault();
  const existing = projects.find((project) => project.id === els.projectId.value);
  const project = {
    id: existing?.id || crypto.randomUUID(),
    userId: currentUser.uid,
    name: els.projectName.value.trim(),
    description: els.projectDescription.value.trim(),
    category: els.projectCategory.value,
    technologies: parseTech(els.projectTech.value),
    liveUrl: els.projectLiveUrl.value.trim(),
    githubUrl: els.projectGithubUrl.value.trim(),
    thumbnail: els.projectThumbnail.value.trim(),
    dateAdded: existing?.dateAdded || new Date().toISOString(),
    favorite: existing?.favorite || false,
    pinned: existing?.pinned || false,
    updatedAt: new Date().toISOString()
  };

  await setFirestoreDoc("projects", project.id, project);
  await addActivity(`${existing ? "Edited" : "Added"} project: ${project.name}`);
  await loadUserData();
  resetForm();
  render();
  showToast(existing ? "Project updated" : "Project saved");
}

function editProject(project) {
  els.projectId.value = project.id;
  els.projectName.value = project.name;
  els.projectDescription.value = project.description;
  els.projectCategory.value = project.category;
  els.projectTech.value = (project.technologies || []).join(", ");
  els.projectLiveUrl.value = project.liveUrl;
  els.projectGithubUrl.value = project.githubUrl;
  els.projectThumbnail.value = project.thumbnail;
  els.formTitle.textContent = "Edit Project";
  els.saveProjectBtn.textContent = "Update Project";
  els.cancelEditBtn.classList.remove("hidden");
  focusProjectForm();
}

async function deleteProject(project) {
  if (!confirm(`Delete "${project.name}"?`)) return;
  await deleteFirestoreDoc("projects", project.id);
  await addActivity(`Deleted project: ${project.name}`);
  await loadUserData();
  render();
  showToast("Project deleted");
}

function resetForm() {
  els.projectForm.reset();
  els.projectId.value = "";
  els.formTitle.textContent = "Add Project";
  els.saveProjectBtn.textContent = "Save Project";
  els.cancelEditBtn.classList.add("hidden");
}

function renderActivity() {
  els.activityList.innerHTML = "";
  if (!activity.length) {
    els.activityList.innerHTML = '<div class="activity-item"><strong>No activity yet</strong><span>Your changes will appear here.</span></div>';
    return;
  }
  activity.slice(0, 12).forEach((item) => {
    const node = document.createElement("div");
    node.className = "activity-item";
    node.innerHTML = `<strong>${escapeHtml(item.message)}</strong><span>${formatDate(item.time, true)}</span>`;
    els.activityList.append(node);
  });
}

async function addActivity(message) {
  await setFirestoreDoc("activity", crypto.randomUUID(), {
    userId: currentUser.uid,
    message,
    time: new Date().toISOString()
  });
}

function exportProjects() {
  const blob = new Blob([JSON.stringify({ user: currentUser.email, exportedAt: new Date().toISOString(), projects }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `project-hub-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Backup downloaded");
}

function importProjects(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      const imported = Array.isArray(data) ? data : data.projects;
      if (!Array.isArray(imported)) throw new Error("Invalid file");
      for (const item of imported) {
        const project = normalizeImportedProject(item);
        await setFirestoreDoc("projects", project.id, project);
      }
      await addActivity(`Imported ${imported.length} projects`);
      await loadUserData();
      render();
      showToast("Projects imported");
    } catch {
      showToast("Invalid JSON file");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function normalizeImportedProject(project) {
  return {
    id: crypto.randomUUID(),
    userId: currentUser.uid,
    name: project.name || "Untitled Project",
    description: project.description || "",
    category: project.category || "Personal Projects",
    technologies: Array.isArray(project.technologies) ? project.technologies : parseTech(project.technologies || ""),
    liveUrl: project.liveUrl || "",
    githubUrl: project.githubUrl || "",
    thumbnail: project.thumbnail || "",
    dateAdded: project.dateAdded || new Date().toISOString(),
    favorite: Boolean(project.favorite),
    pinned: Boolean(project.pinned),
    updatedAt: new Date().toISOString()
  };
}

async function authRequest(endpoint, body) {
  const response = await fetch(`${authBase}:${endpoint}?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "AUTH_ERROR");
  return data;
}

async function firestoreRequest(path, options = {}) {
  const response = await fetch(`${firestoreBase}/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentUser.idToken}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "FIRESTORE_ERROR");
  return data;
}

async function setFirestoreDoc(collectionName, id, value) {
  const payload = { fields: toFirestoreFields(value) };
  await firestoreRequest(`${collectionName}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

async function deleteFirestoreDoc(collectionName, id) {
  await firestoreRequest(`${collectionName}/${id}`, { method: "DELETE" });
}

async function queryCollection(collectionName) {
  const structuredQuery = {
    structuredQuery: {
      from: [{ collectionId: collectionName }],
      where: {
        fieldFilter: {
          field: { fieldPath: "userId" },
          op: "EQUAL",
          value: { stringValue: currentUser.uid }
        }
      }
    }
  };

  const rows = await firestoreRequest(":runQuery", {
    method: "POST",
    body: JSON.stringify(structuredQuery)
  });

  return rows
    .filter((row) => row.document)
    .map((row) => {
      const parts = row.document.name.split("/");
      return {
        id: parts[parts.length - 1],
        ...fromFirestoreFields(row.document.fields || {})
      };
    });
}

function toFirestoreFields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)]));
}

function toFirestoreValue(value) {
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { doubleValue: value };
  return { stringValue: value == null ? "" : String(value) };
}

function fromFirestoreFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function fromFirestoreValue(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("doubleValue" in value) return value.doubleValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  return "";
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function openUrl(url, message) {
  if (!url) return showToast(message);
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyUrl(url) {
  if (!url) return showToast("Copy karne ke liye URL nahi hai");
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url);
  } else {
    const input = document.createElement("textarea");
    input.value = url;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  showToast("URL copied");
}

function focusProjectForm() {
  document.getElementById("add").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => els.projectName.focus(), 300);
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
}

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.toggle("dark", saved ? saved === "dark" : prefersDark);
}

function parseTech(value) {
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function formatDate(value, withTime = false) {
  return new Intl.DateTimeFormat(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(value));
}

function readableAuthError(message) {
  const messages = {
    EMAIL_EXISTS: "This email already has an account",
    INVALID_EMAIL: "Email address invalid hai",
    WEAK_PASSWORD: "Password at least 6 characters ka rakho",
    INVALID_LOGIN_CREDENTIALS: "Email ya password wrong hai",
    EMAIL_NOT_FOUND: "Email ya password wrong hai",
    INVALID_PASSWORD: "Email ya password wrong hai"
  };
  return messages[message] || message || "Something went wrong";
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
