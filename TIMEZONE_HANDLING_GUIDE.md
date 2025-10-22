# UK Timezone Handling Guide

## Overview
This guide explains how the system handles UK daylight saving time (DST) transitions, which occur twice a year:
- **Spring Forward**: Last Sunday in March at 1:00 AM (GMT → BST, UTC+0 → UTC+1)
- **Fall Back**: Last Sunday in October at 2:00 AM (BST → GMT, UTC+1 → UTC+0)

## Components Created

### 1. `lib/timezone-utils.ts`
Core timezone utilities for handling UK DST:
- `getUKTimezoneInfo()` - Get current timezone status
- `adjustEventTimeForDST()` - Handle timezone shifts in event scheduling
- `formatDateWithTimezone()` - Display dates with timezone info
- `getDSTWarning()` - Warn about upcoming DST transitions

### 2. `components/timezone/TimezoneInfo.tsx`
Dashboard component showing current timezone status and DST warnings.

### 3. `components/timezone/TimezoneTimeInput.tsx`
Enhanced time input with timezone awareness and DST warnings.

## Implementation Strategy

### 1. Database Storage
- **Store all times in UTC** in the database
- Convert to/from UK timezone only for display and user input
- This ensures consistency regardless of DST transitions

### 2. Event Creation/Editing
- Use `TimezoneTimeInput` component for time inputs
- Automatically convert UK time to UTC before saving
- Show warnings for events near DST transitions

### 3. Display
- Always show times in current UK timezone (GMT/BST)
- Display timezone indicator (GMT/BST)
- Show warnings for upcoming DST transitions

### 4. API Integration
Update event APIs to handle timezone conversion:

```typescript
// Before saving to database
const utcTime = fromUKTimeToUTC(new Date(`${date}T${time}`))

// When displaying
const ukTime = toUKTime(utcTime)
```

## Usage Examples

### 1. Check Current Timezone
```typescript
import { getUKTimezoneInfo } from '@/lib/timezone-utils'

const timezoneInfo = getUKTimezoneInfo()
console.log(timezoneInfo.timezone) // 'GMT' or 'BST'
console.log(timezoneInfo.isDST) // true or false
```

### 2. Handle Event Time
```typescript
import { adjustEventTimeForDST } from '@/lib/timezone-utils'

const eventDate = new Date('2024-03-31')
const eventTime = '14:30'
const result = adjustEventTimeForDST(eventDate, eventTime)

// result.adjustedDate - UTC time for database storage
// result.warning - Warning if near DST transition
```

### 3. Display with Timezone
```typescript
import { formatDateWithTimezone } from '@/lib/timezone-utils'

const date = new Date('2024-03-31T14:30:00')
const formatted = formatDateWithTimezone(date, true)
// "31/03/2024 14:30 BST"
```

## DST Transition Handling

### Spring Forward (GMT → BST)
- **Date**: Last Sunday in March at 1:00 AM
- **Effect**: Clocks move forward 1 hour
- **Handling**: 
  - Events at 1:00-1:59 AM don't exist (skip to 2:00 AM)
  - Events at 2:00 AM+ are automatically adjusted
  - Show warning for events scheduled during transition

### Fall Back (BST → GMT)
- **Date**: Last Sunday in October at 2:00 AM
- **Effect**: Clocks move back 1 hour
- **Handling**:
  - Events at 2:00-2:59 AM occur twice (ambiguous)
  - Events at 3:00 AM+ are automatically adjusted
  - Show warning for events scheduled during transition

## Warning System

The system provides warnings for:
1. **Upcoming DST transitions** (7 days before)
2. **Events near DST transitions** (within 24 hours)
3. **Ambiguous times** during fall back

## Testing

### Test Cases
1. **Normal operation** - Events outside DST transition periods
2. **Spring forward** - Events scheduled during 1:00-2:00 AM on transition day
3. **Fall back** - Events scheduled during 2:00-3:00 AM on transition day
4. **Warning display** - Events within 24 hours of transition

### Test Dates for 2024
- **Spring Forward**: March 31, 2024 at 1:00 AM
- **Fall Back**: October 27, 2024 at 2:00 AM

## Integration Steps

1. **Update Event Forms**
   - Replace time inputs with `TimezoneTimeInput`
   - Add timezone display components

2. **Update APIs**
   - Convert UK time to UTC before database storage
   - Convert UTC to UK time for display

3. **Update Dashboard**
   - Add `TimezoneInfo` component
   - Show DST warnings

4. **Update Event Display**
   - Use `TimezoneDateTimeDisplay` for event times
   - Show timezone indicators

## Benefits

1. **Automatic Handling** - No manual intervention needed
2. **User Awareness** - Clear timezone indicators and warnings
3. **Data Consistency** - UTC storage prevents timezone issues
4. **Future-Proof** - Handles all DST transitions automatically

## Migration

For existing events:
1. **AudIT** - Check for events near DST transitions
2. **Convert** - Update display logic to use timezone utilities
3. **Validate** - Ensure times display correctly in both GMT and BST

This system ensures that UK timezone changes are handled seamlessly, providing a smooth user experience regardless of when DST transitions occur.




