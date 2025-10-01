# Events System - Supabase Integration Guide

## Overview
Your events system currently uses **localStorage** (browser storage) to save data. To use **Supabase** (database), you need to integrate the API functions.

## Files Created

1. **`create-events-schema.sql`** - Run this in Supabase SQL Editor to create all tables
2. **`lib/supabase-events.ts`** - API functions to interact with Supabase

## Step-by-Step Integration

### Step 1: Run the SQL Script
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** → Click **New Query**
3. Copy the entire content of `create-events-schema.sql`
4. Paste and click **Run**
5. Verify tables were created by checking the **Table Editor**

### Step 2: Update Your Environment Variables
Make sure these are in your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: How Events Get Added to Supabase

#### Current Flow (localStorage):
```javascript
// In app/event-data/page.tsx
const newEvent = { ...eventData };
localStorage.setItem('events', JSON.stringify([...events, newEvent]));
```

#### New Flow (Supabase):
Replace the `handleAddEvent` function with:

```javascript
import { createEvent, getOrCreateLocation, getOrCreateOrganizer, getCategoryIdByName, getFormatIdByName, getSpeakerIdsByNames } from '@/lib/supabase-events';

const handleAddEvent = async () => {
  if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) return;

  try {
    // Convert names to IDs
    const locationId = formData.location ? await getOrCreateLocation(formData.location) : null;
    const organizerId = formData.organizer ? await getOrCreateOrganizer(formData.organizer) : null;
    const categoryId = formData.category.length > 0 ? await getCategoryIdByName(formData.category[0]) : null;
    const formatId = formData.format.length > 0 ? await getFormatIdByName(formData.format[0]) : null;
    const speakerIds = await getSpeakerIdsByNames(formData.speakers);

    // Create event in Supabase
    const newEvent = await createEvent({
      title: formData.title,
      description: formData.description,
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      is_all_day: formData.isAllDay,
      hide_time: formData.hideTime,
      hide_end_time: formData.hideEndTime,
      time_notes: formData.timeNotes,
      location_id: locationId,
      other_location_ids: [], // You'll need to convert these too
      hide_location: formData.hideLocation,
      organizer_id: organizerId,
      other_organizer_ids: [], // You'll need to convert these too
      hide_organizer: formData.hideOrganizer,
      category_id: categoryId,
      format_id: formatId,
      speaker_ids: speakerIds,
      hide_speakers: formData.hideSpeakers,
      event_link: formData.eventLink,
      more_info_link: formData.moreInfoLink,
      more_info_target: formData.moreInfoTarget,
      event_status: formData.eventStatus,
      attendees: 0,
      status: 'published',
      author_id: session?.user?.id,
      author_name: session?.user?.name || 'Unknown User'
    }, speakerIds);

    console.log('Event created in Supabase:', newEvent);
    
    // Refresh events list from Supabase
    await loadEventsFromSupabase();
    
    resetForm();
  } catch (error) {
    console.error('Error creating event:', error);
    alert('Failed to create event. Please try again.');
  }
};
```

### Step 4: Load Events from Supabase

Add this function to load events on component mount:

```javascript
import { getEvents, getCategories, getFormats, getSpeakers, getLocations, getOrganizers } from '@/lib/supabase-events';

const loadEventsFromSupabase = async () => {
  try {
    const eventsData = await getEvents();
    setEvents(eventsData);
  } catch (error) {
    console.error('Error loading events:', error);
  }
};

const loadEventData = async () => {
  try {
    const [categories, formats, speakers, locations, organizers] = await Promise.all([
      getCategories(),
      getFormats(),
      getSpeakers(),
      getLocations(),
      getOrganizers()
    ]);

    setData({
      categories,
      formats,
      speakers,
      locations: locations.map(l => l.name),
      organizers: organizers.map(o => o.name)
    });
  } catch (error) {
    console.error('Error loading event data:', error);
  }
};

useEffect(() => {
  loadEventsFromSupabase();
  loadEventData();
}, []);
```

### Step 5: Migrate Existing localStorage Data (Optional)

If you want to move your existing events from localStorage to Supabase:

```javascript
import { migrateLocalStorageToSupabase } from '@/lib/supabase-events';

// Call this once from your browser console or add a button
const handleMigration = async () => {
  const result = await migrateLocalStorageToSupabase();
  console.log(result.message);
  if (result.success) {
    // Reload data from Supabase
    await loadEventsFromSupabase();
  }
};
```

## Key Differences: localStorage vs Supabase

| Aspect | localStorage | Supabase |
|--------|--------------|----------|
| **Storage** | Browser only | Cloud database |
| **Sharing** | Single user/device | All users/devices |
| **Persistence** | Can be cleared | Permanent |
| **Relationships** | Manual (names/strings) | Proper foreign keys |
| **Queries** | Client-side filtering | Server-side SQL |
| **Security** | No access control | Row Level Security |
| **Capacity** | ~5-10MB limit | Unlimited |

## API Functions Available

### Events
- `getEvents(filters?)` - Get all events with optional filters
- `getEventById(id)` - Get single event with all details
- `createEvent(event, speakerIds)` - Create new event
- `updateEvent(id, event, speakerIds?)` - Update existing event
- `deleteEvent(id)` - Delete event

### Categories
- `getCategories()` - Get all categories
- `getCategoriesWithCounts()` - Get categories with event counts
- `createCategory(category)` - Create new category
- `updateCategory(id, updates)` - Update category
- `deleteCategory(id)` - Delete category

### Formats
- `getFormats()` - Get all formats
- `getFormatsWithCounts()` - Get formats with event counts
- `createFormat(format)` - Create new format
- `updateFormat(id, updates)` - Update format
- `deleteFormat(id)` - Delete format

### Speakers
- `getSpeakers()` - Get all speakers
- `createSpeaker(speaker)` - Create new speaker (with name and role)
- `deleteSpeaker(id)` - Delete speaker

### Locations
- `getLocations()` - Get all locations
- `createLocation(name)` - Create new location
- `deleteLocation(id)` - Delete location

### Organizers
- `getOrganizers()` - Get all organizers
- `createOrganizer(name)` - Create new organizer
- `deleteOrganizer(id)` - Delete organizer

## Example: Complete Integration in app/event-data/page.tsx

Replace localStorage operations with Supabase calls:

```javascript
// OLD (localStorage):
localStorage.setItem('events', JSON.stringify(updatedEvents));

// NEW (Supabase):
await createEvent(eventData, speakerIds);
await loadEventsFromSupabase(); // Refresh the list
```

## Benefits of Using Supabase

1. ✅ **Real-time sync** - Changes appear on all devices instantly
2. ✅ **Data persistence** - Never lose data even if browser clears storage
3. ✅ **Multi-user support** - Multiple admins can manage events
4. ✅ **Better performance** - Server-side filtering and pagination
5. ✅ **Data integrity** - Foreign keys ensure valid relationships
6. ✅ **Audit trail** - created_at and updated_at timestamps
7. ✅ **Scalability** - Handle thousands of events easily

## Testing

After integration, test these scenarios:
1. Create a new event - verify it appears in Supabase Table Editor
2. Edit an event - check the updated_at timestamp changes
3. Delete an event - confirm it's removed from database
4. Add a speaker with a role - verify both fields are saved
5. Create sub-categories - check parent_id relationships
6. Filter events by date/category/format - test query performance

## Troubleshooting

**Q: Events not saving?**
- Check Supabase RLS policies are correctly set
- Verify your user has 'admin' role in the users table
- Check browser console for error messages

**Q: Foreign key errors?**
- Make sure categories/formats/locations exist before creating events
- Use the helper functions (getOrCreate...) to auto-create missing items

**Q: Speakers not appearing?**
- Check the event_speakers junction table
- Verify speaker_ids are being passed correctly

## Need Help?

The integration file (`lib/supabase-events.ts`) is ready to use. You just need to:
1. Run the SQL script in Supabase
2. Replace localStorage calls with the Supabase functions
3. Handle async/await properly (add loading states)
4. Add error handling for better UX

Let me know if you need help with the actual integration!




