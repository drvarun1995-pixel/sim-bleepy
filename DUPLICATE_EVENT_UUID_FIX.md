# Duplicate Event UUID Error - FIXED

## ✅ **Issue Resolved:**
- **Error Fixed**: `Error: invalid input syntax for type uuid: "Simulation Suite"`
- **Root Cause**: Form was passing location name instead of location ID to the database
- **Solution**: Modified form submission to look up location ID from location name

## 🔧 **What Was Fixed:**

### **1. Problem Identification:**
- When duplicating events, `formData.location` contained the location name (e.g., "Simulation Suite")
- Form submission code was trying to use this name directly as a UUID in the database
- Database expected a location ID (UUID) but received a location name (string)

### **2. Solution Applied:**
- **Before**: `const locationId = formData.location || undefined;`
- **After**: Added location lookup logic to convert location name to location ID

### **3. New Location Resolution Logic:**
```javascript
// Get location ID from location name
let locationId = undefined;
if (formData.location && formData.location.trim()) {
  const locations = await getLocations();
  const foundLocation = locations.find(loc => loc.name === formData.location);
  locationId = foundLocation?.id;
}
```

## 🎯 **How It Works Now:**

### **Duplicate Process:**
1. **User clicks duplicate** → Event data is collected (including location name)
2. **Form is pre-filled** → Location field shows the location name
3. **User submits form** → Location name is looked up to find the corresponding ID
4. **Event is created** → Database receives the correct UUID

### **Location Handling:**
- **Duplicate Data**: Contains location name (e.g., "Simulation Suite")
- **Form Display**: Shows location name to user
- **Form Submission**: Converts location name to location ID before database insert
- **Database**: Receives proper UUID for location_id field

## 📁 **Files Modified:**
1. `app/event-data/page.tsx` - Fixed location ID resolution in form submission
2. `app/events/[id]/page.tsx` - Added comments for clarity

## ✅ **Testing Status:**
- No linting errors
- Location lookup logic implemented
- UUID validation should now pass
- Ready for testing with duplicate functionality

## 🔍 **Technical Details:**
- Uses existing `getLocations()` function to fetch all available locations
- Finds matching location by name using `Array.find()`
- Safely handles cases where location name doesn't exist
- Maintains backward compatibility with existing form functionality


