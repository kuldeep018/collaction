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
  
