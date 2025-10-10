# Bulk Upload with AI - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Add OpenAI API Key

Add to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get your key from: https://platform.openai.com/api-keys

### 2. Verify Dependencies

Already installed in your project:
```bash
✓ openai@^4.20.1
✓ xlsx@^0.18.5
```

### 3. Access the Feature

**Option 1**: Events page → "Bulk Upload with AI" button  
**Option 2**: Event Data page → "Bulk Upload with AI" menu  
**Option 3**: Direct URL: `/bulk-upload-ai`

---

## 📝 Preparing Your File

### Excel Template (Recommended)

| Event Title | Date | Start Time | End Time | Location | Speaker |
|------------|------|------------|----------|----------|---------|
| Workshop Name | 2025-10-15 | 14:00 | 16:00 | Main Hall | Dr. Smith |

### Quick Tips

✅ Use clear column headers  
✅ Date format: YYYY-MM-DD  
✅ Time format: 24-hour (HH:MM)  
✅ Include location/speaker names for auto-matching  
✅ Max file size: 10MB  
✅ Supported: .xlsx, .xls, .pdf, .docx, .doc  

---

## 📋 Upload Process

1. **Upload**: Drag & drop or click to select file
2. **Email Check**: System warns if emails detected
3. **AI Processing**: Extracts events (5-30 seconds)
4. **Review**: Edit extracted information
5. **Confirm**: Create all events at once

---

## ✅ What AI Does

**Extracts:**
- Event titles
- Dates (YYYY-MM-DD)
- Start/End times (HH:MM)
- Descriptions (if available)

**Matches:**
- Existing locations
- Existing speakers

**Does NOT:**
- Create new locations/speakers
- Modify existing data
- Extract emails (removed for privacy)

---

## 🔧 Common Issues

### "No events found"
- Ensure dates are in YYYY-MM-DD format
- Use clear labels: "Event:", "Date:", "Time:"
- Check file isn't corrupted

### "Locations/Speakers not matched"
- Check exact spelling in database
- Manually assign during review step

### "Email addresses detected"
- **Expected!** Choose "Auto Remove" to continue safely

### "Failed to process"
- Check OPENAI_API_KEY is set
- Verify file size < 10MB
- Check OpenAI account has credits

---

## 💡 Best Practices

1. **Start Small**: Test with 5-10 events first
2. **Use Templates**: Create standard format for consistency
3. **Review Always**: Check extracted data before confirming
4. **Remove PII**: Clean personal information before upload
5. **Monitor Costs**: Each upload costs ~$0.01-$0.05

---

## 🎯 Example File Content

### Excel Format
```
Row 1: Event Title | Date       | Start Time | End Time | Location | Speaker
Row 2: OSCE Review | 2025-10-15 | 09:00     | 11:00   | Room A   | Dr. Jones
Row 3: Clinical Skills | 2025-10-20 | 14:00  | 16:00   | Lab 1    | Dr. Smith
```

### PDF/Word Format
```
Event: OSCE Review Session
Date: October 15, 2025
Time: 9:00 AM - 11:00 AM
Location: Training Room A
Speaker: Dr. Jones

Event: Clinical Skills Workshop
Date: October 20, 2025
Time: 2:00 PM - 4:00 PM
Location: Skills Lab 1
Speaker: Dr. Smith
```

---

## 📊 Cost Estimate

- Small file (5-10 events): ~$0.01
- Medium file (20-50 events): ~$0.02-$0.03
- Large file (100+ events): ~$0.05+

*Actual costs depend on file content and complexity*

---

## 🔐 Security Features

✓ Admin-only access  
✓ Automatic email detection  
✓ Privacy warnings  
✓ No file storage  
✓ Database RLS respected  

---

## 📚 Need More Help?

See full documentation: `BULK_UPLOAD_AI_GUIDE.md`

---

**Ready to start?** Head to `/bulk-upload-ai` and upload your first file! 🎉

