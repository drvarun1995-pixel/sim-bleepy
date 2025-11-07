# 🎯 Bleepy Onboarding Tour - Implementation Plan

**Last Updated:** November 2025  
**Project:** Bleepy Platform  
**Purpose:** Interactive onboarding tour for first-time users (excluding admins)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Roles Included](#user-roles-included)
3. [Features & Flow](#features--flow)
4. [Dependencies](#dependencies)
5. [Components Architecture](#components-architecture)
6. [Database Schema](#database-schema)
7. [Implementation Flow](#implementation-flow)
8. [Tour Steps by Role](#tour-steps-by-role)
9. [Integration Points](#integration-points)
10. [UI/UX Considerations](#uiux-considerations)
11. [Technical Specifications](#technical-specifications)

---

## 🎯 Overview

### Purpose
Create an interactive, guided tour that helps new users (students, educators, meded_team, ctf) understand the platform's features and navigate key functionalities on their first login. The tour should also be accessible from the profile page for users who want to revisit it.

### Goals
- **Reduce learning curve** for new users
- **Increase feature adoption** by highlighting important functionality
- **Improve user engagement** by showing value early
- **Provide contextual help** at the right moments
- **Allow re-access** for users who want to review

### Key Principles
- **Non-intrusive:** Users can skip or exit at any time
- **Role-specific:** Content adapts to user's role and permissions
- **Progressive disclosure:** Show features in logical order
- **Visual guidance:** Use tooltips, highlights, and animations
- **Persistent preference:** Remember if user completed/skipped tour

---

## 👥 User Roles Included

### ✅ Included Roles
1. **Student** (`student`)
2. **Educator** (`educator`)
3. **MedEd Team** (`meded_team`)
4. **CTF** (`ctf`)

### ❌ Excluded Roles
- **Admin** (`admin`) - Admins are assumed to have platform knowledge

---

## 🎨 Features & Flow

### Main Features

1. **Auto-Launch on First Login**
   - Detects if user has never completed onboarding
   - Automatically launches tour after successful authentication
   - Shows welcome modal before starting tour

2. **Profile Page Access**
   - "Take a Tour" button prominently placed at top of profile page
   - Allows users to restart tour anytime
   - Shows completion status badge

3. **Role-Specific Content**
   - Different tour steps based on user role
   - Highlights features relevant to user's permissions
   - Customized messaging for each role

4. **Progress Tracking**
   - Shows progress indicator (e.g., "Step 3 of 8")
   - Allows navigation: Previous/Next buttons
   - Skip option available at any time

5. **Interactive Elements**
   - Highlights target elements with spotlight
   - Smooth scrolling to out-of-view elements
   - Tooltips with helpful explanations
   - Visual indicators (arrows, pulsing effects)

6. **Persistence & Preferences**
   - Tracks completion status in database
   - Remembers user preference (completed/skipped)
   - Option to "Don't show again" checkbox
   - Can reset tour completion (admin feature)

### User Flow

```
┌─────────────────┐
│  User Logs In   │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ Check: First Login?  │
└────────┬─────────────┘
         │
    Yes  │  No
    │    │
    ▼    ▼
┌──────────────┐    ┌──────────────┐
│ Show Welcome │    │ Normal Login │
│   Modal      │    │   Flow       │
└──────┬───────┘    └──────────────┘
       │
       ▼
┌──────────────────────┐
│ Start Role-Specific  │
│   Tour Steps         │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ User Navigates       │
│ (Next/Prev/Skip)     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Tour Complete        │
│ Mark as Completed    │
└──────────────────────┘
```

---

## 📦 Dependencies

### Primary Dependency: **react-joyride**

```json
{
  "react-joyride": "^2.5.2"
}
```

**Why react-joyride?**
- ✅ Mature and well-maintained library
- ✅ Excellent TypeScript support
- ✅ Highly customizable
- ✅ Smooth animations and transitions
- ✅ Built-in spotlight feature
- ✅ Works well with React/Next.js
- ✅ Good documentation and community support
- ✅ Handles dynamic content and scrolling
- ✅ Accessible (a11y) by default

### Alternative Options Considered

1. **intro.js** - Simpler but less customizable
2. **driver.js** - Good but less React-native
3. **shepherd.js** - Overkill for this use case
4. **reactour** - Good alternative, but react-joyride is more feature-rich

### Additional Dependencies

```json
{
  "@types/react-joyride": "^2.4.0"  // TypeScript types
}
```

### Optional Dependencies (for enhanced UX)

```json
{
  "framer-motion": "^12.23.21"  // Already installed - for smooth animations
}
```

---

## 🏗️ Components Architecture

### 1. **OnboardingTourProvider** (`components/onboarding/OnboardingTourProvider.tsx`)

**Purpose:** Context provider that manages tour state globally

**Responsibilities:**
- Manages tour active state
- Handles tour step progression
- Persists completion status
- Provides tour control functions (start, stop, reset)

**Props:**
```typescript
interface OnboardingTourProviderProps {
  children: React.ReactNode
  role: 'student' | 'educator' | 'meded_team' | 'ctf'
  userId: string
}
```

**Context Value:**
```typescript
interface OnboardingTourContextValue {
  isTourActive: boolean
  startTour: () => void
  stopTour: () => void
  resetTour: () => void
  hasCompletedTour: boolean
}
```

---

### 2. **OnboardingTour** (`components/onboarding/OnboardingTour.tsx`)

**Purpose:** Main tour component that wraps react-joyride

**Responsibilities:**
- Renders react-joyride with role-specific steps
- Handles tour callbacks (onStart, onEnd, onSkip)
- Manages step navigation
- Integrates with OnboardingTourProvider

**Props:**
```typescript
interface OnboardingTourProps {
  steps: Step[]
  role: 'student' | 'educator' | 'meded_team' | 'ctf'
  continuous?: boolean
  showProgress?: boolean
  showSkipButton?: boolean
}
```

---

### 3. **WelcomeModal** (`components/onboarding/WelcomeModal.tsx`)

**Purpose:** Welcome screen shown before tour starts

**Features:**
- Welcome message customized by role
- Brief overview of what user will learn
- "Start Tour" button
- "Skip Tour" option
- "Don't show again" checkbox

---

### 4. **TourStepDefinition** (`lib/onboarding/tourSteps.ts`)

**Purpose:** Centralized definition of all tour steps by role

**Structure:**
```typescript
interface TourStep {
  target: string  // CSS selector or ref
  content: React.ReactNode | string
  title?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
  disableBeacon?: boolean
  disableOverlayClose?: boolean
  spotlightClicks?: boolean
  spotlightPadding?: number
}

type TourStepsByRole = {
  student: TourStep[]
  educator: TourStep[]
  meded_team: TourStep[]
  ctf: TourStep[]
}
```

---

### 5. **TakeTourButton** (`components/onboarding/TakeTourButton.tsx`)

**Purpose:** Button component for profile page

**Features:**
- Prominently placed at top of profile page
- Shows completion badge if tour completed
- Triggers tour start
- Accessible styling

---

### 6. **useOnboardingTour** (`hooks/useOnboardingTour.ts`)

**Purpose:** Custom hook for easy tour access

**Usage:**
```typescript
const { startTour, isTourActive, hasCompletedTour } = useOnboardingTour()
```

---

### 7. **OnboardingCheck** (`components/onboarding/OnboardingCheck.tsx`)

**Purpose:** Component that checks first login and auto-launches tour

**Integration:**
- Used in dashboard layout or root layout
- Runs on mount after authentication
- Checks database for completion status
- Shows welcome modal if needed

---

## 🗄️ Database Schema

### New Column in `users` Table

```sql
ALTER TABLE users 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed_at TIMESTAMP,
ADD COLUMN onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_skipped_at TIMESTAMP,
ADD COLUMN onboarding_never_show BOOLEAN DEFAULT FALSE;
```

### Migration File: `supabase/migrations/add_onboarding_fields.sql`

```sql
-- Add onboarding tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_never_show BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_status 
ON users(onboarding_completed, onboarding_skipped);
```

---

## 🔄 Implementation Flow

### Phase 1: Setup & Infrastructure

1. **Install Dependencies**
   ```bash
   npm install react-joyride @types/react-joyride
   ```

2. **Database Migration**
   - Create migration file
   - Run migration on Supabase
   - Verify schema changes

3. **Create Base Components**
   - OnboardingTourProvider
   - OnboardingTour
   - WelcomeModal
   - TakeTourButton
   - OnboardingCheck

### Phase 2: Core Functionality

4. **API Endpoints**
   - `POST /api/onboarding/complete` - Mark tour as completed
   - `POST /api/onboarding/skip` - Mark tour as skipped
   - `GET /api/onboarding/status` - Get user's onboarding status
   - `POST /api/onboarding/reset` - Reset completion (for testing/admin)

5. **Tour Step Definitions**
   - Define steps for each role in `lib/onboarding/tourSteps.ts`
   - Map steps to actual page elements using CSS selectors
   - Add data attributes to target elements if needed

6. **Context Integration**
   - Wrap app with OnboardingTourProvider
   - Integrate with existing auth system
   - Connect to user profile data

### Phase 3: Integration

7. **Auto-Launch Logic**
   - Add OnboardingCheck to dashboard layout
   - Implement first-login detection
   - Show welcome modal conditionally

8. **Profile Page Integration**
   - Add TakeTourButton to all profile pages
   - Position at top of profile content
   - Style consistently across roles

9. **Page-Specific Targets**
   - Add `data-tour` attributes to key elements
   - Ensure selectors are stable and unique
   - Test scrolling and positioning

### Phase 4: Refinement

10. **Styling & Theming**
    - Customize react-joyride theme to match Bleepy design
    - Add animations using framer-motion
    - Ensure responsive design

11. **Accessibility**
    - Test keyboard navigation
    - Ensure screen reader compatibility
    - Add ARIA labels where needed

12. **Testing & QA**
    - Test for each role
    - Verify database persistence
    - Test edge cases (skipping, navigating away)
    - Cross-browser testing

---

## 📍 Tour Steps by Role

### 🎓 Student Tour (8-10 steps)

1. **Dashboard Overview**
   - Target: Main dashboard container
   - Content: "Welcome to your dashboard! Here's where you'll see your upcoming events, progress, and quick actions."

2. **Navigation Sidebar**
   - Target: Dashboard sidebar
   - Content: "Use this sidebar to navigate between different sections of the platform."

3. **Upcoming Events**
   - Target: Upcoming events card
   - Content: "View and manage your upcoming event bookings here."

4. **AI Patient Simulator**
   - Target: Stations link in sidebar
   - Content: "Practice medical scenarios with our AI-powered patient simulator. You get 3 attempts per day."

5. **Calendar View**
   - Target: Calendar link
   - Content: "View all events in a calendar format for easy planning."

6. **Events List**
   - Target: Events link
   - Content: "Browse and search through all available teaching events."

7. **My Bookings**
   - Target: My Bookings link
   - Content: "See all your registered events and manage your bookings."

8. **My Certificates**
   - Target: My Certificates link
   - Content: "Download certificates you've earned from completed events."

9. **Profile Settings**
   - Target: Profile/Settings link
   - Content: "Update your profile, preferences, and account settings here."

10. **Progress Tracking**
    - Target: Progress/Overview link
    - Content: "Track your learning progress and achievements over time."

---

### 👨‍🏫 Educator Tour (10-12 steps)

**Includes all Student steps PLUS:**

11. **Announcements**
    - Target: Announcements link
    - Content: "Create and manage announcements for students."

12. **File Requests**
    - Target: File Requests link
    - Content: "View and respond to file requests from students."

13. **Teaching Requests**
    - Target: Teaching Requests link
    - Content: "Manage requests for teaching sessions or content."

14. **Resource Management**
    - Target: Downloads/Resources section
    - Content: "Upload and manage educational resources for your students."

15. **Booking Management**
    - Target: Bookings link (if visible)
    - Content: "View and manage bookings for events you're involved in."

---

### 🏥 MedEd Team Tour (12-15 steps)

**Includes all Educator steps PLUS:**

16. **Event Data Management**
    - Target: Event Data link
    - Content: "Create, edit, and manage all teaching events on the platform."

17. **Bulk Event Upload**
    - Target: Bulk Upload option (if visible)
    - Content: "Upload multiple events at once using Excel or CSV files."

18. **QR Code Management**
    - Target: QR Codes link
    - Content: "Generate QR codes for event attendance tracking."

19. **Attendance Tracking**
    - Target: Attendance Tracking link
    - Content: "Track and manage attendance for all events."

20. **Feedback Management**
    - Target: Feedback link
    - Content: "View and analyze feedback submitted for events."

21. **Certificate Management**
    - Target: Certificates link
    - Content: "Generate and manage certificates for event completion."

22. **Contact Messages**
    - Target: Contact Messages link
    - Content: "View and respond to messages from platform users."

23. **Student Cohorts**
    - Target: Student Cohorts link
    - Content: "View analytics and manage student cohort data."

---

### 🎯 CTF Tour (12-15 steps)

**Identical to MedEd Team Tour**
- Same steps as MedEd Team
- Same features and functionality
- Customized messaging for CTF role

---

## 🔌 Integration Points

### 1. **Root/Dashboard Layout**

```typescript
// app/dashboard/layout.tsx
import { OnboardingCheck } from '@/components/onboarding/OnboardingCheck'
import { OnboardingTourProvider } from '@/components/onboarding/OnboardingTourProvider'

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions)
  const role = await getUserRole(session.user.email)
  
  return (
    <OnboardingTourProvider role={role} userId={session.user.id}>
      <OnboardingCheck role={role} userId={session.user.id} />
      {children}
    </OnboardingTourProvider>
  )
}
```

### 2. **Profile Pages**

```typescript
// app/dashboard/[role]/profile/page.tsx
import { TakeTourButton } from '@/components/onboarding/TakeTourButton'

export default function ProfilePage() {
  return (
    <div>
      <TakeTourButton />
      {/* Rest of profile content */}
    </div>
  )
}
```

### 3. **API Routes**

```typescript
// app/api/onboarding/complete/route.ts
export async function POST(request: Request) {
  // Mark onboarding as completed
  // Update database
  // Return success
}

// app/api/onboarding/status/route.ts
export async function GET(request: Request) {
  // Get user's onboarding status
  // Return completion state
}
```

### 4. **Data Attributes on Target Elements**

```typescript
// Add to key elements across pages
<div data-tour="dashboard-main">...</div>
<nav data-tour="sidebar">...</nav>
<a href="/stations" data-tour="ai-simulator">...</a>
```

---

## 🎨 UI/UX Considerations

### Design Principles

1. **Visual Hierarchy**
   - Spotlight should draw attention without being overwhelming
   - Tooltips should be clear and concise
   - Progress indicator should be visible but not intrusive

2. **Color Scheme**
   - Use Bleepy brand colors (purple/blue gradient)
   - High contrast for accessibility
   - Subtle animations for engagement

3. **Responsive Design**
   - Tour should work on mobile, tablet, desktop
   - Adjust tooltip placement for smaller screens
   - Touch-friendly buttons

4. **Accessibility**
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader announcements
   - Focus management
   - ARIA labels on all interactive elements

### Custom Styling

```css
/* Custom react-joyride theme */
.react-joyride__tooltip {
  /* Match Bleepy design system */
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.react-joyride__beacon {
  /* Pulsing animation */
}

.react-joyride__overlay {
  /* Dimmed background */
  background: rgba(0,0,0,0.5);
}
```

---

## 🔧 Technical Specifications

### Performance Considerations

1. **Lazy Loading**
   - Load tour component only when needed
   - Use dynamic imports for tour steps

2. **Caching**
   - Cache onboarding status in session
   - Avoid repeated database queries

3. **Bundle Size**
   - react-joyride is ~15KB gzipped
   - Acceptable for the value it provides

### Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Error Handling

1. **Missing Elements**
   - Skip steps if target element not found
   - Log warnings for debugging
   - Graceful degradation

2. **API Failures**
   - Retry logic for completion status
   - Fallback to localStorage for temporary storage
   - User-friendly error messages

3. **Navigation During Tour**
   - Pause tour if user navigates away
   - Resume from last step on return
   - Save progress state

---

## 📝 Testing Checklist

### Functional Testing

- [ ] Tour launches on first login for each role
- [ ] Tour can be started from profile page
- [ ] All steps display correctly for each role
- [ ] Navigation (Next/Prev/Skip) works
- [ ] Completion status saves to database
- [ ] Skip functionality works
- [ ] "Don't show again" persists
- [ ] Tour can be reset (admin/testing)

### Visual Testing

- [ ] Spotlight highlights correct elements
- [ ] Tooltips position correctly
- [ ] Responsive design works on all screen sizes
- [ ] Animations are smooth
- [ ] Colors match brand guidelines

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces steps
- [ ] Focus management is correct
- [ ] High contrast mode works

### Integration Testing

- [ ] Works with existing auth flow
- [ ] Doesn't interfere with other features
- [ ] Database updates correctly
- [ ] API endpoints function properly

---

## 🚀 Future Enhancements

1. **Analytics Integration**
   - Track tour completion rates
   - Measure feature adoption post-tour
   - A/B test different tour flows

2. **Advanced Features**
   - Interactive hotspots instead of linear tour
   - Video tutorials embedded in steps
   - Multi-language support

3. **Admin Features**
   - Customize tour steps from admin panel
   - View onboarding analytics
   - Reset tours for users

4. **Contextual Help**
   - Inline help buttons that trigger mini-tours
   - Context-aware tooltips throughout app
   - Searchable help center integration

---

## 📚 Resources

- [react-joyride Documentation](https://docs.react-joyride.com/)
- [react-joyride GitHub](https://github.com/gilbarbara/react-joyride)
- [Accessibility Guidelines](https://www.w3.org/WAI/ARIA/apg/)
- [Bleepy Design System](./design-system.md) (if exists)

---

## ✅ Implementation Summary

This plan provides a comprehensive roadmap for implementing an interactive onboarding tour system for Bleepy. The system will:

- ✅ Auto-launch on first login (excluding admins)
- ✅ Be accessible from profile pages
- ✅ Provide role-specific content
- ✅ Track completion status
- ✅ Be fully customizable and maintainable
- ✅ Follow accessibility best practices
- ✅ Integrate seamlessly with existing codebase

**Estimated Implementation Time:** 2-3 days for full implementation and testing

**Priority:** High - Improves user onboarding and feature adoption

---

**Document Status:** Ready for Implementation  
**Last Reviewed:** November 2025  
**Next Review:** After Phase 1 completion

