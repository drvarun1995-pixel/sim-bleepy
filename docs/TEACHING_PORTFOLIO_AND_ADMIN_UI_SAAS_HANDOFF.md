# Teaching Portfolio Excel + User Management header (Sim Bleepy → Bleepy App)

Two small UI/product fixes to copy into the multi-tenant Bleepy app. **Not** the walk-in guest claim work.

Sim Bleepy production: `sim.bleepy.co.uk`. SaaS target: `bleepy-app` / tenant hostnames. Port the behaviour, not this Vercel project.

---

## 1. Teaching Portfolio evidence accepts Excel

Faculty feedback often arrives as a spreadsheet. Evidence upload must allow **`.xls` and `.xlsx`**, not only images / PDF / Word / PowerPoint.

**Rule:** one shared allow-list for the file picker, the client toast, and the upload API. Do not hardcode `accept="…"` in two places and forget the server. Check **MIME or extension** — some browsers send an empty type for Excel.

Allowed: `jpg`, `jpeg`, `png`, `pdf`, `doc`, `docx`, `ppt`, `pptx`, `xls`, `xlsx`. Max **25 MB**.

Helper copy: “jpg, png, pdf, Word, PowerPoint, or Excel. Max 25MB.”

**Where (Sim Bleepy)**

| File | Role |
|---|---|
| `lib/teaching-portfolio.ts` | `TEACHING_PORTFOLIO_ALLOWED_TYPES`, `TEACHING_PORTFOLIO_ALLOWED_EXTENSIONS`, `TEACHING_PORTFOLIO_ACCEPT`, `isAllowedTeachingPortfolioFile()` |
| `app/teaching-portfolio/page.tsx` | Add-entry picker, attach-evidence picker, helper text |
| `app/api/teaching-portfolio/upload/route.ts` | Same helper |

SaaS: same list on the tenant teaching-portfolio upload. Do not add `.xlsm` unless asked.

Shipped on Sim Bleepy (`ab8ce088`).

---

## 2. User Management header must wrap on small screens

The User Management title row used `flex items-center justify-between` with no wrap. On a ~430px preview, **Add User** sat on top of “Management” and **Refresh Data** was clipped.

**Rule:** stack the title and the button group below `lg`. Let the buttons `flex-wrap` with `shrink-0` so they never overlap the heading. Tour button stays hidden until large screens (`hidden lg:flex`).

```
flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between
  title: min-w-0; h1 text-2xl sm:text-3xl
  buttons: flex flex-wrap items-center gap-2 sm:gap-3
```

**Where:** `components/admin/UserManagementContent.tsx` (header only). Apply the same pattern to any SaaS admin header that puts three actions next to a long title.

Shipped on Sim Bleepy (`11ff094f`).

---

## 3. Teaching Portfolio: more than one evidence file per entry

A session can have a certificate **and** a feedback spreadsheet. One `file_path` on the session row is not enough.

**Rule:** the session/learning row stays one record. Do not clone the session for each file. Cap at **10 files**, **25 MB each**, same allow-list as section 1 (including Excel).

### What staff see

- Add session: file picker is `multiple`. They can add and remove files before save.
- Existing session: **Add files** stays available until 10. Do **not** return “Evidence already uploaded”.
- Each file: Open / Download / Remove (removes that file only, not the session).
- Delete session: remove every storage object for that entry.
- Export ZIP: every file, unique names (`date_title_original.ext`). Word/Excel “evidence” cell lists all names.

### Database — do this on Bleepy App (preferred)

Use a child table. Do **not** copy Sim Bleepy’s JSON-on-`description` shortcut.

File: `supabase/migrations/20260909_teaching_portfolio_evidence.sql`

```sql
CREATE TABLE IF NOT EXISTS public.teaching_portfolio_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.teaching_portfolio_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  mime_type TEXT,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Backfill existing `file_path` rows. Mirror the first file on the parent (`file_path`, `original_filename`, …) so “has evidence” still works. Clear those columns when the last child is deleted. RLS: service-role only. Add `organisation_id` if you isolate tenants.

### Sim Bleepy implementation (already shipped this way)

No new table on this project. Extra files are stored as JSON on the existing `description` column:

`{"v":1,"files":[{id, entry_id, filename, original_filename, file_size, file_type, mime_type, file_path, created_at}]}`

The first file is also copied onto the parent `file_path` columns. Download/delete one file: `/api/teaching-portfolio/evidence/[id]`. Upload accepts repeated `file` fields.

| File | Role |
|---|---|
| `lib/teaching-portfolio.ts` | `TEACHING_PORTFOLIO_MAX_FILES`, `entryEvidenceFiles()` |
| `lib/teaching-portfolio-server.ts` | Store, parse/save JSON list, find/delete one file |
| `app/api/teaching-portfolio/upload/route.ts` | Repeated `file` fields; attach to existing entry |
| `app/api/teaching-portfolio/evidence/[id]/route.ts` | GET / DELETE one file |
| `app/api/teaching-portfolio/files/*` | List with `evidence[]`; delete session + all storage |
| `app/api/teaching-portfolio/download-all/route.ts` | Zip every file |
| `app/teaching-portfolio/page.tsx` | Multi picker + per-file actions |
