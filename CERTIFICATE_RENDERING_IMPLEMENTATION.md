## Certificate Rendering Implementation

This note captures how the automated certificate pipeline currently renders text onto templates and where each concern is implemented.

### Rendering Library
- The generator dynamically imports `@napi-rs/canvas` inside `lib/certificate-generator.ts`.
- Functions used: `createCanvas`, `loadImage`, and `GlobalFonts`.
- Code: `lib/certificate-generator.ts`, `generateCertificateImage()` (around the `import('@napi-rs/canvas')` statement).

-### Font Registration Flow
- Dependency: `@fontsource/inter` (installed via npm) plus a legacy fallback copy in `public/fonts/Inter-Regular.ttf`.
- Helper: `ensureFontRegistered(globalFonts)` in `lib/certificate-generator.ts`.
- Behaviour:
  - Iterates candidate paths, preferring the packaged font at `node_modules/@fontsource/inter/files/inter-latin-400-normal.ttf`, then falling back to `public/fonts/Inter-Regular.ttf`.
  - If `GlobalFonts.registerFromPath` exists, calls it and coerces the result to boolean.
  - Otherwise reads the font into a buffer and invokes `GlobalFonts.register(...)`.
  - Tracks state via `REGISTERED_FONTS[DEFAULT_FONT_FAMILY]` to avoid duplicate registrations.
  - Emits `CERT_DEBUG` logs containing the resolved path, readiness, and candidate list when registration fails.
- Implementation references: top section of `lib/certificate-generator.ts` (definitions of `DEFAULT_FONT_FAMILY`, `REGISTERED_FONTS`, `getFontPath`, `CanvasGlobalFonts` type, and the `ensureFontRegistered` function).

### Text Drawing Pipeline
- Rendering happens with the standard 2D canvas context.
- Steps inside the field loop (`generateCertificateImage`):
  1. Resolve text via `getFieldValue` + template fallback.
  2. Normalize the font stack (`resolveFontStack`, `formatFontStack`).
  3. Set `ctx.font = \\"${fontWeight} ${scaledFontSize}px ${fontFamily}\\"`.
  4. Draw each wrapped line using `ctx.fillText`.
  5. When `CERT_DEBUG=1`, stroke a semi-transparent rectangle to visualise the target area.
- Implementation: `lib/certificate-generator.ts`, inside the `for (const field of fields)` loop in `generateCertificateImage`.

### Helpers in Use
- `ensureFontRegistered` is the only font-specific helper invoked. No secondary helpers (e.g. `ensureInterRegistered`) exist elsewhere.
- Additional text utilities: `resolveFontStack`, `formatFontStack`, `wrapText`, and `getFieldValue` all live in the same file (`lib/certificate-generator.ts`).

### Runtime Selection
- The API route that triggers generation exports `runtime = 'nodejs'`, ensuring the function executes in the Node.js environment rather than Edge.
- File: `app/api/certificates/auto-generate/route.ts` (top-level constant).

### Key Files & Pointers
- `lib/certificate-generator.ts`
  - `generateCertificateImage()` — main rendering logic and field loop.
  - `ensureFontRegistered()` — font registration helper.
  - `resolveFontStack`, `formatFontStack`, `wrapText`, `getFieldValue` — supporting utilities.
- `app/api/certificates/auto-generate/route.ts`
  - Entry point for the cron/API call.
  - Declares `export const runtime = 'nodejs'`.

### Current Debug Signals
- When `CERT_DEBUG=1`, the generator logs:
  - Field metadata (`resolvedText`, font stack, bounding boxes).
  - Font readiness (`fontReady`, cache status, `GlobalFonts.has`).
  - Uploads `*.debug.json` alongside the PNG to Supabase Storage for post-run inspection.


