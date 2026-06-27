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
};

const SETTINGS_KEY = "layerpdf.settings.v1";
const DB_NAME = "layerpdf";
const DB_VERSION = 1;
const PDF_STORE = "files";
const LAST_PDF_ID = "lastPdf";
const LAST_FONT_ID = "lastFont";
const CUSTOM_FONT_VALUE = "Custom story font";

const GOOGLE_FONT_OPTIONS = new Set([
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
  pageRange: $("pageRange"),
  ocrEngine: $("ocrEngine"),
  ocrLang: $("ocrLang"),
  ocrLangOptions: $("ocrLangOptions"),
  geminiApiKey: $("geminiApiKey"),
  geminiModel: $("geminiModel"),
  minConfidence: $("minConfidence"),
  requireLightArea: $("requireLightArea"),
  fontSizeOverride: $("fontSizeOverride"),
  cleanupMode: $("cleanupMode"),
  apiKey: $("apiKey"),
  imageModel: $("imageModel"),
  imageSize: $("imageSize"),
  imageQuality: $("imageQuality"),
  editPrompt: $("editPrompt"),
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
  els.workspaceTitle.textContent = state.pdfFile ? state.pdfFile.name : "No PDF loaded";
  if (state.pdfFile) {
    saveLastPdf(state.pdfFile).catch(() => {
      setStatus("PDF loaded, but this browser could not save it for refresh.");
    });
  }
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
els.fontSizeOverride.addEventListener("change", () => {
  if (state.pages.length === 0) return;
  const fontSize = normalizeFontSizes(state.pages);
  state.pages.forEach(refreshPageCard);
  setStatus(`Updated text size to ${fontSize.toFixed(1)}.`, 100);
});
els.fontName.addEventListener("change", () => {
  applySelectedFont();
  state.pages.forEach(refreshPageCard);
});

populateOcrLanguages();
initializePersistence();
loadBundledFont();
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
  bindPersistentSettings();
  restoreLastPdf();
  restoreLastFont();
}

function persistentFields() {
  return [
    els.pageRange,
    els.ocrEngine,
    els.ocrLang,
    els.geminiApiKey,
    els.geminiModel,
    els.minConfidence,
    els.requireLightArea,
    els.fontSizeOverride,
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
  const settings = {};
  for (const field of persistentFields()) {
    settings[field.id] = field.type === "checkbox" ? field.checked : field.value;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
  return els.fontName.value.trim() || "Mouse Memoirs";
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
  els.pageGrid.innerHTML = "";
  els.emptyState.hidden = true;

  const bytes = await state.pdfFile.arrayBuffer();
  state.pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages = parsePageRange(els.pageRange.value, state.pdf.numPages);
  setStatus(`Rendering ${pages.length} page${pages.length === 1 ? "" : "s"}...`, 0);

  for (let i = 0; i < pages.length; i += 1) {
    const pageNumber = pages[i];
    const rendered = await renderPdfPage(pageNumber);
    const pageState = {
      pageNumber,
      width: rendered.width,
      height: rendered.height,
      imageDataUrl: rendered.dataUrl,
      cleanDataUrl: rendered.dataUrl,
      lines: [],
      ocrStats: null,
    };
    state.pages.push(pageState);
    renderPageCard(pageState);
    setStatus(`OCR page ${pageNumber}...`, (i / pages.length) * 50 + 20);
    let ocr;
    try {
      ocr = await ocrLines(rendered.canvas, pageState.width, pageState.height);
    } catch (error) {
      setStatus(`OCR failed on page ${pageNumber}: ${error.message}`, ((i + 1) / pages.length) * 70);
      return;
    }
    pageState.lines = ocr.lines;
    pageState.ocrStats = ocr.stats;
    if (pageState.lines.length === 0) {
      pageState.lines = [defaultLine()];
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
}

async function renderPdfPage(pageNumber) {
  const page = await state.pdf.getPage(pageNumber);
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
  };
}

async function ocrLines(canvas, width, height) {
  if (els.ocrEngine.value === "gemini") {
    return geminiOcrLines(canvas, width, height);
  }
  return tesseractOcrLines(canvas, width, height);
}

async function tesseractOcrLines(canvas, width, height) {
  const lang = els.ocrLang.value.trim() || "sqi";
  const settings = getOcrSettings();
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
        color: "#a85652",
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
    color: "#a85652",
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
      line.height = Math.max(line.height, fontSize * 1.05);
    }
  }
  return fontSize;
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

function defaultLine() {
  return {
    id: `line-${crypto.randomUUID()}`,
    text: "Edit this text",
    left: 20,
    top: 10,
    width: 60,
    height: 5,
    rawFontSize: 4.2,
    fontSize: 4.2,
    confidence: 100,
    color: "#a85652",
  };
}

function renderPageCard(pageState) {
  const node = els.pageTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.page = String(pageState.pageNumber);
  node.querySelector(".page-title").textContent = `Page ${pageState.pageNumber}`;
  node.querySelector(".page-image").src = pageState.cleanDataUrl;
  node.querySelector(".page-image").alt = `Page ${pageState.pageNumber}`;
  node.querySelector(".use-original").addEventListener("click", () => {
    pageState.cleanDataUrl = pageState.imageDataUrl;
    refreshPageCard(pageState);
  });
  node.querySelector(".reclean").addEventListener("click", () => cleanPages([pageState]));
  els.pageGrid.appendChild(node);
}

function refreshPageCard(pageState) {
  const node = pageCard(pageState);
  if (!node) return;
  const title = node.querySelector(".page-title");
  if (pageState.ocrStats) {
    title.textContent = `Page ${pageState.pageNumber} · ${pageState.ocrStats.engine} ${pageState.ocrStats.kept}/${pageState.ocrStats.total}`;
  } else {
    title.textContent = `Page ${pageState.pageNumber}`;
  }
  node.querySelector("summary").textContent = `Text boxes (${pageState.lines.length})`;
  node.querySelector(".page-image").src = pageState.cleanDataUrl;
  const overlay = node.querySelector(".overlay-layer");
  overlay.innerHTML = "";
  for (const line of pageState.lines) {
    const box = document.createElement("div");
    box.className = "text-box";
    box.contentEditable = "true";
    box.spellcheck = false;
    box.textContent = line.text;
    applyLineStyle(box, line);
    box.addEventListener("input", () => {
      line.text = box.textContent.trim();
      updateLineList(pageState);
    });
    makeDraggable(box, line, pageState);
    overlay.appendChild(box);
  }
  updateLineList(pageState);
}

function pageCard(pageState) {
  return els.pageGrid.querySelector(`[data-page="${pageState.pageNumber}"]`);
}

function applyLineStyle(box, line) {
  box.style.left = `${line.left}%`;
  box.style.top = `${line.top}%`;
  box.style.width = `${line.width}%`;
  box.style.height = `${line.height}%`;
  box.style.fontSize = `${line.fontSize}cqw`;
  box.style.color = line.color;
  box.style.fontFamily = selectedFontCssStack();
}

function selectedFontCssStack() {
  const fontName = selectedFontName();
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
    applyLineStyle(box, line);
  });
  box.addEventListener("pointerup", () => {
    if (!start) return;
    start = null;
    updateLineList(pageState);
  });
}

function updateLineList(pageState) {
  const node = pageCard(pageState);
  if (!node) return;
  const list = node.querySelector(".line-list");
  list.innerHTML = "";
  pageState.lines.forEach((line) => {
    const row = document.createElement("div");
    row.className = "line-row";
    row.innerHTML = `
      <input aria-label="Text" value="${escapeAttr(line.text)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      <input aria-label="Left" type="number" step="0.1" value="${line.left.toFixed(1)}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      <input aria-label="Top" type="number" step="0.1" value="${line.top.toFixed(1)}" autocomplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" />
      <span class="confidence" title="OCR confidence">${Math.round(line.confidence ?? 0)}%</span>
    `;
    const [textInput, leftInput, topInput] = row.querySelectorAll("input");
    textInput.addEventListener("input", () => {
      line.text = textInput.value;
      refreshPageCard(pageState);
    });
    leftInput.addEventListener("input", () => {
      line.left = clamp(Number(leftInput.value), 0, 100 - line.width);
      refreshPageCard(pageState);
    });
    topInput.addEventListener("input", () => {
      line.top = clamp(Number(topInput.value), 0, 100 - line.height);
      refreshPageCard(pageState);
    });
    list.appendChild(row);
  });
}

async function cleanPages(pages) {
  if (pages.length === 0) {
    setStatus("Render pages first.");
    return;
  }
  const mode = els.cleanupMode.value || "local";
  const apiKey = els.apiKey.value.trim();
  if ((mode === "openai" || mode === "auto") && !apiKey) {
    setStatus("Enter an OpenAI API key or switch Cleanup mode to Local white repaint.");
    return;
  }
  let failed = 0;
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    setStatus(`Cleaning page ${page.pageNumber} with ${cleanupModeLabel(mode)}...`, (i / pages.length) * 100);
    try {
      page.cleanDataUrl = await cleanPage(page, mode, apiKey);
      refreshPageCard(page);
      setStatus(`Cleaned page ${page.pageNumber}.`, ((i + 1) / pages.length) * 100);
    } catch (error) {
      failed += 1;
      page.cleanDataUrl = page.cleanDataUrl || page.imageDataUrl;
      refreshPageCard(page);
      setStatus(`Skipped page ${page.pageNumber}: ${summarizeError(error)}`, ((i + 1) / pages.length) * 100);
    }
  }
  if (failed > 0) {
    setStatus(`Finished with ${failed} page${failed === 1 ? "" : "s"} skipped. Try Local white repaint for blocked pages.`, 100);
  }
}

async function cleanPage(page, mode, apiKey) {
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

function paddedLineRect(page, line) {
  const padX = page.width * 0.012;
  const padY = page.height * 0.008;
  const x = (line.left / 100) * page.width - padX;
  const y = (line.top / 100) * page.height - padY;
  const w = (line.width / 100) * page.width + padX * 2;
  const h = (line.height / 100) * page.height + padY * 2;
  return {
    x: clamp(x, 0, page.width),
    y: clamp(y, 0, page.height),
    w: clamp(w, 1, page.width - clamp(x, 0, page.width)),
    h: clamp(h, 1, page.height - clamp(y, 0, page.height)),
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

function medianColor(samples) {
  return [0, 1, 2].map((channel) => {
    const values = samples.map((sample) => sample[channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  });
}

function cleanupModeLabel(mode) {
  if (mode === "openai") return "OpenAI image edit";
  if (mode === "auto") return "local/OpenAI auto";
  return "local repaint";
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
    const padX = page.width * 0.018;
    const padY = page.height * 0.014;
    const x = (line.left / 100) * page.width - padX;
    const y = (line.top / 100) * page.height - padY;
    const w = (line.width / 100) * page.width + padX * 2;
    const h = (line.height / 100) * page.height + padY * 2;
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

  const fontName = selectedFontName();
  const fontBase64 = pdfFontBase64(fontName);
  if (fontBase64) {
    doc.addFileToVFS("storybook-font.ttf", fontBase64);
    doc.addFont("storybook-font.ttf", fontName, "normal");
  }

  state.pages.forEach((page, index) => {
    if (index > 0) {
      doc.addPage([page.width, page.height], page.width >= page.height ? "landscape" : "portrait");
    }
    doc.addImage(page.cleanDataUrl, "PNG", 0, 0, page.width, page.height);
    doc.setFont(fontBase64 ? fontName : "helvetica", "normal");
    for (const line of page.lines) {
      const fontSize = (line.fontSize / 100) * page.width;
      doc.setFontSize(fontSize);
      doc.setTextColor(line.color);
      const x = (line.left / 100) * page.width + ((line.width / 100) * page.width) / 2;
      const y = (line.top / 100) * page.height + fontSize;
      doc.text(line.text, x, y, {
        align: "center",
        maxWidth: (line.width / 100) * page.width,
      });
    }
  });
  doc.save("storybook-layered.pdf");
  setStatus("Exported layered PDF.", 100);
}

function pdfFontBase64(fontName) {
  if (fontName === CUSTOM_FONT_VALUE && state.selectedFontBase64) return state.selectedFontBase64;
  if (fontName === "Mouse Memoirs") return state.bundledFontBase64;
  return null;
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
  const fontFace = selectedFontName();

  for (const page of state.pages) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({ data: page.cleanDataUrl, x: 0, y: 0, w: pptx.width, h: pptx.height });
    for (const line of page.lines) {
      slide.addText(line.text, {
        x: (line.left / 100) * pptx.width,
        y: (line.top / 100) * pptx.height,
        w: (line.width / 100) * pptx.width,
        h: (line.height / 100) * pptx.height,
        fontFace,
        fontSize: Math.max(8, (line.fontSize / 100) * pptx.width * 72),
        color: line.color.replace("#", ""),
        align: "center",
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
