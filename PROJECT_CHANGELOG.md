# Bleepy Project Changelog

**Last Updated:** August 11, 2026

This document tracks all significant changes, improvements, and fixes made to the Bleepy platform.

---

## August 11, 2026

### ✨ New Features & Improvements

#### Attendance, walk-ins & guest flows
- Dedicated attendance analytics page with funnel, charts, no-shows, search/filters
- Walk-in registration gated under QR; certificates when booking or QR enabled
- Guest feedback/certificate links; original PNG certificate email attachments
- Early reject for expired QR codes; clearer feedback-gated certificate emails

#### Event management
- Unsaved-leave confirmation on Add/Edit Event and Smart Bulk Upload
- Smart Bulk Upload auto-assigns formats from Excel when present
- Bulk delete for organisers and locations on Event Data

#### Operations
- System logs (`/logs`) automatically deleted after 14 days via nightly data-retention cron

---

## November 7, 2025

### 🐛 Bug Fixes

#### Homepage Redesign Visibility
- **Issue:** Homepage redesign from previous day was not visible on local server
- **Fix:** Cleared Next.js build cache (`.next` folder) to resolve caching issues
- **Files Modified:**
  - Build cache cleared (no code changes needed)
- **Impact:** Homepage now displays correctly with all redesign features including:
  - Hero section with Basildon Hospital Teaching Hub
  - Student Groups Quick View (ARU, UCL, Foundation Year)
  - Teaching Calendar section
  - AI Simulator Preview section

#### Placements Page Lightbox Issues
- **Issue:** Image lightbox on mobile was disappearing after opening, leaving only the modal backdrop
- **Issue:** Accessibility warning: `DialogContent` requires a `DialogTitle` for screen readers
- **Issue:** TypeError: "can't access property" when accessing image array
- **Fixes:**
  1. Added `DialogTitle` component (visually hidden) for accessibility compliance
  2. Implemented proper error handling with React state (`imageLoadError`)
  3. Added bounds checking to prevent `currentImageIndex` from going out of bounds
  4. Added `useEffect` to ensure `currentImageIndex` stays within valid range
  5. Improved image loading error handling with retry functionality
  6. Added safety checks in navigation button handlers
  7. Added `aria-label` attributes to navigation buttons for better accessibility
- **Files Modified:**
  - `app/placements/[slug]/[pageSlug]/page.tsx`
- **Impact:** 
  - Lightbox now works correctly on mobile devices
  - Images no longer disappear unexpectedly
  - Accessibility warnings resolved
  - No more TypeError when navigating images
  - Better user experience with error messages and retry functionality

### 📝 Documentation Updates

#### Date Corrections
- Updated all documents that incorrectly showed "January 2025" to "November 2025"
- **Files Updated:**
  - `SETUP_INSTRUCTIONS_GDPR.md`
  - `DPIA_BLEEPY_PLATFORM.md`
  - `GDPR_MITIGATIONS_IMPLEMENTED.md`
  - `DSAR_PROCEDURE.md`
  - `DATA_BREACH_RESPONSE_PROCEDURE.md`
  - `BUSINESS_PLAN_NHS_SAAS.md`
  - `app/privacy/page.tsx`
  - `app/terms/page.tsx`
  - `app/cookies/page.tsx`

### 🚀 Deployment

- **Commit:** `ff4a5b4`
- **Branch:** `main`
- **Status:** ✅ Deployed to Vercel Production
- **Production URL:** https://sim-bleepy-7snuatvl7-varun-tyagis-projects-bc296ee6.vercel.app

---

## Previous Updates

*(This changelog will be maintained going forward. Previous updates can be added here as needed.)*

---

## How to Use This Changelog

- **Date Format:** YYYY-MM-DD
- **Categories:**
  - 🐛 Bug Fixes
  - ✨ New Features
  - 🔧 Improvements
  - 📝 Documentation
  - 🔒 Security
  - 🚀 Deployment
  - ⚠️ Breaking Changes

- **For each entry, include:**
  - Clear description of what changed
  - Files modified
  - Impact on users/developers
  - Any migration steps if needed

---

**Note:** This changelog is maintained manually. Please update it whenever significant changes are made to the project.

