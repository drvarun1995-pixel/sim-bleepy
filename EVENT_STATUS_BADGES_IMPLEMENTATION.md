# Event Status Badges Implementation

## Overview
Added event status badges to display when events are rescheduled, postponed, cancelled, or moved online. Scheduled events show no badge.

## Components Created

### EventStatusBadge Component (`components/EventStatusBadge.tsx`)
- **Purpose**: Reusable badge component for displaying event status
- **Features**:
  - Only shows for non-scheduled events
  - Color-coded badges with appropriate styling
  - Customizable className prop
- **Status Types**:
  - `rescheduled`: Yellow badge
  - `postponed`: Orange badge  
  - `cancelled`: Red badge
  - `moved-online`: Blue badge
  - `scheduled`: No badge (hidden)

## Pages Updated

### 1. Individual Event Page (`app/events/[id]/page.tsx`)
- **Location**: Next to event title
- **Display**: Status badge appears next to the main event title
- **Implementation**: Added `EventStatusBadge` component in title section

### 2. Events List Page (`app/events-list/page.tsx`)
- **Card View**: Status badge next to event title in each card
- **Table View**: Status badge next to event title in table rows
- **Implementation**: Added badges to both view modes with responsive sizing

### 3. Formats Page (`app/formats/page.tsx`)
- **Card View**: Status badge next to event title in each card
- **Table View**: Status badge next to event title in table rows
- **Implementation**: Added badges to both view modes with responsive sizing

### 4. Calendar Component (`components/Calendar.tsx`)
- **Homepage Calendar**: Status badge next to event titles
- **Event List View**: Status badge next to event titles
- **Implementation**: Added badges to both calendar display modes

### 5. Calendar Page (`app/calendar/page.tsx`)
- **Note**: Redirects to events page, so inherits events page styling

## Visual Design

### Badge Styling
```css
/* Rescheduled */
background: rgba(251, 191, 36, 0.1)
color: rgb(133, 77, 14)
border: 1px solid rgba(251, 191, 36, 0.2)

/* Postponed */
background: rgba(251, 146, 60, 0.1)
color: rgb(154, 52, 18)
border: 1px solid rgba(251, 146, 60, 0.2)

/* Cancelled */
background: rgba(239, 68, 68, 0.1)
color: rgb(127, 29, 29)
border: 1px solid rgba(239, 68, 68, 0.2)

/* Moved Online */
background: rgba(59, 130, 246, 0.1)
color: rgb(30, 64, 175)
border: 1px solid rgba(59, 130, 246, 0.2)
```

### Responsive Design
- **Desktop**: Full-size badges
- **Mobile**: Smaller badges with reduced padding
- **Table Views**: Extra small badges to fit table constraints

## Data Flow

### Event Status Field
- **Database Field**: `event_status` in events table
- **Possible Values**: `scheduled`, `rescheduled`, `postponed`, `cancelled`, `moved-online`
- **Default**: `scheduled` (no badge shown)

### API Integration
- Event status is already available in all event data from `events_with_details` view
- No additional API calls required
- Status is passed through existing event transformation logic

## Usage Examples

### Individual Event Page
```jsx
<div className="flex items-center gap-4 flex-wrap">
  <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
  <EventStatusBadge status={event.eventStatus || 'scheduled'} />
</div>
```

### Event Cards
```jsx
<div className="flex items-center gap-3 mb-2 flex-wrap">
  <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
  <EventStatusBadge status={event.eventStatus || 'scheduled'} />
</div>
```

### Table Views
```jsx
<div className="flex items-center gap-2 mb-1 flex-wrap">
  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">
    {event.title}
  </h3>
  <EventStatusBadge status={event.eventStatus || 'scheduled'} className="text-[10px] px-1.5 py-0.5" />
</div>
```

## Testing

### Test Cases
1. **Scheduled Events**: Should show no badge
2. **Rescheduled Events**: Should show yellow "Rescheduled" badge
3. **Postponed Events**: Should show orange "Postponed" badge
4. **Cancelled Events**: Should show red "Cancelled" badge
5. **Moved Online Events**: Should show blue "Moved Online" badge

### Pages to Test
- ✅ Individual event page: `/events/[id]`
- ✅ Events list: `/events-list`
- ✅ Calendar: `/calendar`
- ✅ Formats: `/formats`
- ✅ Homepage calendar component

## Benefits

1. **Clear Status Indication**: Users can immediately see event status changes
2. **Consistent Design**: Same badge styling across all pages
3. **Non-Intrusive**: Only shows when status is not scheduled
4. **Responsive**: Works well on all screen sizes
5. **Accessible**: Clear color coding and text labels

## Future Enhancements

1. **Status Filtering**: Add filters to show/hide events by status
2. **Status History**: Track status change history
3. **Notifications**: Alert users when events they're interested in change status
4. **Bulk Status Updates**: Allow admins to update multiple event statuses
