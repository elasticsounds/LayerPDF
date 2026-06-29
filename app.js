import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";

const $ = (id) => document.getElementById(id);
const state = {
  pdfFile: null,
  pdf: null,
  pages: [],
  selectedFontBase64: null,
  bundledFontBase64: null,
  customFontUrl: null,
  textStyles: [],
  projects: [],
  currentProjectId: null,
  editingPageNumber: null,
};

const SETTINGS_KEY = "layerpdf.settings.v1";
const TEXT_STYLES_KEY = "layerpdf.textStyles.v1";
const PROJECT_INDEX_KEY = "layerpdf.projects.v1";
const SETTINGS_VERSION = 4;
const DB_NAME = "layerpdf";
const DB_VERSION = 1;
const PDF_STORE = "files";
const LAST_PDF_ID = "lastPdf";
const LAST_FONT_ID = "lastFont";
const LAST_SESSION_ID = "lastSession";
const PROJECT_RECORD_PREFIX = "project:";
const CUSTOM_FONT_VALUE = "Custom story font";
const MATCH_BOOK_FONT_VALUE = "__match_book__";

const GOOGLE_FONT_OPTIONS = new Set([
  "Poppins",
  "Patrick Hand",
  "Comic Neue",
  "Kalam",
  "Short Stack",
  "Caveat",
  "Gaegu",
  "Schoolbell",
  "Architects Daughter",
  "Atma",
  "Baloo 2",
  "Nunito",
  "Andika",
  "Lexend",
]);

const BOOK_FONT_MATCHES = [
  ["patrickhand", "Patrick Hand"],
  ["poppins", "Poppins"],
  ["comicneue", "Comic Neue"],
  ["kalam", "Kalam"],
  ["shortstack", "Short Stack"],
  ["caveat", "Caveat"],
  ["gaegu", "Gaegu"],
  ["schoolbell", "Schoolbell"],
  ["architectsdaughter", "Architects Daughter"],
  ["atma", "Atma"],
  ["baloo", "Baloo 2"],
  ["nunito", "Nunito"],
  ["andika", "Andika"],
  ["lexend", "Lexend"],
];

const TEXT_STYLE_FIELDS = ["fontName", "color", "fontSize", "letterSpacing", "lineHeight", "fontWeight", "align"];
let sessionSaveTimer = null;

const OCR_LANGUAGES = [
  ["afr", "Afrikaans"],
  ["amh", "Amharic"],
  ["ara", "Arabic"],
  ["asm", "Assamese"],
  ["aze", "Azerbaijani"],
  ["aze_cyrl", "Azerbaijani Cyrillic"],
  ["bel", "Belarusian"],
  ["ben", "Bengali"],
  ["bod", "Tibetan"],
  ["bos", "Bosnian"],
  ["bre", "Breton"],
  ["bul", "Bulgarian"],
  ["cat", "Catalan"],
  ["ceb", "Cebuano"],
  ["ces", "Czech"],
  ["chi_sim", "Chinese Simplified"],
  ["chi_sim_vert", "Chinese Simplified vertical"],
  ["chi_tra", "Chinese Traditional"],
  ["chi_tra_vert", "Chinese Traditional vertical"],
  ["chr", "Cherokee"],
  ["cos", "Corsican"],
  ["cym", "Welsh"],
  ["dan", "Danish"],
  ["dan_frak", "Danish Fraktur"],
  ["deu", "German"],
  ["deu_frak", "German Fraktur"],
  ["div", "Divehi"],
  ["dzo", "Dzongkha"],
  ["ell", "Greek"],
  ["eng", "English"],
  ["enm", "Middle English"],
  ["epo", "Esperanto"],
  ["equ", "Math / equation"],
  ["est", "Estonian"],
  ["eus", "Basque"],
  ["fao", "Faroese"],
  ["fas", "Persian"],
  ["fil", "Filipino"],
  ["fin", "Finnish"],
  ["fra", "French"],
  ["frk", "Frankish"],
  ["frm", "Middle French"],
  ["fry", "Western Frisian"],
  ["gla", "Scottish Gaelic"],
  ["gle", "Irish"],
  ["glg", "Galician"],
  ["grc", "Ancient Greek"],
  ["guj", "Gujarati"],
  ["hat", "Haitian Creole"],
  ["heb", "Hebrew"],
  ["hin", "Hindi"],
  ["hrv", "Croatian"],
  ["hun", "Hungarian"],
  ["hye", "Armenian"],
  ["iku", "Inuktitut"],
  ["ind", "Indonesian"],
  ["isl", "Icelandic"],
  ["ita", "Italian"],
  ["ita_old", "Old Italian"],
  ["jav", "Javanese"],
  ["jpn", "Japanese"],
  ["jpn_vert", "Japanese vertical"],
  ["kan", "Kannada"],
  ["kat", "Georgian"],
  ["kat_old", "Old Georgian"],
  ["kaz", "Kazakh"],
  ["khm", "Khmer"],
  ["kir", "Kyrgyz"],
  ["kmr", "Kurmanji Kurdish"],
  ["kor", "Korean"],
  ["kor_vert", "Korean vertical"],
  ["lao", "Lao"],
  ["lat", "Latin"],
  ["lav", "Latvian"],
  ["lit", "Lithuanian"],
  ["ltz", "Luxembourgish"],
  ["mal", "Malayalam"],
  ["mar", "Marathi"],
  ["mkd", "Macedonian"],
  ["mlt", "Maltese"],
  ["mon", "Mongolian"],
  ["mri", "Maori"],
  ["msa", "Malay"],
  ["mya", "Burmese"],
  ["nep", "Nepali"],
  ["nld", "Dutch"],
  ["nor", "Norwegian"],
  ["oci", "Occitan"],
  ["ori", "Odia"],
  ["osd", "Orientation and script detection"],
  ["pan", "Punjabi"],
  ["pol", "Polish"],
  ["por", "Portuguese"],
  ["pus", "Pashto"],
  ["que", "Quechua"],
  ["ron", "Romanian"],
  ["rus", "Russian"],
  ["san", "Sanskrit"],
  ["sin", "Sinhala"],
  ["slk", "Slovak"],
  ["slk_frak", "Slovak Fraktur"],
  ["slv", "Slovenian"],
  ["snd", "Sindhi"],
  ["spa", "Spanish"],
  ["spa_old", "Old Spanish"],
  ["sqi", "Albanian / Shqip"],
  ["srp", "Serbian"],
  ["srp_latn", "Serbian Latin"],
  ["sun", "Sundanese"],
  ["swa", "Swahili"],
  ["swe", "Swedish"],
  ["syr", "Syriac"],
  ["tam", "Tamil"],
  ["tat", "Tatar"],
  ["tel", "Telugu"],
  ["tgk", "Tajik"],
  ["tgl", "Tagalog"],
  ["tha", "Thai"],
  ["tir", "Tigrinya"],
  ["ton", "Tongan"],
  ["tur", "Turkish"],
  ["uig", "Uyghur"],
  ["ukr", "Ukrainian"],
  ["urd", "Urdu"],
  ["uzb", "Uzbek"],
  ["uzb_cyrl", "Uzbek Cyrillic"],
  ["vie", "Vietnamese"],
  ["yid", "Yiddish"],
  ["yor", "Yoruba"],
];

const els = {
  pdfInput: $("pdfInput"),
  projectSelect: $("projectSelect"),
  projectName: $("projectName"),
  openProjectBtn: $("openProjectBtn"),
  saveProjectBtn: $("saveProjectBtn"),
  newProjectBtn: $("newProjectBtn"),
  deleteProjectBtn: $("deleteProjectBtn"),
  pageRange: $("pageRange"),
  tileMode: $("tileMode"),
  ocrEngine: $("ocrEngine"),
  ocrLang: $("ocrLang"),
  ocrLangOptions: $("ocrLangOptions"),
  geminiApiKey: $("geminiApiKey"),
  geminiModel: $("geminiModel"),
  minConfidence: $("minConfidence"),
  requireLightArea: $("requireLightArea"),
  textColor: $("textColor"),
  fontSizeOverride: $("fontSizeOverride"),
  letterSpacing: $("letterSpacing"),
  lineHeight: $("lineHeight"),
  textAlign: $("textAlign"),
  cleanupMode: $("cleanupMode"),
  apiKey: $("apiKey"),
  imageModel: $("imageModel"),
  imageSize: $("imageSize"),
  imageQuality: $("imageQuality"),
  editPrompt: $("editPrompt"),
  bookStyleSelect: $("bookStyleSelect"),
  applyBookStyle: $("applyBookStyle"),
  saveBookStyle: $("saveBookStyle"),
  fontName: $("fontName"),
  fontFile: $("fontFile"),
  renderBtn: $("renderBtn"),
  cleanBtn: $("cleanBtn"),
  exportPdfBtn: $("exportPdfBtn"),
  exportPptxBtn: $("exportPptxBtn"),
  pageGrid: $("pageGrid"),
  pageTemplate: $("pageTemplate"),
  emptyState: $("emptyState"),
  status: $("status"),
  workspaceTitle: $("workspaceTitle"),
  progressBar: $("progressBar"),
};

els.pdfInput.addEventListener("change", () => {
  state.pdfFile = els.pdfInput.files?.[0] ?? null;
  state.currentProjectId = null;
  els.projectSelect.value = "";
  els.projectName.value = state.pdfFile ? projectNameFromPdf(state.pdfFile.name) : "";
  els.workspaceTitle.textContent = state.pdfFile ? state.pdfFile.name : "No PDF loaded";
  state.pages = [];
  state.editingPageNumber = null;
  els.pageGrid.innerHTML = "";
  els.pageGrid.classList.remove("edit-mode");
  els.emptyState.hidden = false;
  clearSavedSession().catch(() => {});
  if (state.pdfFile) {
    saveLastPdf(state.pdfFile).catch(() => {
      setStatus("PDF loaded, but this browser could not save it for refresh.");
    });
  }
});

els.openProjectBtn.addEventListener("click", () => {
  openSelectedProject().catch((error) => {
    setStatus(`Could not open project: ${summarizeError(error)}`);
  });
});
els.saveProjectBtn.addEventListener("click", () => {
  saveCurrentProject().catch((error) => {
    setStatus(`Could not save project: ${summarizeError(error)}`);
  });
});
els.newProjectBtn.addEventListener("click", () => {
  startNewProject().catch((error) => {
    setStatus(`Could not start a new project: ${summarizeError(error)}`);
  });
});
els.deleteProjectBtn.addEventListener("click", () => {
  deleteSelectedProject().catch((error) => {
    setStatus(`Could not delete project: ${summarizeError(error)}`);
  });
});

els.fontFile.addEventListener("change", async () => {
  const file = els.fontFile.files?.[0];
  state.selectedFontBase64 = file ? await fileToBase64(file) : null;
  if (file) {
    registerCustomFont(file);
    saveLastFont(file).catch(() => {
      setStatus("Custom font loaded, but this browser could not save it for refresh.");
    });
  }
});

els.renderBtn.addEventListener("click", renderAndOcr);
els.cleanBtn.addEventListener("click", () => cleanPages(state.pages));
els.exportPdfBtn.addEventListener("click", exportLayeredPdf);
els.exportPptxBtn.addEventListener("click", exportPowerPoint);
els.applyBookStyle.addEventListener("click", () => {
  const style = selectedSavedStyle(els.bookStyleSelect.value);
  if (!style) {
    setStatus("Choose a saved style first.");
    return;
  }
  applyStyleToBook(style.values);
});
els.saveBookStyle.addEventListener("click", () => {
  saveTextStyleFromPrompt(currentBookStyle(), "Book style");
});
els.fontSizeOverride.addEventListener("change", () => {
  if (state.pages.length === 0) return;
  const fontSize = normalizeFontSizes(state.pages);
  state.pages.forEach(refreshPageCard);
  scheduleSaveSession();
  setStatus(`Updated text size to ${fontSize.toFixed(1)}.`, 100);
});
els.fontName.addEventListener("change", () => {
  applySelectedFont();
  state.pages.forEach(refreshPageCard);
  scheduleSaveSession();
});
for (const field of [els.textColor, els.letterSpacing, els.lineHeight, els.textAlign]) {
  field.addEventListener(field === els.textAlign ? "change" : "input", () => {
    applyTextStyleToPages();
    state.pages.forEach(refreshPageCard);
    scheduleSaveSession();
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && state.pages.length > 0) {
    clearTimeout(sessionSaveTimer);
    saveCurrentSession().catch(() => {});
  }
});

populateOcrLanguages();
initializePersistence();
loadBundledFont();
restoreTextStyles();
refreshStyleLibraryControls();
applySelectedFont();

function populateOcrLanguages() {
  const sortedLanguages = [...OCR_LANGUAGES].sort((a, b) =>
    a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
  );
  els.ocrLangOptions.innerHTML = "";
  for (const [code, name] of sortedLanguages) {
    const option = document.createElement("option");
    option.value = code;
    option.label = `${name} (${code})`;
    els.ocrLangOptions.appendChild(option);
  }
}

function initializePersistence() {
  restoreSettings();
  restoreProjectIndex();
  refreshProjectSelect();
  bindPersistentSettings();
  restoreLastPdf();
  restoreLastSession();
  restoreLastFont();
}

function persistentFields() {
  return [
    els.pageRange,
    els.tileMode,
    els.ocrEngine,
    els.ocrLang,
    els.geminiApiKey,
    els.geminiModel,
    els.minConfidence,
    els.requireLightArea,
    els.textColor,
    els.fontSizeOverride,
    els.letterSpacing,
    els.lineHeight,
    els.textAlign,
    els.cleanupMode,
    els.apiKey,
    els.imageModel,
    els.imageSize,
    els.imageQuality,
    els.editPrompt,
    els.fontName,
  ].filter(Boolean);
}

function restoreSettings() {
  const settings = readSettings();
  if (!settings.settingsVersion && settings.fontName === "Mouse Memoirs") {
    settings.fontName = MATCH_BOOK_FONT_VALUE;
  }
  if ((settings.settingsVersion ?? 1) < 3 && settings.cleanupMode === "local") {
    settings.cleanupMode = "none";
  }
  if ((settings.settingsVersion ?? 1) < 4 && settings.tileMode === "auto") {
    settings.tileMode = "none";
  }
  for (const field of persistentFields()) {
    if (!(field.id in settings)) continue;
    if (field.type === "checkbox") {
      field.checked = Boolean(settings[field.id]);
    } else {
      field.value = String(settings[field.id] ?? "");
    }
  }
}

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

function bindPersistentSettings() {
  for (const field of persistentFields()) {
    field.addEventListener("input", saveSettings);
    field.addEventListener("change", saveSettings);
  }
}

function saveSettings() {
  const settings = { settingsVersion: SETTINGS_VERSION };
  for (const field of persistentFields()) {
    settings[field.id] = field.type === "checkbox" ? field.checked : field.value;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function captureSettings() {
  const settings = { settingsVersion: SETTINGS_VERSION };
  for (const field of persistentFields()) {
    settings[field.id] = field.type === "checkbox" ? field.checked : field.value;
  }
  return settings;
}

function applySettings(settings = {}) {
  for (const field of persistentFields()) {
    if (!(field.id in settings)) continue;
    if (field.type === "checkbox") {
      field.checked = Boolean(settings[field.id]);
    } else {
      field.value = String(settings[field.id] ?? "");
    }
  }
  saveSettings();
  applySelectedFont();
}

function restoreProjectIndex() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECT_INDEX_KEY) || "[]");
    state.projects = Array.isArray(parsed)
      ? parsed
          .map((project) => ({
            id: String(project.id || ""),
            name: String(project.name || "Untitled project").trim() || "Untitled project",
            pdfName: String(project.pdfName || ""),
            pageCount: Number(project.pageCount) || 0,
            updatedAt: Number(project.updatedAt) || 0,
          }))
          .filter((project) => project.id)
      : [];
  } catch {
    state.projects = [];
  }
}

function persistProjectIndex() {
  localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(state.projects));
}

function refreshProjectSelect() {
  els.projectSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = state.projects.length === 0 ? "No saved projects" : "Choose a project";
  els.projectSelect.appendChild(placeholder);
  const sortedProjects = [...state.projects].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const project of sortedProjects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = `${project.name}${project.pdfName ? ` (${project.pdfName})` : ""}`;
    els.projectSelect.appendChild(option);
  }
  els.projectSelect.value = state.currentProjectId || "";
}

async function saveCurrentProject(options = {}) {
  const { silent = false, allowCreate = true } = options;
  if (!state.pdfFile) {
    if (!silent) setStatus("Choose a PDF before saving a project.");
    return null;
  }
  if (!state.currentProjectId && !allowCreate) return null;
  const projectId = state.currentProjectId || crypto.randomUUID();
  const projectName = (els.projectName.value || projectNameFromPdf(state.pdfFile.name)).trim() || "Untitled project";
  const record = await buildProjectRecord(projectId, projectName);
  await writeProjectRecord(record);
  state.currentProjectId = projectId;
  upsertProjectSummary(record);
  persistProjectIndex();
  refreshProjectSelect();
  await saveLastPdf(state.pdfFile);
  await saveCurrentSession({ updateProject: false });
  if (!silent) setStatus(`Saved project "${record.name}".`, 100);
  return record;
}

async function buildProjectRecord(projectId, projectName) {
  const pdfBlob = state.pdfFile;
  return {
    id: projectRecordId(projectId),
    projectId,
    name: projectName,
    pdfName: pdfBlob.name,
    pdfType: pdfBlob.type || "application/pdf",
    pdfLastModified: pdfBlob.lastModified || Date.now(),
    pdfBlob,
    settings: captureSettings(),
    pages: state.pages.map(serializePageState),
    textStyles: state.textStyles,
    selectedFontBase64: state.selectedFontBase64,
    updatedAt: Date.now(),
  };
}

async function writeProjectRecord(record) {
  const db = await openLayerDb();
  await putRecord(db, PDF_STORE, record);
}

function upsertProjectSummary(record) {
  const summary = {
    id: record.projectId,
    name: record.name,
    pdfName: record.pdfName,
    pageCount: record.pages?.length || 0,
    updatedAt: record.updatedAt,
  };
  state.projects = [summary, ...state.projects.filter((project) => project.id !== summary.id)];
}

async function openSelectedProject() {
  const projectId = els.projectSelect.value;
  if (!projectId) {
    setStatus("Choose a saved project to open.");
    return;
  }
  const record = await readProjectRecord(projectId);
  if (!record) {
    setStatus("That project could not be found in this browser.");
    return;
  }
  await openProjectRecord(record);
}

async function openProjectRecord(record) {
  applySettings(record.settings || {});
  state.currentProjectId = record.projectId;
  els.projectName.value = record.name || projectNameFromPdf(record.pdfName || "Untitled.pdf");
  els.projectSelect.value = state.currentProjectId;
  state.pdfFile = new File([record.pdfBlob], record.pdfName || "project.pdf", {
    type: record.pdfType || "application/pdf",
    lastModified: record.pdfLastModified || Date.now(),
  });
  state.pdf = null;
  state.textStyles = Array.isArray(record.textStyles) ? record.textStyles : state.textStyles;
  persistTextStyles();
  refreshStyleLibraryControls();
  if (record.selectedFontBase64) {
    state.selectedFontBase64 = record.selectedFontBase64;
    ensureCustomFontOption();
    addFontFace(CUSTOM_FONT_VALUE, `data:font/ttf;base64,${record.selectedFontBase64}`);
  }
  state.pages = Array.isArray(record.pages) ? record.pages.map(normalizeSavedPageState).filter(Boolean) : [];
  state.editingPageNumber = null;
  els.workspaceTitle.textContent = state.pdfFile.name;
  els.pageGrid.innerHTML = "";
  els.pageGrid.classList.remove("edit-mode");
  els.emptyState.hidden = state.pages.length > 0;
  for (const page of state.pages) {
    renderPageCard(page);
    refreshPageCard(page);
  }
  await saveLastPdf(state.pdfFile);
  await saveCurrentSession({ updateProject: false });
  setStatus(`Opened project "${record.name}".`, 100);
}

async function readProjectRecord(projectId) {
  const db = await openLayerDb();
  return getRecord(db, PDF_STORE, projectRecordId(projectId));
}

async function deleteSelectedProject() {
  const projectId = els.projectSelect.value;
  if (!projectId) {
    setStatus("Choose a saved project to delete.");
    return;
  }
  const project = state.projects.find((item) => item.id === projectId);
  const name = project?.name || "this project";
  if (!window.confirm(`Delete "${name}" from this browser?`)) return;
  const db = await openLayerDb();
  await deleteRecord(db, PDF_STORE, projectRecordId(projectId));
  state.projects = state.projects.filter((item) => item.id !== projectId);
  persistProjectIndex();
  if (state.currentProjectId === projectId) {
    state.currentProjectId = null;
    state.pdfFile = null;
    state.pdf = null;
    state.pages = [];
    state.editingPageNumber = null;
    els.projectName.value = "";
    els.pdfInput.value = "";
    els.workspaceTitle.textContent = "No PDF loaded";
    els.pageGrid.innerHTML = "";
    els.pageGrid.classList.remove("edit-mode");
    els.emptyState.hidden = false;
    await clearSavedSession();
    await clearSavedPdf();
  }
  refreshProjectSelect();
  setStatus(`Deleted project "${name}".`, 100);
}

async function startNewProject() {
  if (state.pages.length > 0 && !window.confirm("Start a new project and clear the current workspace?")) return;
  state.currentProjectId = null;
  state.pdfFile = null;
  state.pdf = null;
  state.pages = [];
  state.editingPageNumber = null;
  els.projectName.value = "";
  els.projectSelect.value = "";
  els.pdfInput.value = "";
  els.workspaceTitle.textContent = "No PDF loaded";
  els.pageGrid.innerHTML = "";
  els.pageGrid.classList.remove("edit-mode");
  els.emptyState.hidden = false;
  await clearSavedSession();
  await clearSavedPdf();
  setStatus("New project ready. Choose a PDF to begin.", 0);
}

function projectRecordId(projectId) {
  return `${PROJECT_RECORD_PREFIX}${projectId}`;
}

function projectNameFromPdf(name) {
  return String(name || "Untitled book").replace(/\.pdf$/i, "").trim() || "Untitled book";
}

function restoreTextStyles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TEXT_STYLES_KEY) || "[]");
    state.textStyles = Array.isArray(parsed)
      ? parsed
          .map((style) => ({
            id: String(style.id || crypto.randomUUID()),
            name: String(style.name || "Saved style").trim() || "Saved style",
            values: sanitizeTextStyle(style.values || {}),
          }))
          .filter((style) => Object.keys(style.values).length > 0)
      : [];
  } catch {
    state.textStyles = [];
  }
}

function persistTextStyles() {
  localStorage.setItem(TEXT_STYLES_KEY, JSON.stringify(state.textStyles));
}

function selectedSavedStyle(id) {
  return state.textStyles.find((style) => style.id === id) ?? null;
}

function saveTextStyleFromPrompt(values, fallbackName) {
  const sanitized = sanitizeTextStyle(values);
  if (Object.keys(sanitized).length === 0) {
    setStatus("Nothing to save in this style.");
    return;
  }
  const name = window.prompt("Style name", fallbackName);
  if (!name) return;
  const style = {
    id: crypto.randomUUID(),
    name: name.trim() || fallbackName,
    values: sanitized,
  };
  state.textStyles.push(style);
  persistTextStyles();
  refreshStyleLibraryControls(style.id);
  setStatus(`Saved style "${style.name}".`, 100);
}

function refreshStyleLibraryControls(selectedId = "") {
  if (els.bookStyleSelect) {
    fillSavedStyleSelect(els.bookStyleSelect, selectedId);
  }
  state.pages.forEach(refreshPageCard);
}

function fillSavedStyleSelect(select, selectedId = "", inheritLabel = "Choose saved style") {
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = inheritLabel;
  select.appendChild(placeholder);
  for (const style of state.textStyles) {
    const option = document.createElement("option");
    option.value = style.id;
    option.textContent = style.name;
    select.appendChild(option);
  }
  select.value = selectedId && state.textStyles.some((style) => style.id === selectedId) ? selectedId : "";
}

function fillFontSelect(select, selectedValue = "", inheritLabel = "Inherit") {
  select.innerHTML = "";
  const inherit = document.createElement("option");
  inherit.value = "";
  inherit.textContent = inheritLabel;
  select.appendChild(inherit);
  for (const option of els.fontName.options) {
    const clone = document.createElement("option");
    clone.value = option.value;
    clone.textContent = option.textContent;
    select.appendChild(clone);
  }
  if (selectedValue) ensureSelectOption(select, selectedValue);
  select.value = selectedValue || "";
}

function ensureSelectOption(select, value) {
  if ([...select.options].some((option) => option.value === value)) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  select.appendChild(option);
}

function updateStyleField(style, field, rawValue) {
  const next = { ...(style || {}) };
  const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
  if (value === "" || value === null || value === undefined) {
    delete next[field];
    return sanitizeTextStyle(next);
  }
  next[field] = value;
  return sanitizeTextStyle(next);
}

async function restoreLastPdf() {
  try {
    const saved = await readSavedPdf();
    if (!saved?.blob) return;
    if (state.pdfFile) return;
    state.pdfFile = new File([saved.blob], saved.name || "restored.pdf", {
      type: saved.type || "application/pdf",
      lastModified: saved.lastModified || Date.now(),
    });
    els.workspaceTitle.textContent = state.pdfFile.name;
    setStatus(`Restored ${state.pdfFile.name}. Run Render & OCR when ready.`);
  } catch {
    setStatus("Saved settings restored. Choose a PDF to begin.");
  }
}

async function saveLastPdf(file) {
  const record = {
    id: LAST_PDF_ID,
    name: file.name,
    type: file.type || "application/pdf",
    lastModified: file.lastModified,
    blob: file,
  };
  const db = await openLayerDb();
  await putRecord(db, PDF_STORE, record);
}

async function readSavedPdf() {
  const db = await openLayerDb();
  return getRecord(db, PDF_STORE, LAST_PDF_ID);
}

async function clearSavedPdf() {
  const db = await openLayerDb();
  await deleteRecord(db, PDF_STORE, LAST_PDF_ID);
}

async function restoreLastFont() {
  try {
    const saved = await readSavedFont();
    if (!saved?.blob) return;
    const file = new File([saved.blob], saved.name || "custom-font.ttf", {
      type: saved.type || "font/ttf",
      lastModified: saved.lastModified || Date.now(),
    });
    state.selectedFontBase64 = await fileToBase64(file);
    registerCustomFont(file, { select: readSettings().fontName === CUSTOM_FONT_VALUE });
  } catch {
    state.selectedFontBase64 = null;
  }
}

async function saveLastFont(file) {
  const record = {
    id: LAST_FONT_ID,
    name: file.name,
    type: file.type || "font/ttf",
    lastModified: file.lastModified,
    blob: file,
  };
  const db = await openLayerDb();
  await putRecord(db, PDF_STORE, record);
}

async function readSavedFont() {
  const db = await openLayerDb();
  return getRecord(db, PDF_STORE, LAST_FONT_ID);
}

function scheduleSaveSession() {
  clearTimeout(sessionSaveTimer);
  sessionSaveTimer = setTimeout(() => {
    saveCurrentSession().catch(() => {
      setStatus("Workspace updated, but this browser could not save the session for refresh.");
    });
  }, 500);
}

async function saveCurrentSession(options = {}) {
  const { updateProject = true } = options;
  if (state.pages.length === 0) {
    await clearSavedSession();
    return;
  }
  const record = {
    id: LAST_SESSION_ID,
    savedAt: Date.now(),
    projectId: state.currentProjectId,
    pdfName: state.pdfFile?.name || els.workspaceTitle.textContent || "Restored PDF",
    settings: captureSettings(),
    pages: state.pages.map(serializePageState),
  };
  const db = await openLayerDb();
  await putRecord(db, PDF_STORE, record);
  if (updateProject && state.currentProjectId && state.pdfFile) {
    await saveCurrentProject({ silent: true, allowCreate: false });
  }
}

function serializePageState(page) {
  return {
    pageNumber: page.pageNumber,
    width: page.width,
    height: page.height,
    imageDataUrl: page.imageDataUrl,
    cleanDataUrl: page.cleanDataUrl,
    styleOverride: sanitizeTextStyle(page.styleOverride || {}),
    lines: page.lines.map(serializeLineState),
    ocrStats: page.ocrStats,
    tileStats: page.tileStats,
  };
}

function serializeLineState(line) {
  return {
    id: line.id || `line-${crypto.randomUUID()}`,
    text: String(line.text ?? ""),
    left: clampOptional(Number(line.left), 0, 100, 20),
    top: clampOptional(Number(line.top), 0, 100, 10),
    width: clampOptional(Number(line.width), 1, 100, 60),
    height: clampOptional(Number(line.height), 0.5, 100, 5),
    rawWidth: clampOptional(Number(line.rawWidth), 0.5, 100, Number(line.width) || 60),
    rawHeight: clampOptional(Number(line.rawHeight), 0.5, 100, Number(line.height) || 5),
    rawFontSize: clampOptional(Number(line.rawFontSize), 0.4, 18, Number(line.fontSize) || 4.2),
    fontSize: clampOptional(Number(line.fontSize), 0.4, 18, 4.2),
    confidence: clampOptional(Number(line.confidence), 0, 100, 100),
    color: normalizeColor(line.color, "#a85652"),
    letterSpacing: clampOptional(Number(line.letterSpacing), -0.5, 1.5, 0),
    lineHeight: clampOptional(Number(line.lineHeight), 0.8, 2, 1.05),
    align: normalizeAlign(line.align),
    fontFamily: String(line.fontFamily || fallbackFontName()),
    fontWeight: clampOptional(Number(line.fontWeight), 300, 700, 400),
    textMetrics: line.textMetrics || measureTextQuality(String(line.text ?? "")),
    lightRatio: Number.isFinite(Number(line.lightRatio)) ? Number(line.lightRatio) : 1,
    styleOverride: sanitizeTextStyle(line.styleOverride || {}),
  };
}

async function restoreLastSession() {
  try {
    const saved = await readSavedSession();
    if (!saved?.pages?.length || state.pages.length > 0) return;
    state.pages = saved.pages.map(normalizeSavedPageState).filter(Boolean);
    if (state.pages.length === 0) return;
    if (saved.settings) applySettings(saved.settings);
    state.currentProjectId = saved.projectId || null;
    els.pageGrid.innerHTML = "";
    els.emptyState.hidden = true;
    els.workspaceTitle.textContent = saved.pdfName || state.pdfFile?.name || "Restored workspace";
    const project = state.projects.find((item) => item.id === state.currentProjectId);
    els.projectName.value = project?.name || projectNameFromPdf(saved.pdfName || "");
    refreshProjectSelect();
    for (const page of state.pages) {
      renderPageCard(page);
      refreshPageCard(page);
    }
    setStatus(`Restored ${state.pages.length} saved page${state.pages.length === 1 ? "" : "s"}.`, 100);
  } catch {
    // Session restore is a convenience layer; a bad saved session should not block the app.
  }
}

function normalizeSavedPageState(page) {
  if (!page?.imageDataUrl || !Number.isFinite(Number(page.width)) || !Number.isFinite(Number(page.height))) return null;
  return {
    pageNumber: Number(page.pageNumber) || 1,
    width: Number(page.width),
    height: Number(page.height),
    imageDataUrl: page.imageDataUrl,
    cleanDataUrl: page.cleanDataUrl || page.imageDataUrl,
    styleOverride: sanitizeTextStyle(page.styleOverride || {}),
    lines: Array.isArray(page.lines) ? page.lines.map(serializeLineState) : [],
    ocrStats: page.ocrStats || null,
    tileStats: page.tileStats || null,
  };
}

async function readSavedSession() {
  const db = await openLayerDb();
  return getRecord(db, PDF_STORE, LAST_SESSION_ID);
}

async function clearSavedSession() {
  const db = await openLayerDb();
  await deleteRecord(db, PDF_STORE, LAST_SESSION_ID);
}

function openLayerDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putRecord(db, storeName, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function getRecord(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function loadBundledFont() {
  try {
    const response = await fetch("./assets/MouseMemoirs-Regular.ttf");
    if (!response.ok) return;
    const blob = await response.blob();
    state.bundledFontBase64 = await fileToBase64(blob);
    addFontFace("Mouse Memoirs", `data:font/ttf;base64,${state.bundledFontBase64}`);
  } catch {
    state.bundledFontBase64 = null;
  }
}

function applySelectedFont() {
  const fontName = selectedFontName();
  if (GOOGLE_FONT_OPTIONS.has(fontName)) {
    loadGoogleFont(fontName);
  }
}

function selectedFontName() {
  const value = els.fontName.value.trim();
  if (!value || value === MATCH_BOOK_FONT_VALUE) return MATCH_BOOK_FONT_VALUE;
  return value;
}

function fallbackFontName() {
  return "Mouse Memoirs";
}

function loadGoogleFont(fontName) {
  const id = `google-font-${fontName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replaceAll(" ", "+")}&display=swap`;
  document.head.appendChild(link);
}

function ensureFontOption(fontName) {
  if (!fontName || [...els.fontName.options].some((option) => option.value === fontName)) return;
  const option = document.createElement("option");
  option.value = fontName;
  option.textContent = fontName;
  els.fontName.appendChild(option);
}

function registerCustomFont(file, options = {}) {
  if (state.customFontUrl) URL.revokeObjectURL(state.customFontUrl);
  const url = URL.createObjectURL(file);
  state.customFontUrl = url;
  addFontFace(CUSTOM_FONT_VALUE, url);
  ensureCustomFontOption();
  if (options.select !== false) {
    els.fontName.value = CUSTOM_FONT_VALUE;
    saveSettings();
    state.pages.forEach(refreshPageCard);
  }
  refreshStyleLibraryControls();
}

function ensureCustomFontOption() {
  if ([...els.fontName.options].some((option) => option.value === CUSTOM_FONT_VALUE)) return;
  const option = document.createElement("option");
  option.value = CUSTOM_FONT_VALUE;
  option.textContent = "Custom uploaded font";
  els.fontName.appendChild(option);
}

function addFontFace(fontName, src) {
  const id = `font-face-${fontName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  document.getElementById(id)?.remove();
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @font-face {
      font-family: "${fontName}";
      src: url("${src}");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

function setStatus(message, progress = null) {
  els.status.textContent = message;
  if (progress !== null) {
    els.progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
}

function parsePageRange(value, pageCount) {
  const trimmed = value.trim();
  if (!trimmed || /^all$/i.test(trimmed)) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set();
  for (const part of trimmed.split(",")) {
    const item = part.trim();
    if (!item) continue;
    const range = item.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      for (let page = Math.min(start, end); page <= Math.max(start, end); page += 1) {
        if (page >= 1 && page <= pageCount) pages.add(page);
      }
    } else {
      const page = Number(item);
      if (page >= 1 && page <= pageCount) pages.add(page);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

async function renderAndOcr() {
  if (!state.pdfFile) {
    setStatus("Choose a PDF first.");
    return;
  }
  state.pages = [];
  state.editingPageNumber = null;
  els.pageGrid.innerHTML = "";
  els.pageGrid.classList.remove("edit-mode");
  els.emptyState.hidden = true;

  const bytes = await state.pdfFile.arrayBuffer();
  state.pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages = parsePageRange(els.pageRange.value, state.pdf.numPages);
  setStatus(`Rendering ${pages.length} page${pages.length === 1 ? "" : "s"}...`, 0);

  for (let i = 0; i < pages.length; i += 1) {
    const pageNumber = pages[i];
    const rendered = await renderPdfPage(pageNumber);
    const tileStats = rendered.tileStats;
    const pageState = {
      pageNumber,
      width: rendered.width,
      height: rendered.height,
      imageDataUrl: rendered.dataUrl,
      cleanDataUrl: rendered.dataUrl,
      lines: [],
      ocrStats: null,
      tileStats,
    };
    state.pages.push(pageState);
    renderPageCard(pageState);
    if (tileStats.likelyTiled) {
      setStatus(
        `Page ${pageNumber}: detected ${tileStats.imageOps} image fragments; using stitched full-page background.`,
        (i / pages.length) * 50 + 18,
      );
    }
    setStatus(`OCR page ${pageNumber}...`, (i / pages.length) * 50 + 20);
    let ocr;
    try {
      ocr = await ocrLines(rendered.canvas, pageState.width, pageState.height, pageNumber);
    } catch (error) {
      setStatus(`OCR failed on page ${pageNumber}: ${error.message}`, ((i + 1) / pages.length) * 70);
      return;
    }
    pageState.lines = ocr.lines;
    pageState.ocrStats = ocr.stats;
    if (els.ocrEngine.value === "native" && pageState.lines.length > 0 && cleanupModeUsesLocalRepaint()) {
      setStatus(`Consolidating page ${pageNumber} background from native PDF text...`, ((i + 1) / pages.length) * 65);
      pageState.cleanDataUrl = await locallyRepaintText(pageState);
    }
    refreshPageCard(pageState);
    setStatus(
      `Processed page ${pageNumber} with ${pageState.ocrStats.engine}: kept ${pageState.ocrStats.kept} of ${pageState.ocrStats.total} OCR lines.`,
      ((i + 1) / pages.length) * 70,
    );
  }
  const fontSize = normalizeFontSizes(state.pages);
  state.pages.forEach(refreshPageCard);
  const totals = summarizeOcrStats(state.pages);
  setStatus(
    `Review ${totals.kept} kept OCR lines from ${totals.total}; text size ${fontSize.toFixed(1)}.`,
    100,
  );
  scheduleSaveSession();
}

async function renderPdfPage(pageNumber) {
  const page = await state.pdf.getPage(pageNumber);
  const tileStats = await detectImageTiling(page);
  const viewport = page.getViewport({ scale: 1 });
  const targetMax = 2048;
  const scale = targetMax / Math.max(viewport.width, viewport.height);
  const scaled = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = Math.round(scaled.width);
  canvas.height = Math.round(scaled.height);
  await page.render({ canvasContext: context, viewport: scaled }).promise;
  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL("image/png"),
    tileStats,
  };
}

async function detectImageTiling(page) {
  const tileMode = els.tileMode.value || "none";
  if (tileMode === "none") {
    return { imageOps: 0, imageRuns: 0, maxImageRun: 0, detectedTiling: false, likelyTiled: false, forced: false };
  }
  if (tileMode === "force") {
    return { imageOps: 0, imageRuns: 0, maxImageRun: 0, detectedTiling: true, likelyTiled: true, forced: true };
  }
  const opList = await page.getOperatorList();
  const imageOps = new Set(
    [
      pdfjsLib.OPS.paintImageXObject,
      pdfjsLib.OPS.paintImageXObjectRepeat,
      pdfjsLib.OPS.paintInlineImageXObject,
      pdfjsLib.OPS.paintInlineImageXObjectGroup,
      pdfjsLib.OPS.paintImageMaskXObject,
      pdfjsLib.OPS.paintImageMaskXObjectGroup,
      pdfjsLib.OPS.paintImageMaskXObjectRepeat,
      pdfjsLib.OPS.paintSolidColorImageMask,
    ].filter(Number.isFinite),
  );
  let imageCount = 0;
  let imageRuns = 0;
  let run = 0;
  let maxImageRun = 0;
  for (const fn of opList.fnArray) {
    if (imageOps.has(fn)) {
      imageCount += 1;
      run += 1;
      maxImageRun = Math.max(maxImageRun, run);
    } else {
      if (run > 0) imageRuns += 1;
      run = 0;
    }
  }
  if (run > 0) imageRuns += 1;
  const detectedTiling = imageCount >= 24 || maxImageRun >= 8;
  return {
    imageOps: imageCount,
    imageRuns,
    maxImageRun,
    detectedTiling,
    likelyTiled: tileMode !== "detect" && detectedTiling,
    forced: false,
  };
}

async function ocrLines(canvas, width, height, pageNumber) {
  if (els.ocrEngine.value === "native") {
    return nativePdfTextLines(pageNumber, width, height);
  }
  if (els.ocrEngine.value === "gemini") {
    return geminiOcrLines(canvas, width, height);
  }
  return tesseractOcrLines(canvas, width, height);
}

async function nativePdfTextLines(pageNumber, width, height) {
  const page = await state.pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale = width / viewport.width;
  const scaled = page.getViewport({ scale });
  const content = await page.getTextContent({ includeMarkedContent: true });
  const textStyle = currentTextStyle();
  const items = content.items
    .map((item, index) => nativeTextItemToLine(item, index, scaled, width, height, textStyle, scale, content.styles))
    .filter(Boolean);
  const dedupedItems = dedupeNativeItems(items);
  const lines = mergeNativeTextItems(dedupedItems);
  return {
    lines,
    stats: {
      total: content.items.length,
      kept: lines.length,
      rejected: content.items.length - dedupedItems.length,
      engine: "PDF text",
      minConfidence: null,
    },
  };
}

function nativeTextItemToLine(item, index, viewport, width, height, textStyle, scale, styles) {
  const text = repairPairDuplicatedText(String(item.str ?? "").replace(/\s+/g, " ").trim());
  if (!text) return null;
  const fontFamily = matchPdfFontFamily(item, styles);
  const fontWeight = matchPdfFontWeight(item, styles);
  const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
  const fontHeight = Math.max(1, Math.hypot(transform[2], transform[3]));
  const itemWidth = Math.max(1, (Number(item.width) || 0) * scale);
  const x = transform[4];
  const y = transform[5] - fontHeight;
  const left = (x / width) * 100;
  const top = (y / height) * 100;
  const w = (itemWidth / width) * 100;
  const h = (fontHeight / height) * 100;
  if (left > 101 || top > 101 || left + w < -1 || top + h < -1) return null;
  return {
    id: `native-line-${index + 1}`,
    text,
    left: clamp(left, 0, 100),
    top: clamp(top, 0, 100),
    width: Math.max(1, w),
    height: Math.max(1.2, h),
    rawWidth: Math.max(1, w),
    rawHeight: Math.max(1.2, h),
    rawFontSize: clamp(h * 0.92, 1.4, 5.2),
    fontSize: clamp(h * 0.92, 1.4, 5.2),
    confidence: 100,
    textMetrics: measureTextQuality(text),
    lightRatio: 1,
    color: textStyle.color,
    letterSpacing: textStyle.letterSpacing,
    lineHeight: textStyle.lineHeight,
    align: textStyle.align,
    fontFamily,
    fontWeight,
  };
}

function matchPdfFontFamily(item, styles) {
  const style = styles?.[item.fontName] ?? {};
  const candidates = [item.fontName, style.fontFamily]
    .filter(Boolean)
    .map(cleanPdfFontName)
    .filter(isUsefulPdfFontName);
  for (const candidate of candidates) {
    const normalized = normalizeFontKey(candidate);
    const match = BOOK_FONT_MATCHES.find(([needle]) => normalized.includes(needle));
    if (match) {
      loadGoogleFont(match[1]);
      return match[1];
    }
  }
  return candidates[0] ?? null;
}

function cleanPdfFontName(name) {
  return String(name)
    .replace(/^["']|["']$/g, "")
    .replace(/^[A-Z]{6}\+/, "")
    .replace(/[-_](Regular|Roman|Book|Bold|SemiBold|Medium|Light|Italic|Oblique|Black|ExtraBold)$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function normalizeFontKey(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isUsefulPdfFontName(name) {
  const normalized = normalizeFontKey(name);
  if (!normalized) return false;
  if (["sansserif", "serif", "monospace"].includes(normalized)) return false;
  if (/^gd\d+f\d+$/.test(normalized)) return false;
  return true;
}

function matchPdfFontWeight(item, styles) {
  const style = styles?.[item.fontName] ?? {};
  const candidates = [style.fontFamily, item.fontName].filter(Boolean).join(" ");
  if (/extra\s*bold|black|heavy|bold/i.test(candidates)) return 700;
  if (/semi\s*bold|demi\s*bold|medium/i.test(candidates)) return 600;
  if (/light|thin/i.test(candidates)) return 300;
  return 400;
}

function repairPairDuplicatedText(text) {
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (token.trim() === "" || token.length < 4 || token.length % 2 !== 0) return token;
      let paired = 0;
      for (let index = 0; index < token.length; index += 2) {
        if (token[index] === token[index + 1]) paired += 1;
      }
      if (paired / (token.length / 2) < 0.85) return token;
      let repaired = "";
      for (let index = 0; index < token.length; index += 2) {
        repaired += token[index];
      }
      return repaired;
    })
    .join("");
}

function dedupeNativeItems(items) {
  const kept = [];
  for (const item of items) {
    const duplicate = kept.some(
      (other) =>
        other.text === item.text &&
        Math.abs(other.left - item.left) < 0.35 &&
        Math.abs(other.top - item.top) < 0.35 &&
        overlapRatio(other, item) > 0.65,
    );
    if (!duplicate) kept.push(item);
  }
  return kept;
}

function overlapRatio(a, b) {
  const ax1 = a.left + a.width;
  const ay1 = a.top + a.height;
  const bx1 = b.left + b.width;
  const by1 = b.top + b.height;
  const overlapWidth = Math.max(0, Math.min(ax1, bx1) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(ay1, by1) - Math.max(a.top, b.top));
  const overlap = overlapWidth * overlapHeight;
  const minArea = Math.min(a.width * a.height, b.width * b.height);
  return minArea > 0 ? overlap / minArea : 0;
}

function mergeNativeTextItems(items) {
  const sorted = [...items].sort((a, b) => a.top - b.top || a.left - b.left);
  const rows = [];
  for (const item of sorted) {
    const row = rows.find((candidate) => Math.abs(candidate.top - item.top) < Math.max(0.45, item.height * 0.45));
    if (row) {
      row.items.push(item);
      row.top = Math.min(row.top, item.top);
      row.bottom = Math.max(row.bottom, item.top + item.height);
    } else {
      rows.push({ top: item.top, bottom: item.top + item.height, items: [item] });
    }
  }
  return rows.flatMap((row, rowIndex) => {
    const rowItems = row.items.sort((a, b) => a.left - b.left);
    const groups = [];
    for (const item of rowItems) {
      const current = groups[groups.length - 1];
      const gap = current ? item.left - (current.left + current.width) : 0;
      if (
        current &&
        current.fontFamily === item.fontFamily &&
        current.fontWeight === item.fontWeight &&
        gap < Math.max(1.6, item.height * 0.9)
      ) {
        current.text = `${current.text} ${item.text}`.replace(/\s+/g, " ").trim();
        const right = Math.max(current.left + current.width, item.left + item.width);
        current.left = Math.min(current.left, item.left);
        current.top = Math.min(current.top, item.top);
        current.width = right - current.left;
        current.height = Math.max(current.height, item.height);
        current.rawWidth = current.width;
        current.rawHeight = current.height;
        current.rawFontSize = median([current.rawFontSize, item.rawFontSize]);
        current.fontSize = current.rawFontSize;
      } else {
        groups.push({ ...item, id: `native-line-${rowIndex + 1}-${groups.length + 1}` });
      }
    }
    return groups;
  });
}

async function tesseractOcrLines(canvas, width, height) {
  const lang = els.ocrLang.value.trim() || "sqi";
  const settings = getOcrSettings();
  const textStyle = currentTextStyle();
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(0, 0, width, height);
  const result = await Tesseract.recognize(canvas, lang);
  const rawLines = result.data.lines ?? [];
  const candidates = rawLines
    .map((line, index) => {
      const text = (line.text ?? "").replace(/\s+/g, " ").trim();
      const box = line.bbox;
      if (!text || !box) return null;
      const left = (box.x0 / width) * 100;
      const top = (box.y0 / height) * 100;
      const w = ((box.x1 - box.x0) / width) * 100;
      const h = ((box.y1 - box.y0) / height) * 100;
      const confidence = Number.isFinite(Number(line.confidence)) ? Number(line.confidence) : 100;
      const textMetrics = measureTextQuality(text);
      const lightRatio = sampleLightRatio(imageData, width, height, box);
      return {
        id: `line-${index + 1}`,
        text,
        left,
        top,
        width: Math.max(5, w),
        height: Math.max(2.4, h),
        rawWidth: w,
        rawHeight: h,
        rawFontSize: clamp(h * 0.92, 2.2, 5.2),
        fontSize: clamp(h * 0.92, 2.2, 5.2),
        confidence,
        textMetrics,
        lightRatio,
        color: textStyle.color,
        letterSpacing: textStyle.letterSpacing,
        lineHeight: textStyle.lineHeight,
        align: textStyle.align,
        fontFamily: fallbackFontName(),
        fontWeight: 400,
      };
    })
    .filter(Boolean);
  const lines = candidates.filter((line) => shouldKeepOcrLine(line, settings));
  return {
    lines,
    stats: {
      total: rawLines.length,
      kept: lines.length,
      rejected: rawLines.length - lines.length,
      engine: "Tesseract",
      minConfidence: settings.minConfidence,
    },
  };
}

async function geminiOcrLines(canvas, width, height) {
  const apiKey = els.geminiApiKey.value.trim();
  if (!apiKey) {
    throw new Error("enter a Gemini API key or switch OCR engine back to Tesseract.");
  }
  const model = els.geminiModel.value.trim() || "gemini-3.5-flash";
  const imageData = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      input: [
        { type: "text", text: geminiOcrPrompt() },
        {
          type: "image",
          data: imageData,
          mime_type: "image/jpeg",
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: geminiOcrSchema(),
      },
    }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini OCR failed: ${message}`);
  }
  const json = await response.json();
  const payload = parseJsonResponse(readGeminiOutputText(json));
  const rawLines = Array.isArray(payload.lines) ? payload.lines : [];
  const lines = rawLines
    .map((line, index) => geminiLineToOverlay(line, index))
    .filter(Boolean);
  return {
    lines,
    stats: {
      total: rawLines.length,
      kept: lines.length,
      rejected: rawLines.length - lines.length,
      engine: "Gemini",
      minConfidence: null,
    },
  };
}

function geminiOcrPrompt() {
  const language = els.ocrLang.value.trim() || "sqi";
  return `You are an OCR engine for illustrated children's storybook pages.

Return JSON only. Detect only visible story text intended for reading aloud.
Preserve the original language and diacritics exactly. The requested OCR language code is "${language}".
Do not translate, summarize, correct, or invent missing text.
Ignore page numbers, decorative marks, illustration line art, rain/snow/texture, character clothing, background details, and uncertain guesses.
Merge words that belong to the same visual line. Do not split a single line into individual words.
For each detected story text line, return:
- text: exact visible text
- box_2d: [ymin, xmin, ymax, xmax] tightly around the printed characters, normalized from 0 to 1000
- confidence: number from 0 to 100
If there is no story text, return {"lines":[]}.`;
}

function geminiOcrSchema() {
  return {
    type: "object",
    properties: {
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            box_2d: {
              type: "array",
              items: { type: "number" },
            },
            confidence: { type: "number" },
          },
          required: ["text", "box_2d"],
        },
      },
    },
    required: ["lines"],
  };
}

function geminiLineToOverlay(line, index) {
  const text = String(line.text ?? "").replace(/\s+/g, " ").trim();
  const box = Array.isArray(line.box_2d) ? line.box_2d.map(Number) : null;
  if (!text || !box || box.length !== 4 || box.some((value) => !Number.isFinite(value))) return null;
  const [ymin, xmin, ymax, xmax] = box.map((value) => clamp(value, 0, 1000));
  const left = xmin / 10;
  const top = ymin / 10;
  const w = Math.max(5, (xmax - xmin) / 10);
  const h = Math.max(2.4, (ymax - ymin) / 10);
  const confidenceValue = Number(line.confidence);
  const confidence = Number.isFinite(confidenceValue)
    ? clamp(confidenceValue <= 1 ? confidenceValue * 100 : confidenceValue, 0, 100)
    : 90;
  const textMetrics = measureTextQuality(text);
  const textStyle = currentTextStyle();
  if (textMetrics.letters < 2) return null;
  if (w > 95 || h > 14) return null;
  return {
    id: `gemini-line-${index + 1}`,
    text,
    left,
    top,
    width: w,
    height: h,
    rawWidth: w,
    rawHeight: h,
    rawFontSize: clamp(h * 0.92, 2.2, 5.2),
    fontSize: clamp(h * 0.92, 2.2, 5.2),
    confidence,
    textMetrics,
    lightRatio: 1,
    color: textStyle.color,
    letterSpacing: textStyle.letterSpacing,
    lineHeight: textStyle.lineHeight,
    align: textStyle.align,
    fontFamily: fallbackFontName(),
    fontWeight: 400,
  };
}

function readGeminiOutputText(json) {
  if (typeof json.output_text === "string") return json.output_text;
  if (typeof json.outputText === "string") return json.outputText;
  const stepText = readGeminiStepText(json);
  if (stepText) return stepText;
  const candidateText = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");
  if (candidateText) return candidateText;
  throw new Error(`Gemini response did not include output text. Response keys: ${Object.keys(json).join(", ")}`);
}

function readGeminiStepText(json) {
  const steps = Array.isArray(json.steps) ? json.steps : [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    const text =
      readContentText(step?.content) ||
      readContentText(step?.modelOutput?.content) ||
      readContentText(step?.model_output?.content);
    if (text) return text;
  }
  return "";
}

function readContentText(content) {
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part?.text === "string") return part.text;
      if (typeof part?.text?.text === "string") return part.text.text;
      if (typeof part?.text?.value === "string") return part.text.value;
      return "";
    })
    .join("")
    .trim();
}

function parseJsonResponse(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return {};
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Gemini returned non-JSON OCR output: ${jsonText.slice(0, 220)}`);
  }
}

function getOcrSettings() {
  const confidenceValue = Number(els.minConfidence.value);
  return {
    minConfidence: Number.isFinite(confidenceValue) ? clamp(confidenceValue, 0, 100) : 55,
    requireLightArea: els.requireLightArea.checked,
  };
}

function shouldKeepOcrLine(line, settings) {
  const { letters, glyphs, letterRatio } = line.textMetrics;
  const textLike = letters >= 5 && letterRatio >= 0.55;
  if (line.confidence < settings.minConfidence) return false;
  if (letters < 2 || glyphs < 2) return false;
  if (glyphs <= 3 && line.confidence < Math.max(settings.minConfidence, 72)) return false;
  if (letterRatio < 0.45 && letters < 8) return false;
  if (line.rawWidth < 2 || line.rawHeight < 0.65) return false;
  if (line.rawHeight > 11.5 || line.rawWidth > 94) return false;
  if (settings.requireLightArea && line.lightRatio < 0.03 && (!textLike || line.confidence < 65)) {
    return false;
  }
  return true;
}

function measureTextQuality(text) {
  const compact = text.replace(/\s+/g, "");
  const glyphs = [...compact].length;
  const letters = (compact.match(/\p{L}/gu) ?? []).length;
  const digits = (compact.match(/\p{N}/gu) ?? []).length;
  return {
    glyphs,
    letters,
    digits,
    letterRatio: glyphs === 0 ? 0 : letters / glyphs,
  };
}

function sampleLightRatio(imageData, width, height, box) {
  const padX = width * 0.014;
  const padY = height * 0.012;
  const x0 = clamp(Math.floor(box.x0 - padX), 0, width - 1);
  const y0 = clamp(Math.floor(box.y0 - padY), 0, height - 1);
  const x1 = clamp(Math.ceil(box.x1 + padX), x0 + 1, width);
  const y1 = clamp(Math.ceil(box.y1 + padY), y0 + 1, height);
  const columns = 14;
  const rows = 8;
  let light = 0;
  let samples = 0;
  for (let row = 0; row < rows; row += 1) {
    const y = Math.floor(y0 + ((y1 - y0) * (row + 0.5)) / rows);
    for (let column = 0; column < columns; column += 1) {
      const x = Math.floor(x0 + ((x1 - x0) * (column + 0.5)) / columns);
      const offset = (y * width + x) * 4;
      const r = imageData.data[offset];
      const g = imageData.data[offset + 1];
      const b = imageData.data[offset + 2];
      const brightness = (r + g + b) / 3;
      const colorSpread = Math.max(r, g, b) - Math.min(r, g, b);
      if (brightness > 222 && colorSpread < 58) light += 1;
      samples += 1;
    }
  }
  return samples === 0 ? 0 : light / samples;
}

function normalizeFontSizes(pages) {
  const override = parseOptionalNumber(els.fontSizeOverride.value);
  const detectedSizes = pages
    .flatMap((page) => page.lines)
    .map((line) => line.rawFontSize)
    .filter((value) => Number.isFinite(value) && value > 0);
  const fontSize = override ?? clamp(median(detectedSizes) ?? 3.6, 2.4, 4.8);
  for (const page of pages) {
    for (const line of page.lines) {
      line.fontSize = fontSize;
      line.height = singleLineStoredHeight(line);
      applyTextStyleToLine(line);
    }
  }
  return fontSize;
}

function currentTextStyle() {
  const style = currentBookStyle();
  return {
    color: style.color,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    align: style.align,
  };
}

function currentBookStyle() {
  return sanitizeTextStyle({
    fontName: selectedFontName(),
    color: normalizeColor(els.textColor.value, "#a85652"),
    fontSize: parseOptionalNumber(els.fontSizeOverride.value),
    letterSpacing: clampOptional(Number(els.letterSpacing.value), -0.5, 1.5, 0),
    lineHeight: clampOptional(Number(els.lineHeight.value), 0.8, 2, 1.05),
    align: normalizeAlign(els.textAlign.value),
  });
}

function applyTextStyleToPages() {
  for (const page of state.pages) {
    for (const line of page.lines) {
      applyTextStyleToLine(line);
    }
  }
}

function applyTextStyleToLine(line) {
  const style = currentTextStyle();
  line.color = style.color;
  line.letterSpacing = style.letterSpacing;
  line.lineHeight = style.lineHeight;
  line.align = style.align;
  line.height = singleLineStoredHeight(line);
}

function sanitizeTextStyle(style) {
  const result = {};
  if (!style || typeof style !== "object") return result;
  if (typeof style.fontName === "string" && style.fontName.trim()) {
    result.fontName = style.fontName.trim();
  }
  if (typeof style.color === "string" && /^#[0-9a-f]{6}$/i.test(style.color)) {
    result.color = style.color;
  }
  const fontSize = Number(style.fontSize);
  if (Number.isFinite(fontSize) && fontSize > 0) {
    result.fontSize = clamp(fontSize, 0.4, 18);
  }
  const letterSpacing = Number(style.letterSpacing);
  if (Number.isFinite(letterSpacing)) {
    result.letterSpacing = clamp(letterSpacing, -0.5, 1.5);
  }
  const lineHeight = Number(style.lineHeight);
  if (Number.isFinite(lineHeight)) {
    result.lineHeight = clamp(lineHeight, 0.8, 2);
  }
  const fontWeight = Number(style.fontWeight);
  if (Number.isFinite(fontWeight)) {
    result.fontWeight = clamp(fontWeight, 300, 700);
  }
  if (style.align !== undefined) {
    result.align = normalizeAlign(style.align);
  }
  return result;
}

function mergeTextStyles(...styles) {
  const merged = {};
  for (const style of styles) {
    const sanitized = sanitizeTextStyle(style);
    for (const field of TEXT_STYLE_FIELDS) {
      if (sanitized[field] !== undefined) merged[field] = sanitized[field];
    }
  }
  return merged;
}

function effectivePageStyle(page) {
  return mergeTextStyles(currentBookStyle(), page?.styleOverride);
}

function effectiveLineStyle(page, line) {
  const bookStyle = currentBookStyle();
  const lineBase = {
    fontName: bookStyle.fontName,
    color: line?.color,
    fontSize: line?.fontSize,
    letterSpacing: line?.letterSpacing,
    lineHeight: line?.lineHeight,
    fontWeight: line?.fontWeight,
    align: line?.align,
  };
  const merged = mergeTextStyles(lineBase, page?.styleOverride, line?.styleOverride);
  if (!merged.fontName || merged.fontName === MATCH_BOOK_FONT_VALUE) {
    merged.fontName = line?.fontFamily || fallbackFontName();
  }
  if (!merged.color) merged.color = normalizeColor(line?.color, "#a85652");
  if (!Number.isFinite(merged.fontSize)) merged.fontSize = line?.fontSize ?? 3.6;
  if (!Number.isFinite(merged.letterSpacing)) merged.letterSpacing = line?.letterSpacing ?? 0;
  if (!Number.isFinite(merged.lineHeight)) merged.lineHeight = line?.lineHeight ?? 1.05;
  if (!Number.isFinite(merged.fontWeight)) merged.fontWeight = line?.fontWeight ?? 400;
  if (!merged.align) merged.align = line?.align || "center";
  return merged;
}

function applyStyleToBook(style) {
  const sanitized = sanitizeTextStyle(style);
  if (sanitized.fontName) {
    ensureFontOption(sanitized.fontName);
    els.fontName.value = sanitized.fontName;
  }
  if (sanitized.color) els.textColor.value = sanitized.color;
  if (sanitized.fontSize !== undefined) els.fontSizeOverride.value = sanitized.fontSize.toFixed(1);
  if (sanitized.letterSpacing !== undefined) els.letterSpacing.value = String(sanitized.letterSpacing);
  if (sanitized.lineHeight !== undefined) els.lineHeight.value = String(sanitized.lineHeight);
  if (sanitized.align !== undefined) els.textAlign.value = sanitized.align;
  saveSettings();
  applySelectedFont();
  if (state.pages.length > 0) {
    normalizeFontSizes(state.pages);
    applyTextStyleToPages();
    state.pages.forEach(refreshPageCard);
  }
  scheduleSaveSession();
  setStatus("Applied saved style to the book.", 100);
}

function applyStyleToPage(page, style) {
  page.styleOverride = sanitizeTextStyle(style);
  maybeLoadStyleFont(page.styleOverride);
  refreshPageCard(page);
  scheduleSaveSession();
}

function applyStyleToLine(page, line, style) {
  line.styleOverride = sanitizeTextStyle(style);
  maybeLoadStyleFont(line.styleOverride);
  refreshPageCard(page);
  scheduleSaveSession();
}

function maybeLoadStyleFont(style) {
  if (GOOGLE_FONT_OPTIONS.has(style?.fontName)) {
    loadGoogleFont(style.fontName);
  }
}

function summarizeOcrStats(pages) {
  return pages.reduce(
    (totals, page) => {
      totals.total += page.ocrStats?.total ?? 0;
      totals.kept += page.ocrStats?.kept ?? 0;
      return totals;
    },
    { total: 0, kept: 0 },
  );
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function parseOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function clampOptional(value, min, max, fallback) {
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function normalizeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function normalizeAlign(value) {
  return ["left", "center", "right"].includes(value) ? value : "center";
}

function defaultLine() {
  const textStyle = currentTextStyle();
  return {
    id: `line-${crypto.randomUUID()}`,
    text: "New text",
    left: 20,
    top: 10,
    width: 60,
    height: 5,
    rawHeight: 5,
    rawFontSize: 4.2,
    fontSize: 4.2,
    confidence: 100,
    color: textStyle.color,
    letterSpacing: textStyle.letterSpacing,
    lineHeight: textStyle.lineHeight,
    align: textStyle.align,
    fontFamily: fallbackFontName(),
    fontWeight: 400,
  };
}

function renderPageCard(pageState) {
  const node = els.pageTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.page = String(pageState.pageNumber);
  applyPageAspectRatio(node, pageState);
  node.querySelector(".page-title").textContent = `Page ${pageState.pageNumber}`;
  node.querySelector(".page-image").src = pageState.cleanDataUrl;
  node.querySelector(".page-image").alt = `Page ${pageState.pageNumber}`;
  node.querySelector(".page-shortcuts").addEventListener("change", (event) => {
    const action = event.target.value;
    event.target.value = "";
    handlePageShortcut(pageState, action);
  });
  node.querySelector(".exit-edit").addEventListener("click", () => setPageEditMode(null));
  els.pageGrid.appendChild(node);
  updatePageEditModeUi();
}

function handlePageShortcut(pageState, action) {
  if (!action) return;
  if (action === "edit") {
    setPageEditMode(pageState);
    return;
  }
  if (action === "addText") {
    pageState.lines.push(defaultLine());
    refreshPageCard(pageState);
    setPageEditMode(pageState);
    scheduleSaveSession();
    return;
  }
  if (action === "restoreOriginal") {
    pageState.cleanDataUrl = pageState.imageDataUrl;
    refreshPageCard(pageState);
    scheduleSaveSession();
    setStatus(`Restored original image for page ${pageState.pageNumber}.`, 100);
    return;
  }
  if (action === "removeText") {
    cleanPages([pageState]);
  }
}

function setPageEditMode(pageState) {
  state.editingPageNumber = pageState?.pageNumber ?? null;
  updatePageEditModeUi();
  if (pageState) {
    pageCard(pageState)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus(`Editing page ${pageState.pageNumber}. Use Done to return to all pages.`, 100);
  } else {
    setStatus("Returned to page thumbnails.", 100);
  }
}

function updatePageEditModeUi() {
  const editingPageNumber = state.editingPageNumber;
  els.pageGrid.classList.toggle("edit-mode", editingPageNumber !== null);
  for (const page of state.pages) {
    const node = pageCard(page);
    if (!node) continue;
    const isEditing = page.pageNumber === editingPageNumber;
    node.hidden = editingPageNumber !== null && !isEditing;
    node.classList.toggle("is-editing", isEditing);
    const doneButton = node.querySelector(".exit-edit");
    if (doneButton) doneButton.hidden = !isEditing;
    const details = node.querySelector("details");
    if (details && isEditing) details.open = true;
  }
}

function refreshPageCard(pageState) {
  const node = pageCard(pageState);
  if (!node) return;
  const title = node.querySelector(".page-title");
  const tileLabel = pageState.tileStats?.detectedTiling
    ? ` · ${pageState.tileStats.likelyTiled ? "stitched" : "detected"} ${
        pageState.tileStats.forced ? "full page" : `${pageState.tileStats.imageOps} tiles`
      }`
    : "";
  if (pageState.ocrStats) {
    title.textContent = `Page ${pageState.pageNumber}${tileLabel} · ${pageState.ocrStats.engine} ${pageState.ocrStats.kept}/${pageState.ocrStats.total}`;
  } else {
    title.textContent = `Page ${pageState.pageNumber}${tileLabel}`;
  }
  node.querySelector("summary").textContent = `Text boxes (${pageState.lines.length})`;
  applyPageAspectRatio(node, pageState);
  node.querySelector(".page-image").src = pageState.cleanDataUrl;
  renderPageStylePanel(pageState, node);
  const overlay = node.querySelector(".overlay-layer");
  overlay.innerHTML = "";
  for (const line of pageState.lines) {
    const box = document.createElement("div");
    box.className = "text-box";
    box.contentEditable = "true";
    box.spellcheck = false;
    box.textContent = line.text;
    applyLineStyle(box, line, pageState);
    box.addEventListener("keydown", (event) => {
      if (event.key === "Enter") event.preventDefault();
    });
    box.addEventListener("input", () => {
      const oneLineText = box.textContent.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
      if (box.textContent !== oneLineText) box.textContent = oneLineText;
      line.text = oneLineText;
      updateLineList(pageState);
      scheduleSaveSession();
    });
    makeDraggable(box, line, pageState);
    overlay.appendChild(box);
  }
  updateLineList(pageState);
  updatePageEditModeUi();
}

function applyPageAspectRatio(node, pageState) {
  const preview = node.querySelector(".page-preview");
  if (!preview) return;
  const width = Number(pageState.width);
  const height = Number(pageState.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
  preview.style.setProperty("--page-aspect-ratio", `${width} / ${height}`);
  preview.style.setProperty("--page-aspect-ratio-number", String(width / height));
}

function renderPageStylePanel(pageState, node) {
  const panel = node.querySelector(".page-style-panel");
  const override = pageState.styleOverride || {};
  const effective = effectivePageStyle(pageState);
  panel.innerHTML = `
    <div class="style-panel-heading">
      <strong>Page style</strong>
      <span>${Object.keys(override).length > 0 ? "override active" : "inherits book style"}</span>
    </div>
    <div class="style-actions">
      <select class="page-saved-style" aria-label="Saved page style"></select>
      <button class="small apply-page-style">Apply</button>
      <button class="small capture-page-style">Use Book</button>
      <button class="small save-page-style">Save</button>
      <button class="small reset-page-style">Reset</button>
    </div>
    <div class="style-grid">
      <label class="field">
        <span>Font</span>
        <select class="page-font"></select>
      </label>
      <label class="field">
        <span>Color</span>
        <input class="page-color" type="color" value="${escapeAttr(override.color || effective.color || "#a85652")}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      </label>
      <label class="field">
        <span>Size</span>
        <input class="page-size" type="number" min="0" max="18" step="0.1" placeholder="Inherit" value="${override.fontSize ?? ""}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      </label>
      <label class="field">
        <span>Kerning</span>
        <input class="page-spacing" type="number" min="-0.5" max="1.5" step="0.01" placeholder="Inherit" value="${override.letterSpacing ?? ""}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      </label>
      <label class="field">
        <span>Line height</span>
        <input class="page-line-height" type="number" min="0.8" max="2" step="0.05" placeholder="Inherit" value="${override.lineHeight ?? ""}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      </label>
      <label class="field">
        <span>Align</span>
        <select class="page-align">
          <option value="">Inherit</option>
          <option value="left"${override.align === "left" ? " selected" : ""}>Left</option>
          <option value="center"${override.align === "center" ? " selected" : ""}>Center</option>
          <option value="right"${override.align === "right" ? " selected" : ""}>Right</option>
        </select>
      </label>
    </div>
  `;

  const savedSelect = panel.querySelector(".page-saved-style");
  fillSavedStyleSelect(savedSelect);
  const fontSelect = panel.querySelector(".page-font");
  fillFontSelect(fontSelect, override.fontName || "", "Inherit book font");

  panel.querySelector(".apply-page-style").addEventListener("click", () => {
    const style = selectedSavedStyle(savedSelect.value);
    if (!style) return;
    applyStyleToPage(pageState, style.values);
  });
  panel.querySelector(".capture-page-style").addEventListener("click", () => {
    applyStyleToPage(pageState, currentBookStyle());
  });
  panel.querySelector(".save-page-style").addEventListener("click", () => {
    saveTextStyleFromPrompt(effectivePageStyle(pageState), `Page ${pageState.pageNumber} style`);
  });
  panel.querySelector(".reset-page-style").addEventListener("click", () => {
    pageState.styleOverride = {};
    refreshPageCard(pageState);
    scheduleSaveSession();
  });

  fontSelect.addEventListener("change", () => {
    updatePageStyleOverride(pageState, "fontName", fontSelect.value);
  });
  panel.querySelector(".page-color").addEventListener("input", (event) => {
    updatePageStyleOverride(pageState, "color", event.target.value);
  });
  panel.querySelector(".page-size").addEventListener("change", (event) => {
    updatePageStyleOverride(pageState, "fontSize", event.target.value);
  });
  panel.querySelector(".page-spacing").addEventListener("change", (event) => {
    updatePageStyleOverride(pageState, "letterSpacing", event.target.value);
  });
  panel.querySelector(".page-line-height").addEventListener("change", (event) => {
    updatePageStyleOverride(pageState, "lineHeight", event.target.value);
  });
  panel.querySelector(".page-align").addEventListener("change", (event) => {
    updatePageStyleOverride(pageState, "align", event.target.value);
  });
}

function updatePageStyleOverride(pageState, field, value) {
  pageState.styleOverride = updateStyleField(pageState.styleOverride || {}, field, value);
  maybeLoadStyleFont(pageState.styleOverride);
  refreshPageCard(pageState);
  scheduleSaveSession();
}

function pageCard(pageState) {
  return els.pageGrid.querySelector(`[data-page="${pageState.pageNumber}"]`);
}

function applyLineStyle(box, line, pageState) {
  const style = effectiveLineStyle(pageState, line);
  box.style.left = `${line.left}%`;
  box.style.top = `${line.top}%`;
  box.style.width = `${line.width}%`;
  box.style.height = `${effectiveLineBoxHeight(line, style, pageState)}%`;
  box.style.fontSize = `${style.fontSize}cqw`;
  box.style.color = style.color;
  box.style.letterSpacing = `${style.letterSpacing ?? 0}cqw`;
  box.style.lineHeight = String(style.lineHeight ?? 1.05);
  box.style.textAlign = style.align;
  box.style.fontFamily = selectedFontCssStack(style.fontName);
  box.style.fontWeight = String(style.fontWeight);
}

function effectiveLineBoxHeight(line, style, pageState) {
  const detectedHeight = singleLineStoredHeight(line);
  const aspect = pageState && pageState.height > 0 ? pageState.width / pageState.height : 1;
  const fontSize = Number(style.fontSize ?? line.fontSize ?? line.rawFontSize);
  const lineHeight = Number(style.lineHeight ?? line.lineHeight ?? 1.05);
  const fontLineHeight = Number.isFinite(fontSize) ? fontSize * aspect * clamp(lineHeight, 0.8, 1.15) : 0;
  return clamp(Math.max(detectedHeight, fontLineHeight), 0.4, 24);
}

function singleLineStoredHeight(line) {
  const rawHeight = Number(line.rawHeight);
  const currentHeight = Number(line.height);
  const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : currentHeight;
  return clamp(Number.isFinite(height) ? height : 2.4, 0.4, 100);
}

function selectedFontCssStack(fontName = selectedFontName()) {
  if (fontName === "system-ui") return "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  return `"${fontName.replaceAll('"', '\\"')}", "Comic Sans MS", sans-serif`;
}

function makeDraggable(box, line, pageState) {
  let start = null;
  box.addEventListener("pointerdown", (event) => {
    if (event.detail > 1) return;
    start = {
      x: event.clientX,
      y: event.clientY,
      left: line.left,
      top: line.top,
      rect: box.parentElement.getBoundingClientRect(),
    };
    box.setPointerCapture(event.pointerId);
  });
  box.addEventListener("pointermove", (event) => {
    if (!start) return;
    const dx = ((event.clientX - start.x) / start.rect.width) * 100;
    const dy = ((event.clientY - start.y) / start.rect.height) * 100;
    line.left = clamp(start.left + dx, 0, 100 - line.width);
    line.top = clamp(start.top + dy, 0, 100 - line.height);
    applyLineStyle(box, line, pageState);
  });
  box.addEventListener("pointerup", () => {
    if (!start) return;
    start = null;
    updateLineList(pageState);
    scheduleSaveSession();
  });
}

function updateLineList(pageState) {
  const node = pageCard(pageState);
  if (!node) return;
  const list = node.querySelector(".line-list");
  list.innerHTML = "";
  pageState.lines.forEach((line, index) => {
    const override = line.styleOverride || {};
    const style = effectiveLineStyle(pageState, line);
    const row = document.createElement("div");
    row.className = "line-editor";
    row.innerHTML = `
      <div class="line-row">
        <input aria-label="Text ${index + 1}" value="${escapeAttr(line.text)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        <input aria-label="Left" type="number" step="0.1" value="${line.left.toFixed(1)}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        <input aria-label="Top" type="number" step="0.1" value="${line.top.toFixed(1)}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        <span class="confidence" title="OCR confidence">${Math.round(line.confidence ?? 0)}%</span>
      </div>
      <div class="line-style-controls">
        <select class="line-saved-style" aria-label="Saved text box style"></select>
        <button class="small apply-line-style">Apply</button>
        <button class="small save-line-style">Save</button>
        <button class="small reset-line-style">Reset</button>
        <button class="small delete-line">Delete</button>
      </div>
      <div class="style-grid line-override-grid">
        <label class="field">
          <span>Font</span>
          <select class="line-font"></select>
        </label>
        <label class="field">
          <span>Color</span>
          <input class="line-color" type="color" value="${escapeAttr(override.color || style.color || "#a85652")}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        </label>
        <label class="field">
          <span>Size</span>
          <input class="line-size" type="number" min="0" max="18" step="0.1" placeholder="Inherit" value="${override.fontSize ?? ""}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        </label>
        <label class="field">
          <span>Kerning</span>
          <input class="line-spacing" type="number" min="-0.5" max="1.5" step="0.01" placeholder="Inherit" value="${override.letterSpacing ?? ""}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        </label>
        <label class="field">
          <span>Line height</span>
          <input class="line-line-height" type="number" min="0.8" max="2" step="0.05" placeholder="Inherit" value="${override.lineHeight ?? ""}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
        </label>
        <label class="field">
          <span>Align</span>
          <select class="line-align">
            <option value="">Inherit</option>
            <option value="left"${override.align === "left" ? " selected" : ""}>Left</option>
            <option value="center"${override.align === "center" ? " selected" : ""}>Center</option>
            <option value="right"${override.align === "right" ? " selected" : ""}>Right</option>
          </select>
        </label>
      </div>
    `;
    const [textInput, leftInput, topInput] = row.querySelectorAll(".line-row input");
    const savedSelect = row.querySelector(".line-saved-style");
    fillSavedStyleSelect(savedSelect);
    const fontSelect = row.querySelector(".line-font");
    fillFontSelect(fontSelect, override.fontName || "", "Inherit page/book font");
    textInput.addEventListener("input", () => {
      line.text = textInput.value;
      refreshPageCard(pageState);
      scheduleSaveSession();
    });
    leftInput.addEventListener("input", () => {
      line.left = clamp(Number(leftInput.value), 0, 100 - line.width);
      refreshPageCard(pageState);
      scheduleSaveSession();
    });
    topInput.addEventListener("input", () => {
      line.top = clamp(Number(topInput.value), 0, 100 - line.height);
      refreshPageCard(pageState);
      scheduleSaveSession();
    });
    row.querySelector(".apply-line-style").addEventListener("click", () => {
      const saved = selectedSavedStyle(savedSelect.value);
      if (!saved) return;
      applyStyleToLine(pageState, line, saved.values);
    });
    row.querySelector(".save-line-style").addEventListener("click", () => {
      saveTextStyleFromPrompt(effectiveLineStyle(pageState, line), `Text box ${index + 1} style`);
    });
    row.querySelector(".reset-line-style").addEventListener("click", () => {
      line.styleOverride = {};
      refreshPageCard(pageState);
      scheduleSaveSession();
    });
    row.querySelector(".delete-line").addEventListener("click", () => {
      pageState.lines = pageState.lines.filter((candidate) => candidate.id !== line.id);
      refreshPageCard(pageState);
      scheduleSaveSession();
    });
    fontSelect.addEventListener("change", () => {
      updateLineStyleOverride(pageState, line, "fontName", fontSelect.value);
    });
    row.querySelector(".line-color").addEventListener("input", (event) => {
      updateLineStyleOverride(pageState, line, "color", event.target.value);
    });
    row.querySelector(".line-size").addEventListener("change", (event) => {
      updateLineStyleOverride(pageState, line, "fontSize", event.target.value);
    });
    row.querySelector(".line-spacing").addEventListener("change", (event) => {
      updateLineStyleOverride(pageState, line, "letterSpacing", event.target.value);
    });
    row.querySelector(".line-line-height").addEventListener("change", (event) => {
      updateLineStyleOverride(pageState, line, "lineHeight", event.target.value);
    });
    row.querySelector(".line-align").addEventListener("change", (event) => {
      updateLineStyleOverride(pageState, line, "align", event.target.value);
    });
    list.appendChild(row);
  });
}

function updateLineStyleOverride(pageState, line, field, value) {
  line.styleOverride = updateStyleField(line.styleOverride || {}, field, value);
  maybeLoadStyleFont(line.styleOverride);
  refreshPageCard(pageState);
  scheduleSaveSession();
}

async function cleanPages(pages) {
  if (pages.length === 0) {
    setStatus("Render pages first.");
    return;
  }
  const mode = els.cleanupMode.value || "none";
  const apiKey = els.apiKey.value.trim();
  if ((mode === "openai" || mode === "auto") && !apiKey) {
    setStatus("Enter an OpenAI API key or switch Cleanup mode to No cleanup, Tight white text fill, or Local white repaint.");
    return;
  }
  let failed = 0;
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    setStatus(`Applying ${cleanupModeLabel(mode)} to page ${page.pageNumber}...`, (i / pages.length) * 100);
    try {
      page.cleanDataUrl = await cleanPage(page, mode, apiKey);
      refreshPageCard(page);
      scheduleSaveSession();
      setStatus(`Applied ${cleanupModeLabel(mode)} to page ${page.pageNumber}.`, ((i + 1) / pages.length) * 100);
    } catch (error) {
      failed += 1;
      page.cleanDataUrl = page.cleanDataUrl || page.imageDataUrl;
      refreshPageCard(page);
      scheduleSaveSession();
      setStatus(`Skipped page ${page.pageNumber}: ${summarizeError(error)}`, ((i + 1) / pages.length) * 100);
    }
  }
  if (failed > 0) {
    setStatus(`Finished with ${failed} page${failed === 1 ? "" : "s"} skipped. Try Tight white text fill or Local white repaint for blocked pages.`, 100);
  }
}

async function cleanPage(page, mode, apiKey) {
  if (mode === "none") return page.imageDataUrl;
  if (mode === "whiteText") return locallyFillWhiteText(page);
  if (mode === "local") return locallyRepaintText(page);
  if (mode === "openai") return openAiCleanPage(page, apiKey);
  const local = await locallyRepaintText(page);
  try {
    return await openAiCleanPage(page, apiKey);
  } catch {
    return local;
  }
}

async function openAiCleanPage(page, apiKey) {
  const imageBlob = await dataUrlToBlob(page.imageDataUrl);
  const maskBlob = await createMaskBlob(page);
  return callImageEdit(apiKey, imageBlob, maskBlob);
}

async function locallyRepaintText(page) {
  const image = await loadImage(page.imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, page.width, page.height);
  const imageData = ctx.getImageData(0, 0, page.width, page.height);
  for (const line of page.lines) {
    const rect = paddedLineRect(page, line);
    const fill = sampleLocalFill(imageData, page.width, page.height, rect);
    ctx.save();
    ctx.fillStyle = fill;
    ctx.shadowColor = fill;
    ctx.shadowBlur = Math.max(2, rect.h * 0.08);
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.max(8, rect.h * 0.28));
    ctx.fill();
    ctx.restore();
  }
  return canvas.toDataURL("image/png");
}

async function locallyFillWhiteText(page) {
  if (!page.lines?.length) return page.imageDataUrl;
  const image = await loadImage(page.imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, page.width, page.height);
  const imageData = ctx.getImageData(0, 0, page.width, page.height);
  for (const line of page.lines) {
    const rect = tightLineRect(page, line);
    const fill = sampleInteriorWhiteFill(imageData, page.width, page.height, rect);
    if (!fill) continue;
    fillInkPixelsInRect(imageData, page.width, page.height, rect, fill);
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function paddedLineRect(page, line) {
  const style = effectiveLineStyle(page, line);
  const lineHeight = effectiveLineBoxHeight(line, style, page);
  const padX = page.width * 0.012;
  const padY = page.height * 0.008;
  const x = (line.left / 100) * page.width - padX;
  const y = (line.top / 100) * page.height - padY;
  const w = (line.width / 100) * page.width + padX * 2;
  const h = (lineHeight / 100) * page.height + padY * 2;
  return {
    x: clamp(x, 0, page.width),
    y: clamp(y, 0, page.height),
    w: clamp(w, 1, page.width - clamp(x, 0, page.width)),
    h: clamp(h, 1, page.height - clamp(y, 0, page.height)),
  };
}

function tightLineRect(page, line) {
  const style = effectiveLineStyle(page, line);
  const lineHeight = effectiveLineBoxHeight(line, style, page);
  const padX = Math.max(1, page.width * 0.003);
  const padY = Math.max(1, page.height * 0.002);
  const x = (line.left / 100) * page.width - padX;
  const y = (line.top / 100) * page.height - padY;
  const w = (line.width / 100) * page.width + padX * 2;
  const h = (lineHeight / 100) * page.height + padY * 2;
  const clampedX = clamp(x, 0, page.width);
  const clampedY = clamp(y, 0, page.height);
  return {
    x: clampedX,
    y: clampedY,
    w: clamp(w, 1, page.width - clampedX),
    h: clamp(h, 1, page.height - clampedY),
  };
}

function sampleLocalFill(imageData, width, height, rect) {
  const samples = [];
  const x0 = clamp(Math.floor(rect.x), 0, width - 1);
  const y0 = clamp(Math.floor(rect.y), 0, height - 1);
  const x1 = clamp(Math.ceil(rect.x + rect.w), x0 + 1, width);
  const y1 = clamp(Math.ceil(rect.y + rect.h), y0 + 1, height);
  const margin = Math.max(3, Math.round(Math.min(rect.w, rect.h) * 0.2));
  const samplePixel = (x, y) => {
    const offset = (y * width + x) * 4;
    const r = imageData.data[offset];
    const g = imageData.data[offset + 1];
    const b = imageData.data[offset + 2];
    const brightness = (r + g + b) / 3;
    if (brightness > 165) samples.push([r, g, b]);
  };
  for (let i = 0; i < 28; i += 1) {
    const x = Math.floor(x0 + ((x1 - x0 - 1) * i) / 27);
    samplePixel(x, clamp(y0 - margin, 0, height - 1));
    samplePixel(x, clamp(y1 + margin, 0, height - 1));
  }
  for (let i = 0; i < 12; i += 1) {
    const y = Math.floor(y0 + ((y1 - y0 - 1) * i) / 11);
    samplePixel(clamp(x0 - margin, 0, width - 1), y);
    samplePixel(clamp(x1 + margin, 0, width - 1), y);
  }
  const color = medianColor(samples.length > 0 ? samples : [[248, 248, 246]]);
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function sampleInteriorWhiteFill(imageData, width, height, rect) {
  const samples = [];
  const samplePadX = Math.max(2, width * 0.004, rect.w * 0.2);
  const samplePadY = Math.max(2, height * 0.003, rect.h * 0.25);
  const x0 = clamp(Math.floor(rect.x - samplePadX), 0, width - 1);
  const y0 = clamp(Math.floor(rect.y - samplePadY), 0, height - 1);
  const x1 = clamp(Math.ceil(rect.x + rect.w + samplePadX), x0 + 1, width);
  const y1 = clamp(Math.ceil(rect.y + rect.h + samplePadY), y0 + 1, height);
  let checked = 0;
  let light = 0;
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 6000)));
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const offset = (y * width + x) * 4;
      const r = imageData.data[offset];
      const g = imageData.data[offset + 1];
      const b = imageData.data[offset + 2];
      checked += 1;
      if (isWhiteBackingPixel(r, g, b)) {
        light += 1;
        samples.push([r, g, b]);
      }
    }
  }
  if (checked === 0 || light / checked < 0.18) return null;
  return medianColor(samples.length > 0 ? samples : [[255, 255, 255]]);
}

function fillInkPixelsInRect(imageData, width, height, rect, fill) {
  const x0 = clamp(Math.floor(rect.x), 0, width - 1);
  const y0 = clamp(Math.floor(rect.y), 0, height - 1);
  const x1 = clamp(Math.ceil(rect.x + rect.w), x0 + 1, width);
  const y1 = clamp(Math.ceil(rect.y + rect.h), y0 + 1, height);
  const rectWidth = x1 - x0;
  const rectHeight = y1 - y0;
  const mask = new Uint8Array(rectWidth * rectHeight);
  let inkCount = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * width + x) * 4;
      const r = imageData.data[offset];
      const g = imageData.data[offset + 1];
      const b = imageData.data[offset + 2];
      const alpha = imageData.data[offset + 3];
      if (alpha > 10 && isLikelyTextInkPixel(r, g, b)) {
        mask[(y - y0) * rectWidth + (x - x0)] = 1;
        inkCount += 1;
      }
    }
  }
  if (inkCount === 0) return;
  for (let y = 0; y < rectHeight; y += 1) {
    for (let x = 0; x < rectWidth; x += 1) {
      if (!mask[y * rectWidth + x]) continue;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(rectHeight - 1, y + 1); yy += 1) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(rectWidth - 1, x + 1); xx += 1) {
          const offset = ((y0 + yy) * width + (x0 + xx)) * 4;
          imageData.data[offset] = fill[0];
          imageData.data[offset + 1] = fill[1];
          imageData.data[offset + 2] = fill[2];
          imageData.data[offset + 3] = 255;
        }
      }
    }
  }
}

function isWhiteBackingPixel(r, g, b) {
  const brightness = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness > 205 && spread < 65;
}

function isLikelyTextInkPixel(r, g, b) {
  const brightness = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness < 145 || (brightness < 190 && spread < 75);
}

function medianColor(samples) {
  return [0, 1, 2].map((channel) => {
    const values = samples.map((sample) => sample[channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  });
}

function cleanupModeLabel(mode) {
  if (mode === "none") return "no cleanup";
  if (mode === "whiteText") return "tight white text fill";
  if (mode === "openai") return "OpenAI image edit";
  if (mode === "auto") return "local/OpenAI auto";
  return "local repaint";
}

function cleanupModeUsesLocalRepaint() {
  const mode = els.cleanupMode.value || "none";
  return mode === "local" || mode === "auto";
}

function summarizeError(error) {
  const message = String(error?.message ?? error);
  const parsed = message.match(/"message"\s*:\s*"([^"]+)"/);
  return parsed?.[1] ?? message.slice(0, 180);
}

async function createMaskBlob(page) {
  const canvas = document.createElement("canvas");
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-out";
  for (const line of page.lines) {
    const style = effectiveLineStyle(page, line);
    const lineHeight = effectiveLineBoxHeight(line, style, page);
    const padX = page.width * 0.018;
    const padY = page.height * 0.014;
    const x = (line.left / 100) * page.width - padX;
    const y = (line.top / 100) * page.height - padY;
    const w = (line.width / 100) * page.width + padX * 2;
    const h = (lineHeight / 100) * page.height + padY * 2;
    roundRect(ctx, x, y, w, h, Math.max(10, h * 0.35));
    ctx.fill();
  }
  return canvasToBlob(canvas);
}

async function callImageEdit(apiKey, imageBlob, maskBlob) {
  const form = new FormData();
  form.append("model", els.imageModel.value.trim() || "gpt-image-2");
  form.append("image", imageBlob, "page.png");
  form.append("mask", maskBlob, "mask.png");
  form.append("prompt", els.editPrompt.value.trim());
  form.append("size", els.imageSize.value);
  form.append("quality", els.imageQuality.value || "low");
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI image edit failed: ${message}`);
  }
  const json = await response.json();
  const item = json.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) {
    const blob = await fetch(item.url).then((imageResponse) => imageResponse.blob());
    return blobToDataUrl(blob);
  }
  throw new Error("OpenAI image edit returned no image.");
}

async function exportLayeredPdf() {
  if (state.pages.length === 0) {
    setStatus("Render pages first.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const first = state.pages[0];
  const doc = new jsPDF({
    orientation: first.width >= first.height ? "landscape" : "portrait",
    unit: "pt",
    format: [first.width, first.height],
    compress: true,
  });

  const registeredFonts = registerPdfFonts(doc);

  state.pages.forEach((page, index) => {
    if (index > 0) {
      doc.addPage([page.width, page.height], page.width >= page.height ? "landscape" : "portrait");
    }
    doc.addImage(page.cleanDataUrl || page.imageDataUrl, "PNG", 0, 0, page.width, page.height);
    for (const line of page.lines) {
      const style = effectiveLineStyle(page, line);
      const lineFont = style.fontName;
      const fontSize = (style.fontSize / 100) * page.width;
      const fontStyle = !registeredFonts.has(lineFont) && style.fontWeight >= 600 ? "bold" : "normal";
      doc.setFont(registeredFonts.has(lineFont) ? lineFont : "helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(style.color);
      if (typeof doc.setCharSpace === "function") {
        doc.setCharSpace(((style.letterSpacing ?? 0) / 100) * page.width);
      }
      const lineLeft = (line.left / 100) * page.width;
      const lineWidth = (line.width / 100) * page.width;
      const x = lineTextAnchor(lineLeft, lineWidth, style.align);
      const y = (line.top / 100) * page.height + fontSize;
      doc.text(line.text, x, y, {
        align: style.align,
      });
    }
  });
  if (typeof doc.setCharSpace === "function") {
    doc.setCharSpace(0);
  }
  const rawPdf = doc.output("arraybuffer");
  const prunedPdf = await pruneUnusedPageImageResources(rawPdf);
  downloadArrayBuffer(prunedPdf, "storybook-layered.pdf", "application/pdf");
  setStatus("Exported layered PDF.", 100);
}

async function pruneUnusedPageImageResources(pdfBytes) {
  const pdfLib = window.PDFLib;
  if (!pdfLib?.PDFDocument) {
    setStatus("PDF resource cleanup library did not load; exporting with shared image resources.");
    return pdfBytes;
  }
  setStatus("Pruning page image resources...", 98);
  const { PDFDocument, PDFName, PDFDict } = pdfLib;
  if (!PDFName || !PDFDict?.withContext) return pdfBytes;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const context = pdfDoc.context;
  for (const page of pdfDoc.getPages()) {
    const resources = lookupPdfObject(context, page.node.get(PDFName.of("Resources")));
    if (!isPdfDict(resources)) continue;
    const xObjects = lookupPdfObject(context, resources.get(PDFName.of("XObject")));
    if (!isPdfDict(xObjects)) continue;
    const used = drawnImageResourceNames(context, page, PDFName);
    if (used.size === 0 || used.size >= [...xObjects.keys()].length) continue;
    const pageResources = PDFDict.withContext(context);
    for (const key of resources.keys()) {
      if (key.toString() !== "/XObject") pageResources.set(key, resources.get(key));
    }
    const pageXObjects = PDFDict.withContext(context);
    for (const key of xObjects.keys()) {
      if (used.has(key.toString())) pageXObjects.set(key, xObjects.get(key));
    }
    pageResources.set(PDFName.of("XObject"), pageXObjects);
    page.node.set(PDFName.of("Resources"), context.register(pageResources));
  }
  return pdfDoc.save({ useObjectStreams: false });
}

function drawnImageResourceNames(context, page, PDFName) {
  const contents = lookupPdfObject(context, page.node.get(PDFName.of("Contents")));
  const streams = isPdfArray(contents) ? contents.asArray().map((item) => lookupPdfObject(context, item)) : [contents];
  const used = new Set();
  for (const stream of streams) {
    if (!isPdfStream(stream)) continue;
    const decoded = decodePdfContentStream(stream);
    for (const match of decoded.matchAll(/\/([A-Za-z][A-Za-z0-9_.-]*)\s+Do\b/g)) {
      used.add(`/${match[1]}`);
    }
  }
  return used;
}

function lookupPdfObject(context, object) {
  return isPdfRef(object) ? context.lookup(object) : object;
}

function isPdfRef(object) {
  return object?.constructor?.name === "PDFRef";
}

function isPdfDict(object) {
  return object?.constructor?.name === "PDFDict" && typeof object.keys === "function" && typeof object.get === "function";
}

function isPdfArray(object) {
  return object?.constructor?.name === "PDFArray" && typeof object.asArray === "function";
}

function isPdfStream(object) {
  return object?.contents && object?.dict;
}

function decodePdfContentStream(stream) {
  const contents = stream.contents;
  if (!contents) return "";
  const filter = stream.dict?.get?.(window.PDFLib.PDFName.of("Filter"))?.toString?.();
  const bytes = filter === "/FlateDecode" ? inflateZlib(contents) : contents;
  return bytesToBinaryString(bytes);
}

function inflateZlib(bytes) {
  if (window.pako?.inflate) return window.pako.inflate(bytes);
  return bytes;
}

function bytesToBinaryString(bytes) {
  let output = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    output += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return output;
}

function registerPdfFonts(doc) {
  const registered = new Set();
  if (state.bundledFontBase64) {
    doc.addFileToVFS("MouseMemoirs-Regular.ttf", state.bundledFontBase64);
    doc.addFont("MouseMemoirs-Regular.ttf", "Mouse Memoirs", "normal");
    registered.add("Mouse Memoirs");
  }
  if (state.selectedFontBase64) {
    doc.addFileToVFS("custom-story-font.ttf", state.selectedFontBase64);
    doc.addFont("custom-story-font.ttf", CUSTOM_FONT_VALUE, "normal");
    registered.add(CUSTOM_FONT_VALUE);
  }
  return registered;
}

async function exportPowerPoint() {
  if (state.pages.length === 0) {
    setStatus("Render pages first.");
    return;
  }
  const PptxCtor = window.PptxGenJS || window.pptxgen || window.pptxgenjs;
  if (!PptxCtor) {
    setStatus("PowerPoint export library did not load.");
    return;
  }
  const pptx = new PptxCtor();
  pptx.layout = "LAYOUT_CUSTOM";
  pptx.width = 10;
  pptx.height = 10 * (state.pages[0].height / state.pages[0].width);
  pptx.author = "LayerPDF";
  pptx.subject = "Layered storybook pages";

  for (const page of state.pages) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({ data: page.cleanDataUrl, x: 0, y: 0, w: pptx.width, h: pptx.height });
    for (const line of page.lines) {
      const style = effectiveLineStyle(page, line);
      const charSpacing = ((style.letterSpacing ?? 0) / 100) * pptx.width * 72;
      slide.addText(line.text, {
        x: (line.left / 100) * pptx.width,
        y: (line.top / 100) * pptx.height,
        w: (line.width / 100) * pptx.width,
        h: (effectiveLineBoxHeight(line, style, page) / 100) * pptx.height,
        fontFace: style.fontName,
        bold: style.fontWeight >= 600,
        fontSize: Math.max(8, (style.fontSize / 100) * pptx.width * 72),
        color: style.color.replace("#", ""),
        charSpacing,
        align: style.align,
        valign: "mid",
        margin: 0,
        fit: "shrink",
        breakLine: false,
      });
    }
  }
  await pptx.writeFile({ fileName: "storybook-editable.pptx" });
  setStatus("Exported PowerPoint.", 100);
}

function lineTextAnchor(left, width, align) {
  if (align === "left") return left;
  if (align === "right") return left + width;
  return left + width / 2;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function downloadArrayBuffer(bytes, fileName, mimeType) {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
