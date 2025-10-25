# Main Organizer + AI Organizers Example

## Scenario

You want to:
1. **Set "CTF Team" as the main organizer** for all events
2. **AI should find organizers mentioned in Excel** and add them as additional organizers
3. **Preserve the main organizer** while adding AI-found organizers as additional

## Example Setup

### **Bulk Selection:**
- **Main Organizer**: "CTF Team" 
- **Additional Organizers**: None (or you can add some)

### **Excel Content:**
```
"Cardiology Grand Round
Organized by Dr. Sarah and Dr. Varun
Location: Education Centre"
```

## Processing Flow

### **1. AI Processing Phase**
```
AI finds organizers in Excel: ["Sarah", "Varun"]
↓
AI assigns to: otherOrganizers = ["Sarah", "Varun"]
Main organizer: undefined (not set by AI)
```

### **2. Bulk Processing Phase**
```
Bulk main organizer: "CTF Team"
Bulk additional organizers: [] (empty)
↓
Final result:
- Main organizer: "CTF Team" (from bulk selection)
- Additional organizers: ["Sarah", "Varun"] (from AI)
```

## Expected Result

```json
{
  "title": "Cardiology Grand Round",
  "organizer": "CTF Team",           // ✅ Main organizer from bulk selection
  "organizerId": "ctf-team-id",
  "otherOrganizers": [               // ✅ Additional organizers from AI
    {
      "id": "sarah-id",
      "name": "Sarah"
    },
    {
      "id": "varun-id", 
      "name": "Varun"
    }
  ],
  "otherOrganizerIds": ["sarah-id", "varun-id"]
}
```

## Console Log Output

```
🔍 Processing organizers for event "Cardiology Grand Round":
   AI-generated organizers: ["Sarah", "Varun"]
   Bulk additional organizers: []
   Bulk main organizer: CTF Team
   Final additional organizers: ["Sarah", "Varun"]
   Final main organizer: CTF Team
```

## Key Logic Points

### **1. Main Organizer Preservation**
```typescript
// Main organizer: Use bulk selection if provided, otherwise keep existing
organizerId: bulkMainOrganizerId !== 'none' ? bulkMainOrganizerId : event.organizerId,
organizer: bulkMainOrganizerId !== 'none' ? mainOrganizer?.name : event.organizer,
```

### **2. Additional Organizers Combination**
```typescript
// Additional organizers: Combine AI-generated + bulk additional organizers
const combinedOtherOrganizers = [...existingOtherOrganizers, ...otherOrganizers];
const uniqueOtherOrganizers = combinedOtherOrganizers.filter(/* remove duplicates */);
```

### **3. Processing Order**
1. **AI Processing**: Finds organizers in Excel → assigns to `otherOrganizers`
2. **Bulk Processing**: 
   - Sets main organizer if `bulkMainOrganizerId` is provided
   - Combines AI organizers with bulk additional organizers
   - Preserves main organizer while adding additional organizers

## Different Scenarios

### **Scenario 1: Only Main Organizer Set**
- **Bulk**: Main = "CTF Team", Additional = []
- **AI**: Finds ["Sarah", "Varun"] in Excel
- **Result**: Main = "CTF Team", Additional = ["Sarah", "Varun"]

### **Scenario 2: Main + Additional Organizers Set**
- **Bulk**: Main = "CTF Team", Additional = ["Maisoon"]
- **AI**: Finds ["Sarah", "Varun"] in Excel  
- **Result**: Main = "CTF Team", Additional = ["Sarah", "Varun", "Maisoon"]

### **Scenario 3: No Main Organizer Set**
- **Bulk**: Main = "none", Additional = ["Maisoon"]
- **AI**: Finds ["Sarah", "Varun"] in Excel
- **Result**: Main = undefined, Additional = ["Sarah", "Varun", "Maisoon"]

## Benefits

1. **Main Organizer Control**: You can set a consistent main organizer for all events
2. **AI Flexibility**: AI can still find and add specific organizers from Excel
3. **No Overwriting**: Main organizer is preserved, AI organizers are added as additional
4. **Duplicate Prevention**: Same organizer won't be added twice
5. **Flexible Combination**: Works with any combination of bulk and AI organizers

This ensures that your main organizer choice (like "CTF Team") is respected while still allowing AI to add specific organizers mentioned in the Excel sheet as additional organizers!


