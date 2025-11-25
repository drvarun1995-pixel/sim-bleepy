# 🎯 Onboarding Tour Structure Documentation

**Last Updated:** December 2024  
**Project:** Bleepy Platform  
**Purpose:** Comprehensive guide to the onboarding tour system architecture

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tour Types](#tour-types)
3. [Tour Structure by Device](#tour-structure-by-device)
4. [Tour Flow Diagrams](#tour-flow-diagrams)
5. [Implementation Details](#implementation-details)
6. [Button Placement](#button-placement)
7. [Multi-Page Tour Chain](#multi-page-tour-chain)

---

## 🎯 Overview

The Bleepy onboarding system consists of three main tour categories, each serving different purposes and user needs:

| Tour Category | Purpose | Trigger | Scope |
|--------------|---------|---------|-------|
| **Full Tour** | Complete platform walkthrough | Profile page "Take a Tour" button | Multi-page (8 pages) |
| **Quick Tour** | Fast overview of key features | TBD | Single page or condensed |
| **Individual Short Tours** | Page-specific feature walkthrough | Page header buttons | Single page only |

---

## 🎨 Tour Types

### 1. Full Tour (Multi-Page Tour)

**Purpose:** Comprehensive onboarding experience that guides users through the entire platform sequentially.

**Current Implementation:**
- ✅ **MedEd Team Desktop** - Fully implemented
- ⏳ **Other Roles** - To be implemented

**Characteristics:**
- Multi-page navigation chain
- Automatic page transitions
- Dynamic button text ("Move to [Next Page]")
- Session storage persistence
- Role-specific content

**Flow for MedEd Team:**
```
Profile Page → Dashboard → Calendar → Events List → Formats → 
My Bookings → My Attendance → My Certificates → Event Data
```

**Button Behavior:**
- Last step shows "Move to [Next Page]" instead of "Finish Tour"
- Final page shows "Finish Tour"
- Automatically navigates to next page when tour completes

---

### 2. Quick Tour

**Purpose:** Fast-paced overview of essential features for users who want a quick introduction.

**Status:** ⏳ **To be implemented**

**Planned Characteristics:**
- Condensed version of Full Tour
- Focus on core features only
- Single page or minimal page transitions
- Faster completion time

---

### 3. Individual Short Tours (Page-Based Tours)

**Purpose:** Page-specific feature walkthroughs triggered by buttons on individual pages.

**Current Implementation:**
- ✅ Dashboard Tour
- ✅ Calendar Tour
- ✅ Events List Tour
- ✅ Formats Tour
- ⏳ Other pages (My Bookings, My Attendance, etc.)

**Characteristics:**
- Standalone tours (not part of multi-page chain)
- Triggered by page-specific buttons
- Desktop-only visibility
- Independent of Full Tour

**Button Placement:**
- Top right of page headers
- After "Smart Bulk Upload" button (if present)
- Desktop-only (`hidden lg:flex`)

---

## 📱 Tour Structure by Device

### Desktop Tours

| Tour Type | Availability | Button Location | Multi-Page |
|-----------|-------------|-----------------|------------|
| **Full Tour** | ✅ MedEd Team<br>⏳ Other Roles | Profile Page | ✅ Yes |
| **Quick Tour** | ⏳ TBD | TBD | ⏳ TBD |
| **Dashboard Tour** | ✅ All Roles | Welcome Section (top right) | ❌ No |
| **Calendar Tour** | ✅ All Roles | Header buttons (after Smart Bulk Upload) | ❌ No |
| **Events List Tour** | ✅ All Roles | Header buttons (after Request Teaching Event) | ❌ No |
| **Formats Tour** | ✅ All Roles | Header buttons (after Request Teaching Event) | ❌ No |

### Mobile Tours

| Tour Type | Availability | Notes |
|-----------|-------------|-------|
| **All Tours** | ❌ Not Available | Tours are desktop-only for better UX |

**Rationale:** Mobile screens have limited space, making tour tooltips and navigation challenging. Desktop provides optimal experience.

---

## 🔄 Tour Flow Diagrams

### Full Tour Flow (MedEd Team Desktop)

```
┌─────────────────┐
│  Profile Page   │
│  "Take a Tour"  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Dashboard     │────▶│ "Move to Calendar"│
│   (12 steps)    │     └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│    Calendar     │────▶│ "Move to Events" │
│   (7 steps)     │     └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Events List    │────▶│ "Move to Formats"│
│   (7 steps)     │     └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│    Formats      │────▶│ "Move to My Bookings"│
│   (TBD steps)   │     └──────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│  My Bookings    │────▶│ "Move to My Attendance"│
│   (TBD steps)   │     └──────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│ My Attendance   │────▶│ "Move to Certificates"│
│   (TBD steps)   │     └──────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│ My Certificates │────▶│ "Move to Event Data"  │
│   (TBD steps)   │     └──────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Event Data    │────▶│  "Finish Tour"   │
│   (TBD steps)   │     │  (Tour Complete) │
└─────────────────┘     └──────────────────┘
```

### Individual Short Tour Flow

```
┌─────────────────┐
│  Any Page       │
│  Tour Button    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Page Tour      │────▶│  "Finish Tour"   │
│  (Page-specific)│     │  (Tour Complete) │
└─────────────────┘     └──────────────────┘
```

---

## 🛠️ Implementation Details

### Full Tour Implementation

**Key Files:**
- `components/onboarding/OnboardingTourProvider.tsx` - Main tour orchestrator
- `components/onboarding/TakeTourButton.tsx` - Profile page trigger
- `lib/onboarding/steps/` - Tour step definitions
- Individual page files - Tour detection and auto-start logic

**Session Storage Flags:**
| Flag | Purpose | Set By | Cleared By |
|------|---------|--------|------------|
| `mededMultiPageTour` | Indicates multi-page tour is active | TakeTourButton | Final tour completion |
| `startTourAfterNavigation` | Timestamp for tour start after navigation | OnboardingTourProvider | Page tour detection |
| `nextTourType` | Type of tour to start on next page | OnboardingTourProvider | Page tour detection |
| `enablePersonalizedView` | Enable personalized view for certain tours | OnboardingTourProvider | Page tour detection |

**Navigation Logic:**
```typescript
Dashboard → /calendar (tourType: 'calendar')
Calendar → /events-list (tourType: 'events-list')
Events List → /formats (tourType: 'formats')
Formats → /my-bookings (tourType: 'my-bookings')
My Bookings → /my-attendance (tourType: 'my-attendance')
My Attendance → /mycertificates (tourType: 'my-certificates')
My Certificates → /event-data (tourType: 'event-data')
Event Data → (Tour Complete)
```

### Individual Short Tour Implementation

**Key Characteristics:**
- Standalone tours (no multi-page chain)
- Triggered by page-specific buttons
- No session storage flags needed
- Direct tour start

**Button Styling:**
```tsx
<Button
  onClick={handleStartTour}
  variant="secondary"
  className="hidden lg:flex bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
>
  <Sparkles className="h-4 w-4 mr-2" />
  Start [Page] Tour
</Button>
```

---

## 📍 Button Placement

### Full Tour Trigger

| Location | Component | Visibility | Styling |
|----------|-----------|------------|---------|
| Profile Page | `TakeTourButton.tsx` | All roles (meded_team only) | Purple gradient button |

### Individual Short Tour Triggers

| Page | Button Location | Visibility | Styling |
|------|----------------|------------|---------|
| **Dashboard** | Welcome section (top right) | Desktop only | Yellow secondary button |
| **Calendar** | Header buttons (after Smart Bulk Upload) | Desktop only | Yellow secondary button |
| **Events List** | Header buttons (after Request Teaching Event) | Desktop only | Yellow secondary button |
| **Formats** | Header buttons (after Request Teaching Event) | Desktop only | Yellow secondary button |
| **My Bookings** | TBD | Desktop only | Yellow secondary button |
| **My Attendance** | TBD | Desktop only | Yellow secondary button |
| **My Certificates** | TBD | Desktop only | Yellow secondary button |
| **Event Data** | TBD | Desktop only | Yellow secondary button |

---

## 🔗 Multi-Page Tour Chain

### Current Implementation Status

| Page | Tour Steps | Status | Next Page | Button Text |
|------|-----------|--------|-----------|-------------|
| **Dashboard** | 12 steps | ✅ Complete | Calendar | "Move to Calendar" |
| **Calendar** | 7 steps | ✅ Complete | Events List | "Move to Events" |
| **Events List** | 7 steps | ✅ Complete | Formats | "Move to Formats" |
| **Formats** | TBD | ⏳ Pending | My Bookings | "Move to My Bookings" |
| **My Bookings** | TBD | ⏳ Pending | My Attendance | "Move to My Attendance" |
| **My Attendance** | TBD | ⏳ Pending | My Certificates | "Move to My Certificates" |
| **My Certificates** | TBD | ⏳ Pending | Event Data | "Move to Event Data" |
| **Event Data** | TBD | ⏳ Pending | (Complete) | "Finish Tour" |

### Tour Step Counts

| Page | Steps | Estimated Duration |
|------|-------|-------------------|
| Dashboard | 12 | 8-10 minutes |
| Calendar | 7 | 5-7 minutes |
| Events List | 7 | 5-7 minutes |
| Formats | TBD | TBD |
| My Bookings | TBD | TBD |
| My Attendance | TBD | TBD |
| My Certificates | TBD | TBD |
| Event Data | TBD | TBD |

**Total Estimated Duration (Full Tour):** ~30-40 minutes (when all pages complete)

---

## 🎨 Button Text Logic

### Full Tour (Multi-Page)

The button text dynamically changes based on:
1. Current page in the tour chain
2. Whether `mededMultiPageTour` flag is set
3. Whether it's the last step of the current page

| Current Page | Last Step Button Text |
|--------------|----------------------|
| Dashboard | "Move to Calendar" |
| Calendar | "Move to Events" |
| Events List | "Move to Formats" |
| Formats | "Move to My Bookings" |
| My Bookings | "Move to My Attendance" |
| My Attendance | "Move to My Certificates" |
| My Certificates | "Move to Event Data" |
| Event Data | "Finish Tour" |

### Individual Short Tours

All individual short tours show **"Finish Tour"** on the last step, as they are standalone and don't navigate to other pages.

---

## 🔧 Technical Implementation

### Tour Detection Logic

Each page in the multi-page tour chain includes detection logic:

```typescript
useEffect(() => {
  if (pathname === '/[page]' && typeof window !== 'undefined' && 
      status === 'authenticated' && startTourWithSteps) {
    const tourTimestamp = sessionStorage.getItem('startTourAfterNavigation')
    const nextTourType = sessionStorage.getItem('nextTourType')
    
    if (tourTimestamp && nextTourType === '[tour-type]') {
      // Start tour logic
    }
  }
}, [pathname, status, startTourWithSteps, ...])
```

### Button Text Customization

The button text is customized in `OnboardingTourProvider.tsx`:

```typescript
const customLocale = useMemo(() => {
  const isMultiPageTour = sessionStorage.getItem('mededMultiPageTour') === 'true'
  const isLastStep = stepIndex === steps.length - 1
  const currentPath = pathname || window.location.pathname
  
  // Determine button text based on current page
  let lastButtonText = 'Finish Tour'
  if (isMultiPageTour && isLastStep) {
    if (currentPath === '/dashboard') {
      lastButtonText = 'Move to Calendar'
    } else if (currentPath === '/calendar' || currentPath === '/events') {
      lastButtonText = 'Move to Events'
    }
    // ... more conditions
  }
  
  return { last: lastButtonText, ... }
}, [stepIndex, steps.length, pathname])
```

---

## 📊 Summary Table

| Tour Category | Type | Pages | Trigger | Multi-Page | Desktop Only |
|--------------|------|-------|---------|------------|--------------|
| **Full Tour** | Comprehensive | 8 pages | Profile "Take a Tour" | ✅ Yes | ✅ Yes |
| **Quick Tour** | Condensed | TBD | TBD | ⏳ TBD | ✅ Yes |
| **Dashboard Tour** | Page-specific | 1 page | Welcome section button | ❌ No | ✅ Yes |
| **Calendar Tour** | Page-specific | 1 page | Header button | ❌ No | ✅ Yes |
| **Events List Tour** | Page-specific | 1 page | Header button | ❌ No | ✅ Yes |
| **Formats Tour** | Page-specific | 1 page | Header button | ❌ No | ✅ Yes |

---

## 🚀 Future Enhancements

### Planned Features

1. **Quick Tour Implementation**
   - Condensed version of Full Tour
   - Focus on essential features only
   - Faster completion time

2. **Additional Individual Tours**
   - My Bookings Tour
   - My Attendance Tour
   - My Certificates Tour
   - Event Data Tour

3. **Role-Specific Full Tours**
   - Student Full Tour
   - Educator Full Tour
   - CTF Full Tour

4. **Tour Analytics**
   - Completion rates
   - Drop-off points
   - User feedback collection

---

## 📝 Notes

- All tours are **desktop-only** for optimal user experience
- Individual short tours are **independent** and don't affect the Full Tour
- Full Tour uses **session storage** for state persistence across page navigations
- Button text dynamically changes based on tour context and current page
- Tour steps are defined in `lib/onboarding/steps/` directory

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintained By:** Development Team

