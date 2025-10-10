# Bulk Upload with AI - Complete Guide

## Overview

The **Bulk Upload with AI** feature allows administrators to upload Excel, PDF, or Word documents containing event information, and automatically extract event data using OpenAI's GPT-4. The system intelligently extracts event titles, dates, and times while matching existing locations and speakers from your database.

## Features

✅ **AI-Powered Extraction**: Automatically extracts event titles, dates, and times using OpenAI GPT-4  
✅ **Smart Matching**: Matches locations and speakers with existing database entries  
✅ **Email Detection**: Automatically detects and warns about personal information (email addresses)  
✅ **Multi-Format Support**: Supports Excel (.xlsx, .xls), PDF (.pdf), and Word (.docx, .doc) files  
✅ **Review & Edit**: Full review interface to edit extracted information before saving  
✅ **Bulk Creation**: Create multiple events at once with a single confirmation  
✅ **Privacy-Focused**: Does NOT create or modify formats, categories, locations, or speakers  

---

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# OpenAI API Key (required for bulk upload)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**How to get an OpenAI API Key:**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file
6. **Important**: Add billing information to your OpenAI account to use the API

### 2. Verify Dependencies

The following packages are already installed in your `package.json`:

```json
{
  "openai": "^4.20.1",
  "xlsx": "^0.18.5"
}
```

If you need to install them manually:

```bash
npm install openai xlsx
```

For enhanced PDF and Word parsing (optional but recommended):

```bash
npm install pdf-parse mammoth
```

### 3. Database Requirements

Ensure you have the following tables in your Supabase database:

- `events` - Main events table
- `locations` - Available locations
- `speakers` - Available speakers
- `categories` - Event categories
- `formats` - Event formats
- `organizers` - Event organizers
- `event_speakers` - Junction table for event-speaker relationships

All these tables should already exist if you've run the `create-events-schema.sql` migration.

---

## How to Use

### Accessing the Feature

There are multiple ways to access the Bulk Upload feature:

1. **From Events Page**: Click "Bulk Upload with AI" button in the header (admin only)
2. **From Event Data Page**: Select "Bulk Upload with AI" from the sidebar menu
3. **Direct URL**: Navigate to `/bulk-upload-ai`

### Step-by-Step Process

#### Step 1: Upload File

1. Click "Bulk Upload with AI" from the events page
2. Drag and drop your file or click to browse
3. Supported formats:
   - Excel: `.xlsx`, `.xls`
   - PDF: `.pdf`
   - Word: `.docx`, `.doc`
4. Maximum file size: 10MB

#### Step 2: Email Detection

If the system detects email addresses in your file:

- **Warning Dialog** will appear showing all detected emails
- **Two Options**:
  1. **Automatically Remove Emails & Continue**: Sanitizes the file and proceeds
  2. **Cancel & Upload Different File**: Cancels upload to fix manually

This ensures GDPR compliance and protects personal information.

#### Step 3: AI Processing

- AI analyzes the document content
- Extracts event titles, dates, and times
- Attempts to match locations and speakers with existing database entries
- Processing typically takes 5-30 seconds depending on file size

#### Step 4: Review & Edit

- Review all extracted events in a detailed interface
- Each event shows:
  - Title, description
  - Date, start time, end time
  - Location (matched from database)
  - Category, format, organizer
  - Speakers (matched from database)
- **Edit any event** by clicking the "Edit" button
- **Delete events** you don't want to import
- **Validation**: System ensures all events have required fields (title, date, start time)

#### Step 5: Final Confirmation

- Review summary of all events to be created
- Shows count and basic details
- Click "Confirm & Create All Events" to finalize
- Events are created in the database with status "published"

#### Step 6: Success

- Redirected to events page with success message
- All events are now visible in your calendar

---

## What AI Extracts (and What It Doesn't)

### ✅ AI WILL Extract:

- **Event Title**: Full event name
- **Event Date**: In YYYY-MM-DD format
- **Start Time**: In 24-hour format (HH:MM)
- **End Time**: In 24-hour format (HH:MM), if available
- **Description**: Brief description, if found in document

### ✅ AI WILL Match:

- **Locations**: If location names are mentioned, AI tries to match them with existing locations in your database
- **Speakers**: If speaker names are mentioned, AI tries to match them with existing speakers in your database

### ❌ AI WILL NOT:

- Create new locations, speakers, organizers, categories, or formats
- Modify existing database entries
- Extract email addresses (these are automatically detected and removed)
- Make assumptions about missing data
- Create duplicate entries

### Manual Assignment Required:

After AI extraction, you can manually assign:
- Categories
- Formats  
- Organizers

These must be selected from existing database entries during the review step.

---

## File Format Guidelines

### Excel Files (.xlsx, .xls)

**Recommended Structure:**

| Event Title | Date | Start Time | End Time | Location | Speaker |
|------------|------|------------|----------|----------|---------|
| Clinical Skills Workshop | 2025-10-15 | 14:00 | 16:00 | Main Hall | Dr. Smith |
| OSCE Revision Session | 2025-10-20 | 10:00 | 12:00 | Room A | Dr. Johnson |

**Tips:**
- Use clear column headers
- Date format: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY
- Time format: 24-hour (14:00) or 12-hour (2:00 PM)
- One event per row
- Include location and speaker names if you want them matched

### PDF Files (.pdf)

**Recommended Format:**
```
Event: Clinical Skills Workshop
Date: October 15, 2025
Time: 2:00 PM - 4:00 PM
Location: Main Conference Hall
Speaker: Dr. Sarah Smith

Event: OSCE Revision Session
Date: October 20, 2025
Time: 10:00 AM - 12:00 PM
Location: Training Room A
Speaker: Dr. Michael Johnson
```

**Tips:**
- Use clear labels (Event:, Date:, Time:, etc.)
- Separate events with blank lines
- Be consistent with formatting
- Include full dates (month, day, year)

### Word Documents (.docx, .doc)

**Recommended Format:**
```
Clinical Skills Workshop
October 15, 2025, 2:00 PM - 4:00 PM
Main Conference Hall
Speaker: Dr. Sarah Smith

OSCE Revision Session
October 20, 2025, 10:00 AM - 12:00 PM
Training Room A
Speaker: Dr. Michael Johnson
```

**Tips:**
- Use clear formatting with one event per section
- Bold or underline event titles
- Include complete date and time information
- Use standard date/time formats

---

## Troubleshooting

### Issue: "No events found"

**Possible causes:**
- File format is unclear or inconsistent
- Dates/times are not recognizable
- File content is too sparse

**Solutions:**
- Ensure dates are in recognizable formats (YYYY-MM-DD preferred)
- Use clear labels like "Event:", "Date:", "Time:"
- Provide more context in your document

### Issue: "Failed to process file"

**Possible causes:**
- File is corrupted
- File size exceeds 10MB
- Invalid file format
- OpenAI API quota exceeded

**Solutions:**
- Try re-exporting the file
- Reduce file size by removing images or unnecessary content
- Check that OPENAI_API_KEY is set correctly
- Verify OpenAI account has available credits

### Issue: "Locations/Speakers not matched"

**Possible causes:**
- Names don't exactly match database entries
- Names have typos or formatting differences

**Solutions:**
- Check exact spelling in your database
- Use full names as they appear in database
- Manually assign locations/speakers during review step

### Issue: "Email addresses detected"

**This is expected behavior!**

**What to do:**
- Review the list of detected emails
- Choose "Automatically Remove Emails & Continue" to sanitize
- Or "Cancel" and manually remove emails from your source file

---

## API Endpoints

The feature uses the following API endpoints:

1. **POST `/api/events/bulk-upload-parse`**
   - Parses uploaded file
   - Detects emails
   - Extracts events with OpenAI
   - Returns extracted event data

2. **GET `/api/events/bulk-upload-options`**
   - Fetches available locations, speakers, categories, formats, organizers
   - Used to populate dropdown options during review

3. **POST `/api/events/bulk-upload-create`**
   - Creates multiple events in database
   - Links speakers through junction table
   - Returns creation results

---

## Security & Privacy

### Data Protection

- **Email Detection**: Automatically detects and warns about email addresses
- **Sanitization**: Option to automatically remove emails before processing
- **Admin Only**: Feature is restricted to admin users only
- **No External Storage**: Files are processed in memory and not stored

### Database Security

- **Row Level Security (RLS)**: All database operations respect RLS policies
- **Admin Verification**: User role is verified before allowing bulk upload
- **No Overwrites**: Existing data is never modified, only new events are created

### OpenAI Privacy

- File content is sent to OpenAI for processing
- OpenAI's data usage policy applies
- Consider reviewing sensitive content before upload
- Email addresses are removed before sending to OpenAI (if auto-delete is selected)

---

## Technical Details

### Technologies Used

- **Next.js 14**: Server and client components
- **OpenAI GPT-4o**: AI-powered extraction
- **XLSX**: Excel file parsing
- **Supabase**: Database and authentication
- **TypeScript**: Type-safe development

### Performance

- **File Size Limit**: 10MB
- **Processing Time**: 5-30 seconds (depends on file size and content)
- **Concurrent Uploads**: One at a time per user
- **API Calls**: One OpenAI API call per upload

### Cost Considerations

- OpenAI API usage is charged per token
- Typical cost per upload: $0.01 - $0.05 (depends on file size)
- Larger files = more tokens = higher cost
- Monitor your OpenAI dashboard for usage

---

## Best Practices

1. **Prepare Your File**: Clean up the document before uploading
2. **Use Templates**: Create a standard template for consistent results
3. **Review Carefully**: Always review extracted data before confirming
4. **Test First**: Start with a small file to test the extraction quality
5. **Remove Emails**: Sanitize personal information before upload
6. **Backup Data**: Always maintain backups of your source files
7. **Monitor Costs**: Keep track of OpenAI API usage

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for more file formats (Google Sheets, CSV)
- [ ] Enhanced PDF parsing with table detection
- [ ] Batch processing of multiple files
- [ ] Scheduling of bulk uploads
- [ ] Advanced AI prompts customization
- [ ] Integration with calendar applications
- [ ] Duplicate detection before creation
- [ ] Undo/rollback functionality

---

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review OpenAI API status: [status.openai.com](https://status.openai.com)
3. Check Supabase status: [status.supabase.com](https://status.supabase.com)
4. Review browser console for detailed error messages

---

## Credits

Built with ❤️ using:
- [OpenAI GPT-4](https://openai.com)
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [XLSX](https://www.npmjs.com/package/xlsx)

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**License**: MIT

