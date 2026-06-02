const STORAGE_KEY = "projectHub.projects";
const ACTIVITY_KEY = "projectHub.activity";
const THEME_KEY = "projectHub.theme";

const categories = [
  "Web Development",
  "Python",
  "AI",
  "Automation",
  "Cyber Security",
  "College Projects",
  "Personal Projects"
];

const sampleProjects = [
  {
    id: crypto.randomUUID(),
    name: "Portfolio Website",
    description: "Personal portfolio with case studies, contact links, and live project previews.",
    category: "Web Development",
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example/portfolio",
    thumbnail: "",
    dateAdded: new Date().toISOString(),
    favorite: true,
    pinned: true
  },
  {
    id: crypto.randomUUID(),
    name: "AI Notes Organizer",
    description: "A lightweight idea tracker for prompts, notes, and useful AI experiments.",
    category: "AI",
    technologies: ["JavaScript", "LocalStorage"],
    liveUrl: "",
    githubUrl: "https://github.com/example/ai-notes",
    thumbnail: "",
    dateAdded: new Date(Date.now() - 86400000).toISOString(),
    favorite: false,
    pinned: false
  }
];

let projects = loadProjects();
let activity = loadActivity();

const els = {
  projectGrid: document.getElementById("projectGrid"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  techFilter: document.getElementById("techFilter"),
  sortSelect: document.getElementById("sortSelect"),
  totalProjects: document.getElementById("totalProjects"),
  totalCategories: document.getElementById("totalCategories"),
  mostUsedTech: document.getElementById("mostUsedTech"),
  recentProjects: document.getElementById("recentProjects"),
  activityList: document.getElementById("activityList"),
  form: document.getElementById("projectForm"),
  projectId: document.getElementById("projectId"),
  projectName: document.getElementById("projectName"),
  projectDescription: document.getElementById("projectDescription"),
  projectCategory: document.getElementById("projectCategory"),
  projectTech: document.getElementById("projectTech"),
  projectLiveUrl: document.getElementById("projectLiveUrl"),
  projectGithubUrl: document.getElementById("projectGithubUrl"),
  projectThumbnail: document.getElementById("projectThumbnail"),
  saveProjectBtn: document.getElementById("saveProjectBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  formTitle: document.getElementById("formTitle"),
  formModeLabel: document.getElementById("formModeLabel"),
  themeToggle: document.getElementById("themeToggle"),
  backupBtn: document.getElementById("backupBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  clearActivityBtn: document.getElementById("clearActivityBtn"),
  addProjectShortcut: document.getElementById("addProjectShortcut"),
  mobileMenuBtn: document.getElementById("mobileMenuBtn"),
  sidebar: document.querySelector(".sidebar"),
  toast: document.getElementById("toast")
};

init();

function init() {
  applyTheme();
  populateCategoryOptions();
  bindEvents();
  render();
}

function loadProjects() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProjects));
    return sampleProjects;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function loadActivity() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function saveActivity() {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 30)));
}

function bindEvents() {
  els.form.addEventListener("submit", handleSubmit);
  els.searchInput.addEventListener("input", renderProjects);
  els.categoryFilter.addEventListener("change", renderProjects);
  els.techFilter.addEventListener("change", renderProjects);
  els.sortSelect.addEventListener("change", renderProjects);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.backupBtn.addEventListener("click", exportProjects);
  els.exportBtn.addEventListener("click", exportProjects);
  els.importInput.addEventListener("change", importProjects);
  els.clearActivityBtn.addEventListener("click", clearActivity);
  els.addProjectShortcut.addEventListener("click", () => focusForm());
  els.mobileMenuBtn.addEventListener("click", () => els.sidebar.classList.toggle("open"));

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      els.sidebar.classList.remove("open");
    });
  });

  document.addEventListener("keydown", handleShortcuts);
}

function populateCategoryOptions() {
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  });
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
  const projectCategories = [...new Set(projects.map((project) => project.category).filter(Boolean))];
  const allCategories = [...new Set([...categories, ...projectCategories])].sort();
  const allTech = [...new Set(projects.flatMap((project) => project.technologies || []))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  els.categoryFilter.innerHTML = '<option value="">All Categories</option>';
  allCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  });
  els.categoryFilter.value = selectedCategory;

  els.techFilter.innerHTML = '<option value="">All Technologies</option>';
  allTech.forEach((tech) => {
    const option = document.createElement("option");
    option.value = tech;
    option.textContent = tech;
    els.techFilter.append(option);
  });
  els.techFilter.value = selectedTech;
}

function renderStats() {
  const usedCategories = new Set(projects.map((project) => project.category).filter(Boolean));
  const techCounts = countItems(projects.flatMap((project) => project.technologies || []));
  const mostUsed = Object.entries(techCounts).sort((a, b) => b[1] - a[1])[0];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = projects.filter((project) => new Date(project.dateAdded).getTime() >= sevenDaysAgo).length;

  els.totalProjects.textContent = projects.length;
  els.totalCategories.textContent = usedCategories.size;
  els.mostUsedTech.textContent = mostUsed ? mostUsed[0] : "None";
  els.recentProjects.textContent = recentCount;
}

function renderProjects() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const tech = els.techFilter.value;
  const sortBy = els.sortSelect.value;

  const filtered = projects
    .filter((project) => project.name.toLowerCase().includes(query))
    .filter((project) => !category || project.category === category)
    .filter((project) => !tech || (project.technologies || []).includes(tech))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === "oldest") return new Date(a.dateAdded) - new Date(b.dateAdded);
      if (sortBy === "az") return a.name.localeCompare(b.name);
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });

  els.projectGrid.innerHTML = "";
  els.emptyState.classList.toggle("show", filtered.length === 0);

  filtered.forEach((project) => {
    els.projectGrid.append(createProjectCard(project));
  });
}

function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  const initials = project.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  card.innerHTML = `
    <div class="thumbnail">
      ${project.thumbnail ? `<img src="${escapeAttr(project.thumbnail)}" alt="${escapeAttr(project.name)} thumbnail">` : `<span>${escapeHtml(initials)}</span>`}
    </div>
    <div class="card-body">
      <div class="project-title-row">
        <h3>${escapeHtml(project.name)}</h3>
        <div class="project-actions">
          <button class="icon-action ${project.favorite ? "active" : ""}" data-action="favorite" title="Favorite">★</button>
          <button class="icon-action ${project.pinned ? "active" : ""}" data-action="pin" title="Pin">⌃</button>
        </div>
      </div>
      <p class="project-description">${escapeHtml(project.description)}</p>
      <div class="card-tags">
        <span class="tag">${escapeHtml(project.category)}</span>
        ${(project.technologies || []).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
      </div>
      <div class="url-actions">
        <button class="small-button" data-action="live">Live Site</button>
        <button class="small-button" data-action="github">GitHub</button>
        <button class="small-button" data-action="copy">Copy URL</button>
      </div>
      <div class="card-footer">
        <span>${formatDate(project.dateAdded)}</span>
        <div class="project-actions">
          <button class="text-button" data-action="edit">Edit</button>
          <button class="danger-button" data-action="delete">Delete</button>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (!action) return;
    handleProjectAction(action, project.id);
  });

  return card;
}

function handleProjectAction(action, id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;

  if (action === "live") return openUrl(project.liveUrl, "Live URL is empty");
  if (action === "github") return openUrl(project.githubUrl, "GitHub URL is empty");
  if (action === "copy") return copyProjectUrl(project);
  if (action === "edit") return editProject(project);
  if (action === "delete") return deleteProject(project);

  if (action === "favorite" || action === "pin") {
    project[action === "favorite" ? "favorite" : "pinned"] = !project[action === "favorite" ? "favorite" : "pinned"];
    saveProjects();
    addActivity(`${action === "favorite" ? "Updated favorite" : "Updated pin"}: ${project.name}`);
    render();
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const formProject = {
    id: els.projectId.value || crypto.randomUUID(),
    name: els.projectName.value.trim(),
    description: els.projectDescription.value.trim(),
    category: els.projectCategory.value,
    technologies: parseTechnologies(els.projectTech.value),
    liveUrl: els.projectLiveUrl.value.trim(),
    githubUrl: els.projectGithubUrl.value.trim(),
    thumbnail: els.projectThumbnail.value.trim(),
    dateAdded: els.projectId.value ? projects.find((project) => project.id === els.projectId.value)?.dateAdded : new Date().toISOString(),
    favorite: els.projectId.value ? projects.find((project) => project.id === els.projectId.value)?.favorite || false : false,
    pinned: els.projectId.value ? projects.find((project) => project.id === els.projectId.value)?.pinned || false : false
  };

  if (els.projectId.value) {
    projects = projects.map((project) => project.id === formProject.id ? formProject : project);
    addActivity(`Edited project: ${formProject.name}`);
    showToast("Project updated");
  } else {
    projects.unshift(formProject);
    addActivity(`Added project: ${formProject.name}`);
    showToast("Project saved");
  }

  saveProjects();
  resetForm();
  render();
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
  els.saveProjectBtn.textContent = "Update Project";
  els.formTitle.textContent = "Edit Project";
  els.formModeLabel.textContent = "Update";
  els.cancelEditBtn.classList.remove("hidden");
  focusForm();
}

function deleteProject(project) {
  const confirmed = confirm(`Delete "${project.name}" from Project Hub?`);
  if (!confirmed) return;

  projects = projects.filter((item) => item.id !== project.id);
  saveProjects();
  addActivity(`Deleted project: ${project.name}`);
  render();
  showToast("Project deleted");
}

function resetForm() {
  els.form.reset();
  els.projectId.value = "";
  els.saveProjectBtn.textContent = "Save Project";
  els.formTitle.textContent = "Add Project";
  els.formModeLabel.textContent = "Create";
  els.cancelEditBtn.classList.add("hidden");
}

function renderActivity() {
  els.activityList.innerHTML = "";

  if (!activity.length) {
    els.activityList.innerHTML = '<div class="activity-item"><strong>No recent activity</strong><span>Your updates will appear here.</span></div>';
    return;
  }

  activity.slice(0, 12).forEach((item) => {
    const node = document.createElement("div");
    node.className = "activity-item";
    node.innerHTML = `<strong>${escapeHtml(item.message)}</strong><span>${formatDate(item.time, true)}</span>`;
    els.activityList.append(node);
  });
}

function addActivity(message) {
  activity.unshift({ message, time: new Date().toISOString() });
  saveActivity();
}

function clearActivity() {
  activity = [];
  saveActivity();
  renderActivity();
  showToast("Activity cleared");
}

function exportProjects() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), projects }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `project-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  addActivity("Downloaded JSON backup");
  renderActivity();
  showToast("Backup downloaded");
}

function importProjects(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const imported = Array.isArray(data) ? data : data.projects;
      if (!Array.isArray(imported)) throw new Error("Invalid project list");

      projects = imported.map(normalizeProject);
      saveProjects();
      addActivity(`Imported ${projects.length} projects`);
      render();
      showToast("Projects imported");
    } catch {
      showToast("Could not import this JSON file");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function normalizeProject(project) {
  return {
    id: project.id || crypto.randomUUID(),
    name: project.name || "Untitled Project",
    description: project.description || "",
    category: project.category || "Personal Projects",
    technologies: Array.isArray(project.technologies) ? project.technologies : parseTechnologies(project.technologies || ""),
    liveUrl: project.liveUrl || "",
    githubUrl: project.githubUrl || "",
    thumbnail: project.thumbnail || "",
    dateAdded: project.dateAdded || new Date().toISOString(),
    favorite: Boolean(project.favorite),
    pinned: Boolean(project.pinned)
  };
}

function openUrl(url, fallbackMessage) {
  if (!url) {
    showToast(fallbackMessage);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyProjectUrl(project) {
  const url = project.liveUrl || project.githubUrl;
  if (!url) {
    showToast("No URL available to copy");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  addActivity(`Copied URL: ${project.name}`);
  renderActivity();
  showToast("URL copied");
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme();
}

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.toggle("dark", saved ? saved === "dark" : prefersDark);
}

function handleShortcuts(event) {
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    els.searchInput.focus();
  }

  if (event.key.toLowerCase() === "n" && !isTyping) {
    focusForm();
  }

  if (event.key.toLowerCase() === "t" && !isTyping) {
    toggleTheme();
  }
}

function focusForm() {
  document.getElementById("add-project").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => els.projectName.focus(), 350);
}

function parseTechnologies(value) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function countItems(items) {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function formatDate(value, withTime = false) {
  const options = withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
