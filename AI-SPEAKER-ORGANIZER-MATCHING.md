# AI Speaker & Organizer Matching

## How It Works

The AI bulk upload now automatically matches speakers and organizers from your database when processing events. Here's how it works:

### 1. **AI Receives Available Lists**
The AI is provided with:
- **Available Speakers**: All speakers in your database (e.g., "Sarah, Maisoon, Hannah-Maria, Varun, Rudy...")
- **Available Organizers**: All organizers in your database (e.g., "Sarah, Maisoon, Hannah-Maria, Varun, Rudy...")

### 2. **AI Matches Names from Document**
When processing your Excel/CSV file, the AI will:
- Look for speaker and organizer names mentioned in the document
- **ONLY include names that exist** in the available lists
- **Skip names that don't exist** in your database
- Return empty arrays `[]` if no valid matches are found

### 3. **Exact Name Matching**
The system performs case-insensitive, trimmed matching:
- "Sarah" matches "sarah" or "Sarah " or " SARAH"
- "Hannah-Maria" matches "hannah-maria" or "Hannah-Maria "
- Partial matches are NOT allowed (for safety)

## Example Scenarios

### Scenario 1: Perfect Matches
**Document mentions:** "Cardiology Grand Round with Dr. Sarah and Dr. Varun"

**AI Result:**
```json
{
  "title": "Cardiology Grand Round",
  "speakers": ["Sarah", "Varun"],
  "organizers": []
}
```

### Scenario 2: Some Matches, Some Don't
**Document mentions:** "Teaching session by Dr. Sarah, Dr. John, and Dr. Varun"

**AI Result:**
```json
{
  "title": "Teaching session",
  "speakers": ["Sarah", "Varun"],  // John skipped - not in database
  "organizers": []
}
```

### Scenario 3: No Matches
**Document mentions:** "Session by Dr. Smith and Dr. Johnson"

**AI Result:**
```json
{
  "title": "Session",
  "speakers": [],  // Empty - no matches found
  "organizers": []
}
```

## Additional AI Instructions Examples

### 1. **Force Speaker Assignment**
```
If no speakers are mentioned in the document, assign "Varun" as the default speaker for all events.
```

### 2. **Role-Based Assignment**
```
For Core Teaching events, always assign "Sarah" as organizer. For Clinical Skills events, assign "Hannah-Maria" as speaker.
```

### 3. **Multiple Speaker Assignment**
```
If an event mentions "team teaching" or "multiple speakers", assign both "Sarah" and "Varun" as speakers.
```

### 4. **Conditional Assignment**
```
For events longer than 2 hours, assign "Hannah-Maria" as additional speaker. For events on weekends, assign "Varun" as organizer.
```

## Database Safety

### ✅ **What Happens:**
- Names that exist in your database → **Added to events**
- Names that don't exist → **Skipped completely**
- No database modifications for missing names
- No errors or failures

### ❌ **What Doesn't Happen:**
- No new speakers/organizers created
- No partial matches
- No fuzzy matching
- No database corruption

## Testing the Feature

### 1. **Prepare Test Document**
Create an Excel file with events that mention:
- Valid speaker names (from your database)
- Invalid speaker names (not in database)
- Mixed scenarios

### 2. **Upload and Review**
1. Upload the file
2. Check the AI-generated speakers/organizers
3. Verify only valid names are included
4. Confirm invalid names are skipped

### 3. **Check Console Logs**
The system logs detailed information:
```
✅ Matched speaker: "Sarah" -> Sarah (CTF)
❌ Speaker not found in database: "Dr. Smith"
✅ Added 2 speakers to event "Cardiology Grand Round"
```

## Current Database Speakers & Organizers

Based on your restored data:

### **Speakers (32 total):**
**CTF (14):** Maisoon, Hannah-Maria, Thanuji, Varun, Rudy, Simran, Megan, Ghouse, Vishnu, Vania, Faizan, Kenan, Tasfia, Rihannah

**Foundation Year Doctors (18):** Abdallah Abbas, Adnan, Amardeep, Anika Khair, Fatema, Gui, Iffat Mir, Keval, Kirish, Maizie Glover, Mahnoor, Maram, Raian, Samia Miah, Sarah, Shenelle, Yasmin Shameem, Zaina Alam

### **Organizers (32 total):**
Sarah, Maisoon, Hannah-Maria, Thanuji, Varun, Rudy, Simran, Megan, Fatema, Adnan, Mahnoor, Kirish, Ghouse, Vishnu, Vania, Faizan, Kenan, Tasfia, Rihannah, Raian, Shenelle, Iffat Mir, Abdallah Abbas, Keval, Maizie Glover, Samia Miah, Amardeep, Yasmin Shameem, Anika Khair, Zaina Alam, Gui, Maram

## Tips for Best Results

1. **Use Exact Names**: Mention speakers/organizers by their exact database names
2. **Be Specific**: "Dr. Sarah" will match "Sarah" in the database
3. **Multiple Names**: You can mention multiple speakers: "Session with Sarah and Varun"
4. **Context Helps**: "Led by Hannah-Maria" or "Organized by Varun" works well
5. **Test First**: Try with a small file to see how the matching works

The AI will now intelligently match your speakers and organizers while keeping your database safe and clean!


