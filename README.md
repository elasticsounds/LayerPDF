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
2. Choose the story page range.
3. Choose the OCR engine. Browser Tesseract runs fully locally; Gemini vision
   OCR uses a Gemini API key to detect story text and boxes from the page image.
4. Choose the OCR language. The picker includes the full practical Tesseract
   traineddata language set, and Albanian uses the `sqi` language model.
5. Tune the OCR confidence, white backing filter, and optional text size
   override when illustrated backgrounds create false text boxes.
6. Choose a Google font or upload a custom TTF/OTF before rendering.
7. Run **Render & OCR**.
8. Drag/edit text boxes in the review screen.
9. Choose a cleanup mode and run **Remove Burned-In Text**.
10. Export a layered PDF or editable PowerPoint.

## Notes

- The app is tuned for storybooks: full-page art, small amounts of overlaid
  text, and simple text regions.
- The OCR language field accepts raw Tesseract codes, so you can combine
  languages with `+` such as `eng+sqi`.
- Gemini OCR sends each rendered page image to Gemini and asks for exact story
  text lines with normalized bounding boxes. It is useful when Tesseract misses
  illustrated or low-contrast pages.
- The app persists settings in local storage and the most recent PDF in
  IndexedDB. Browsers do not allow file inputs to be visually refilled after a
  refresh, so the picker may look empty even when the PDF is restored.
- OCR filtering rejects low-confidence lines, oversized boxes, tiny fragments,
  non-text-like strings, and optional non-white-backed regions.
- Detected text sizes are normalized across the processed batch unless a text
  size override is provided.
- The font picker includes storybook-friendly Google Fonts. Uploaded custom
  TTF/OTF files are used for live preview and PDF embedding, and the most recent
  uploaded font is saved in IndexedDB.
- Cleanup mode defaults to **Local white repaint**, which uses canvas sampling
  to cover detected text without calling any image API. Use **OpenAI image edit**
  only for pages where text crosses detailed artwork.
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
