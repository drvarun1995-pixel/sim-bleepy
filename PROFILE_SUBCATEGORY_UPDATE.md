# Profile Subcategory Selection Update

## Overview
Updated the profile completion and event filtering logic to make subcategory selection (e.g., ARU Year 1-5, UCL Year 1-6, Foundation Year 1-2) **optional** while still showing relevant events for the main category.

## Problem
Previously, users were required to select both a main category (ARU, UCL, Foundation Doctor) AND a subcategory (specific year). If they didn't select a subcategory, the event filtering would exclude relevant events.

## Solution
Users can now:
1. Select just the main category (ARU, UCL, or Foundation Doctor) to see ALL events for that category
2. Optionally select a specific subcategory (year) to see more targeted events

## Changes Made

### 1. Event Filtering Logic (`lib/event-filtering.ts`)

#### Medical Students
- **Without Year Selection**: If a user selects ARU or UCL but no specific year, they see ALL events for that university (including year-specific events like "ARU Year 1", "ARU Year 2", etc.)
- **With Year Selection**: If they select a specific year (e.g., Year 2), they see:
  - Events for their specific year (e.g., "ARU Year 2")
  - General university events (e.g., "ARU General")
  - "All years" events
  - But NOT events for other years (e.g., "ARU Year 3")

#### Foundation Doctors
- **Without FY Selection**: If a user selects Foundation Doctor but no specific FY1/FY2, they see ALL foundation year events (including both FY1 and FY2 specific events)
- **With FY Selection**: If they select FY1 or FY2, they see:
  - Events for their specific foundation year
  - General foundation events
  - "All roles" events

### 2. Onboarding Validation (`app/onboarding/profile/page.tsx`)

Updated the validation logic to make subcategories optional:

**Medical Students**:
- ✅ Required: University (ARU or UCL)
- ✅ Optional: Year of Study

**Foundation Doctors**:
- ✅ Optional: Foundation Year (FY1 or FY2)

### 3. UI Updates

#### StudentDetails Component (`components/onboarding/StudentDetails.tsx`)
- Changed "Year of Study *" to "Year of Study (Optional)"
- Updated placeholder text to "Select your year (optional)"
- Added helpful text: "Leave blank to see all [university] events, or select a year for more targeted content"
- Updated info card to explain the behavior

#### FoundationYearDetails Component (`components/onboarding/FoundationYearDetails.tsx`)
- Changed "Foundation Year *" to "Foundation Year (Optional)"
- Updated info card to explain: "If you select FY1 or FY2, you'll see events tailored to your level. If you skip this, you'll see all foundation year events including both FY1 and FY2."

## User Experience

### Scenario 1: ARU Student Without Year
- User selects: ARU (no year)
- Events shown: All ARU events including "ARU Year 1", "ARU Year 2", "ARU General", etc.

### Scenario 2: ARU Student With Year 2
- User selects: ARU + Year 2
- Events shown: "ARU Year 2" events + "ARU General" events + "All Years" events
- Events hidden: "ARU Year 1", "ARU Year 3", etc.

### Scenario 3: Foundation Doctor Without Year
- User selects: Foundation Doctor (no FY specified)
- Events shown: All foundation events including "FY1", "FY2", and general foundation events

### Scenario 4: Foundation Doctor With FY1
- User selects: Foundation Doctor + FY1
- Events shown: FY1-specific events + general foundation events
- Events hidden: FY2-only events (unless they're also marked as general foundation)

## Benefits

1. **Flexibility**: Users can choose their level of specificity
2. **Better Onboarding**: Easier for users who aren't sure of their exact year or just want to explore
3. **More Events**: Users without subcategories see more relevant content
4. **Still Targeted**: Users who specify their year get personalized, targeted events

## Testing Recommendations

1. Test profile completion with and without year selection
2. Verify event filtering for each scenario:
   - ARU without year
   - ARU with specific year
   - UCL without year
   - UCL with specific year
   - Foundation Doctor without FY
   - Foundation Doctor with FY1/FY2
3. Ensure "show all events" toggle still works correctly
4. Test that existing users with completed profiles still see correct events

## Bug Fixes

### Issue 1: Foundation Doctors Seeing Medical Student Events
**Problem**: When selecting "Foundation Doctor" without FY1/FY2, users were seeing medical student events (ARU/UCL events).

**Fix**: Added explicit filtering to exclude medical student-specific events (ARU, UCL, university-based) when the user is a foundation doctor without a specific FY selection. Only foundation-related events and universal events are shown.

### Issue 2: Specific Year Selection Showing Wrong Events
**Problem**: When selecting "ARU Year 2" or "UCL Year 3", users were seeing events for other years if those events also had general university categories.

**Fix**: Updated logic to check if an event has ANY year-specific categories. If it does, the event is only shown if:
- The year matches the user's selected year, OR
- The event is marked as "all years" or "general"

This prevents "ARU Year 3" events from showing to "ARU Year 2" students, even if the event also has a general "ARU" category.

## Files Modified

1. `lib/event-filtering.ts` - Updated filtering logic with bug fixes
2. `app/onboarding/profile/page.tsx` - Updated validation requirements
3. `components/onboarding/StudentDetails.tsx` - UI updates for medical students
4. `components/onboarding/FoundationYearDetails.tsx` - UI updates for foundation doctors

## Backward Compatibility

✅ Existing users with completed profiles (including year selection) will continue to see the same filtered events
✅ The "show all events" toggle still overrides all filtering when enabled
✅ Users without `profile_completed` still see all events by default

