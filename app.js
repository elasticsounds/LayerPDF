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
};

const els = {
  pdfInput: $("pdfInput"),
  pageRange: $("pageRange"),
  ocrLang: $("ocrLang"),
  apiKey: $("apiKey"),
  imageModel: $("imageModel"),
  imageSize: $("imageSize"),
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
});

els.fontFile.addEventListener("change", async () => {
  const file = els.fontFile.files?.[0];
  state.selectedFontBase64 = file ? await fileToBase64(file) : null;
});

els.renderBtn.addEventListener("click", renderAndOcr);
els.cleanBtn.addEventListener("click", () => cleanPages(state.pages));
els.exportPdfBtn.addEventListener("click", exportLayeredPdf);
els.exportPptxBtn.addEventListener("click", exportPowerPoint);

loadBundledFont();

async function loadBundledFont() {
  try {
    const response = await fetch("./assets/MouseMemoirs-Regular.ttf");
    if (!response.ok) return;
    const blob = await response.blob();
    state.bundledFontBase64 = await fileToBase64(blob);
  } catch {
    state.bundledFontBase64 = null;
  }
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
    };
    state.pages.push(pageState);
    renderPageCard(pageState);
    setStatus(`OCR page ${pageNumber}...`, (i / pages.length) * 50 + 20);
    pageState.lines = await ocrLines(rendered.canvas, pageState.width, pageState.height);
    if (pageState.lines.length === 0) {
      pageState.lines = [defaultLine()];
    }
    refreshPageCard(pageState);
    setStatus(`Processed page ${pageNumber}.`, ((i + 1) / pages.length) * 70);
  }
  setStatus("Review the text boxes, then clean images or export.", 100);
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
  const lang = els.ocrLang.value.trim() || "sqi";
  const result = await Tesseract.recognize(canvas, lang);
  const lines = result.data.lines ?? [];
  return lines
    .map((line, index) => {
      const text = (line.text ?? "").replace(/\s+/g, " ").trim();
      const box = line.bbox;
      if (!text || !box) return null;
      const left = (box.x0 / width) * 100;
      const top = (box.y0 / height) * 100;
      const w = ((box.x1 - box.x0) / width) * 100;
      const h = ((box.y1 - box.y0) / height) * 100;
      return {
        id: `line-${index + 1}`,
        text,
        left,
        top,
        width: Math.max(5, w),
        height: Math.max(2.8, h),
        fontSize: Math.max(2.6, h * 0.92),
        color: "#a85652",
      };
    })
    .filter(Boolean);
}

function defaultLine() {
  return {
    id: `line-${crypto.randomUUID()}`,
    text: "Edit this text",
    left: 20,
    top: 10,
    width: 60,
    height: 5,
    fontSize: 4.2,
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
  box.style.fontFamily = `"${els.fontName.value}", "Comic Sans MS", sans-serif`;
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
      <input aria-label="Text" value="${escapeAttr(line.text)}" />
      <input aria-label="Left" type="number" step="0.1" value="${line.left.toFixed(1)}" />
      <input aria-label="Top" type="number" step="0.1" value="${line.top.toFixed(1)}" />
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
  const apiKey = els.apiKey.value.trim();
  if (!apiKey) {
    setStatus("Enter an OpenAI API key first.");
    return;
  }
  if (pages.length === 0) {
    setStatus("Render pages first.");
    return;
  }
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    setStatus(`Cleaning page ${page.pageNumber}...`, (i / pages.length) * 100);
    const imageBlob = await dataUrlToBlob(page.imageDataUrl);
    const maskBlob = await createMaskBlob(page);
    const cleaned = await callImageEdit(apiKey, imageBlob, maskBlob);
    page.cleanDataUrl = cleaned;
    refreshPageCard(page);
    setStatus(`Cleaned page ${page.pageNumber}.`, ((i + 1) / pages.length) * 100);
  }
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
  form.append("quality", "medium");
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

  const fontName = els.fontName.value.trim() || "Helvetica";
  const fontBase64 = state.selectedFontBase64 || state.bundledFontBase64;
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
  const fontFace = els.fontName.value.trim() || "Mouse Memoirs";

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
