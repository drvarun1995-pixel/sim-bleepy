# AI Prompt & Duplicate Detection Improvements

## Overview
Comprehensive improvements to the Smart Bulk Upload AI prompt and duplicate detection logic to ensure accurate date/time extraction and reliable duplicate matching.

## Key Changes Made

### 1. **Enhanced AI Prompt** (`app/api/events/bulk-upload-parse/route.ts`)

#### Before:
- Short, vague prompt with limited instructions
- No clear date format examples
- No time conversion guidance
- Generic rules

#### After:
```
You are extracting teaching events from an Excel schedule. Return a JSON array with this exact structure:

[
  {
    "title": "Event name WITHOUT format prefix",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM"
  }
]

CRITICAL INSTRUCTIONS:

1. TITLE EXTRACTION:
   - Extract ONLY the event name
   - DO NOT include format prefixes like "Core Teaching:", "Twilight Teaching:", etc.
   - Example: If you see "Core Teaching: Gastroenterology", extract only "Gastroenterology"

2. DATE EXTRACTION (MOST IMPORTANT):
   - Look for dates in ANY of these formats:
     • "03/10/2025" → extract as "2025-10-03"
     • "Thu 18-Sep-25" → extract as "2025-09-18"
     • "15/12/2026" → extract as "2026-12-15"
   - PAY ATTENTION TO THE YEAR: Use the EXACT year from the document
   - If year is 2-digit (e.g., "25"), interpret as "20" + year (e.g., "2025")
   - NEVER assume or default to 2023 or current year

3. TIME EXTRACTION:
   - Look for times in these formats:
     • "13:00" → extract as "13:00"
     • Decimal like "0.5416666666666666" → convert to "13:00" (multiply by 24)
   - To convert decimal: multiply by 24 to get hours, then extract minutes

4. END TIME:
   - If start and end time are the same, set end time to 1 hour after start

5. OUTPUT FORMAT:
   - Return ONLY the JSON array
   - No markdown, no code blocks, no extra text

EXAMPLE INPUT:
Thu 03-Oct-25    0.5416666666666666    Core Teaching: Death Certificates

EXAMPLE OUTPUT:
[
  {
    "title": "Death Certificates",
    "date": "2025-10-03",
    "startTime": "13:00",
    "endTime": "14:00"
  }
]
```

**Key Improvements:**
- ✅ Clear section headers (1-5) for easy comprehension
- ✅ Explicit date format examples with exact conversions
- ✅ Specific year handling instructions (2-digit → 4-digit)
- ✅ Decimal time conversion formula explained
- ✅ Complete example showing input → output transformation
- ✅ Emphasis on "NEVER assume or default to 2023"

### 2. **Improved System Message**

#### Before:
```
'You are a precise event extraction assistant. You must extract ALL events...'
```

#### After:
```
'You are a precise teaching schedule extraction assistant. Extract ALL events from Excel/CSV schedules with EXACT dates and times. Pay special attention to year values - use the EXACT year shown in the document. Return only valid JSON arrays.'
```

**Key Improvements:**
- ✅ More specific role definition
- ✅ Emphasis on "EXACT dates and times"
- ✅ Explicit instruction to use "EXACT year shown in document"

### 3. **Enhanced Duplicate Detection Logic**

#### Improved Normalization Functions:

**normalizeTitle:**
```typescript
const normalizeTitle = (title: string) => {
  if (!title) return '';
  let normalized = title.toLowerCase()
    .replace(/^(core teaching|core teachings|twilight teaching|...):\s*/i, '')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized;
};
```

**normalizeDate:**
```typescript
const normalizeDate = (date: string) => {
  if (!date) return '';
  return date.trim();
};
```

**normalizeTime:**
```typescript
const normalizeTime = (time: string) => {
  if (!time) return '';
  const cleaned = time.trim().replace(/\s+/g, '');
  const [hours, minutes] = cleaned.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '';
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
```

#### Matching Logic:

1. **Exact Match:**
   - Same normalized title
   - Same normalized date
   - Same normalized time
   - Result: "Exact match on title, date, and time"

2. **Title + Date Match:**
   - Same normalized title
   - Same normalized date
   - Different time
   - Result: "Match on title and date (different time)"

3. **Similar Title Match:**
   - Titles contain each other (min 3 chars)
   - Same date
   - Same time
   - Result: "Similar title with same date and time"

**Key Improvements:**
- ✅ Added null/empty checks to all normalization functions
- ✅ Consistent date format handling
- ✅ Proper time format normalization (HH:MM)
- ✅ Length check for similar title matching (min 3 chars)
- ✅ Better console logging for debugging

## Expected Outcomes

### Date Extraction:
- ✅ "03/10/2025" → correctly extracts as "2025-10-03" (not 2023!)
- ✅ "Thu 18-Sep-25" → correctly extracts as "2025-09-18"
- ✅ Any year (2025, 2026, 2027) correctly preserved

### Time Extraction:
- ✅ "0.5416666666666666" → correctly converts to "13:00"
- ✅ "0.5833333333333334" → correctly converts to "14:00"
- ✅ Standard times like "14:30" → preserved as "14:30"

### Duplicate Detection:
- ✅ Events with same title, date, and time → marked as existing
- ✅ Events with same title and date (diff time) → marked as existing
- ✅ Case-insensitive matching
- ✅ Format prefix handling (removes before comparison)
- ✅ Detailed debug logs for troubleshooting

## Testing Steps

1. **Upload Excel file** with teaching events
2. **Check terminal logs** for:
   - Date patterns found in Excel content
   - AI extracted dates (should match Excel years)
   - Duplicate detection comparisons
   - Match results

3. **Verify Results:**
   - New events should show in main list
   - Existing events should show in collapsible "Existing Matches" section
   - Years should match Excel exactly

## Debug Logging

The system now provides extensive debug logs:
- 📅 Date patterns found in Excel content
- 📅 Date patterns extracted by AI
- 🔍 Detailed comparison for each event
- ✅ Match results with reasons
- 🎯 Final duplicate detection summary

## Files Modified

1. `app/api/events/bulk-upload-parse/route.ts`
   - Enhanced AI prompt (lines 250-315)
   - Improved system message (line 341)
   - Enhanced duplicate detection logic (lines 569-646)

## Next Steps

1. Test with actual Excel files
2. Monitor terminal logs for accuracy
3. Verify duplicate detection is working correctly
4. Check that years are extracted correctly (2025, not 2023)

---

**Date:** October 11, 2025
**Status:** ✅ Ready for Testing




