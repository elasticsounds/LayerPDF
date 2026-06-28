# LayerPDF

A static web app for illustrated storybooks where the printed text is burned
into full-page artwork. The app renders PDF pages in the browser, OCRs likely
story text, uses a masked OpenAI image edit to remove the burned-in text from
the artwork, and exports:

- a layered PDF with clean background images plus selectable text;
- an editable PowerPoint deck with full-page images and editable text boxes.

## Publish On GitHub Pages

1. Commit this folder to a GitHub repository named `LayerPDF`.
2. In the repository, open **Settings -> Pages**.
3. Set **Source** to your default branch.
4. Publish from the repository root and open:
   `https://<user>.github.io/LayerPDF/`.

No build step is required.

## Local Preview

From the repository root:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

## API Key Handling

For GitHub Pages, the app runs entirely in the browser. Users paste their own
OpenAI and optional Gemini API keys, and requests are sent directly from their
browser to those APIs. The app saves API keys and settings in browser local
storage so refreshes keep your work. This is convenient for a local/internal
tool, but browser-side API keys are inherently inspectable. Do not paste a key
on a shared or untrusted computer.

For a public production app, use a backend or Netlify/Vercel function that
proxies image edit requests and applies your own auth, rate limits, logging, and
spend controls.

## Current Workflow

1. Upload a scanned PDF.
2. Save it as a local project if you want to reopen the same PDF, settings, and
   edited workspace later.
3. Choose the story page range.
4. Optionally choose tile handling. It is disabled by default; Auto mode detects
   pages with many image fragments and flags them as consolidated through the
   full-page render before OCR.
5. Choose the OCR/text engine. **PDF native text** extracts positioned text from
   the PDF for textbook-style files; Browser Tesseract runs fully locally;
   Gemini vision OCR uses a Gemini API key to detect story text and boxes from
   the page image.
6. Choose the OCR language. The picker includes the full practical Tesseract
   traineddata language set, and Albanian uses the `sqi` language model.
7. Tune the OCR confidence, white backing filter, and optional text size
   override when illustrated backgrounds create false text boxes.
8. Use the text style panel to choose the book-level font, custom TTF/OTF,
   color, size, kerning, line height, and alignment before rendering. **Match
   book font** is the default; with PDF native text it tries to map embedded PDF
   font names to the closest available web font for each line.
9. Run **Render & OCR**.
10. Drag/edit, add, or delete text boxes in the review screen. Pages with no OCR
   text stay empty until you add a text box. You can override style at the page
   level or on individual text boxes, then save reusable styles for the rest of
   the book.
11. Choose a cleanup mode and run **Apply Cleanup Mode**.
12. Export a layered PDF or editable PowerPoint.

## Notes

- The app is tuned for storybooks: full-page art, small amounts of overlaid
  text, and simple text regions.
- The OCR language field accepts raw Tesseract codes, so you can combine
  languages with `+` such as `eng+sqi`.
- Gemini OCR sends each rendered page image to Gemini and asks for exact story
  text lines with normalized bounding boxes. It is useful when Tesseract misses
  illustrated or low-contrast pages.
- PDF native text mode is intended for textbook-style InDesign exports that
  still contain real PDF text but have tiled images from flattened transparency.
  It extracts positioned PDF text, repairs simple doubled text artifacts, and
  locally repaints the rendered background behind the editable text layer.
- Tile handling is opt-in. When enabled, it uses PDF image-paint operations to
  flag pages that look like image grids. LayerPDF already renders each page to a
  single full-page background image, so tiled scanned pages are consolidated
  before text cleanup. Mixed digital textbooks with real PDF text and tiled
  figures will need a later object-level path.
- The app persists settings in local storage and the most recent PDF, rendered
  pages, cleaned images, text boxes, positions, and style overrides in IndexedDB.
  Browsers do not allow file inputs to be visually refilled after a refresh, so
  the picker may look empty even when the PDF and workspace are restored.
- Projects are local to the current browser. A project stores the PDF, settings,
  rendered workspace, text boxes, style overrides, saved text styles, and custom
  font data when available. Projects can be reopened or deleted from the
  Projects panel without sending files to a server.
- OCR filtering rejects low-confidence lines, oversized boxes, tiny fragments,
  non-text-like strings, and optional non-white-backed regions.
- Detected text sizes are normalized across the processed batch unless a text
  size override is provided.
- The text style panel includes **Match book font**, storybook-friendly Google
  Fonts, custom TTF/OTF upload, color, size override, kerning, and line-height
  controls. Native PDF text keeps a per-line font-family hint when possible and
  maps common book fonts such as Poppins and Patrick Hand to Google Fonts for
  preview and PowerPoint export. Uploaded fonts are used for live preview and
  PDF embedding, and the most recent uploaded font is saved in IndexedDB.
- Text styling cascades from book style to page override to text-box override.
  Saved text styles are kept in local storage and can be applied back to the
  whole book, a single page, or a single text box. Style controls include font,
  color, size, kerning, line height, and alignment.
- Browser-side layered PDF export can only embed the bundled Mouse Memoirs font
  or a user-uploaded custom TTF/OTF. Native PDF font matches that are not
  uploaded may fall back to PDF core fonts in the exported PDF.
- Cleanup mode defaults to **No cleanup - overlay only**, which keeps the
  original rendered page image and places editable text above it. This is useful
  for native PDF text extraction when you do not want white repaint boxes.
- **Local white repaint** uses canvas sampling to cover detected text without
  calling any image API. Use **OpenAI image edit** only for pages where text
  crosses detailed artwork.
- OpenAI image edit failures are page-scoped: blocked or failed pages are
  skipped instead of stopping the whole batch.
- The image model dropdown includes `gpt-image-2`, `gpt-image-1.5`,
  `gpt-image-1`, and `gpt-image-1-mini`. Choose a lower-cost model and low
  quality when image cleanup quality is less important.
- Albanian OCR is supported through Tesseract's `sqi.traineddata` model.
- OCR is only a first pass. Manual text correction and placement review are part
  of the intended workflow.
- PowerPoint export does not embed the font. Install the relevant storybook font
  locally before editing if needed.
