# 🚀 Smart Bulk Upload - Quick Reference

## What Was Built

A complete AI-powered bulk upload system that allows admins to upload Excel, PDF, or Word documents and automatically extract event information using OpenAI GPT-4.

---

## ⚡ Quick Start (3 Steps)

### 1. Add OpenAI API Key

Add to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get your key from: https://platform.openai.com/api-keys

### 2. Restart Server

```bash
npm run dev
```

### 3. Try It Out

Navigate to: `http://localhost:3000/bulk-upload-ai`

---

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `BULK_UPLOAD_AI_GUIDE.md` | **Complete guide** with everything you need to know |
| `BULK_UPLOAD_QUICK_START.md` | **Quick reference** for getting started fast |
| `BULK_UPLOAD_SETUP_CHECKLIST.md` | **Testing checklist** to verify everything works |
| `BULK_UPLOAD_IMPLEMENTATION_SUMMARY.md` | **Technical details** of what was implemented |

---

## 📋 Files Created

### Pages & Components
- ✅ `app/bulk-upload-ai/page.tsx` - Main upload page
- ✅ `components/BulkEventReview.tsx` - Review interface

### API Routes
- ✅ `app/api/events/bulk-upload-parse/route.ts` - File parsing with AI
- ✅ `app/api/events/bulk-upload-options/route.ts` - Dropdown options
- ✅ `app/api/events/bulk-upload-create/route.ts` - Bulk creation

### Navigation
- ✅ Added button to `app/events/page.tsx`
- ✅ Added menu item to `app/event-data/page.tsx`

---

## 🎯 Key Features

✅ AI extracts event titles, dates, and times  
✅ Matches existing locations and speakers  
✅ Detects and removes email addresses  
✅ Supports Excel, PDF, and Word files  
✅ Review and edit before saving  
✅ Creates multiple events at once  
✅ Admin-only access  

---

## 💻 How to Use

1. **Navigate** to `/bulk-upload-ai` (or click "Smart Bulk Upload" button)
2. **Upload** your Excel, PDF, or Word file
3. **Review** extracted events and edit as needed
4. **Confirm** to create all events at once

---

## 🔐 What You Need

### Required Environment Variables

```env
OPENAI_API_KEY=sk-...              # Get from platform.openai.com
NEXT_PUBLIC_SUPABASE_URL=...       # Already configured
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # Already configured
SUPABASE_SERVICE_ROLE_KEY=...      # Already configured
NEXTAUTH_SECRET=...                # Already configured
```

### Required User Role

- Must be logged in as **admin**
- Non-admin users will be redirected

---

## 📊 Example File Format

### Excel Template

| Event Title | Date | Start Time | End Time | Location | Speaker |
|------------|------|------------|----------|----------|---------|
| OSCE Review | 2025-12-01 | 09:00 | 11:00 | Room A | Dr. Smith |
| Clinical Skills | 2025-12-05 | 14:00 | 16:00 | Lab 1 | Dr. Jones |

### PDF/Word Format

```
Event: OSCE Review Session
Date: December 1, 2025
Time: 9:00 AM - 11:00 AM
Location: Training Room A
Speaker: Dr. Smith

Event: Clinical Skills Workshop
Date: December 5, 2025
Time: 2:00 PM - 4:00 PM
Location: Skills Lab 1
Speaker: Dr. Jones
```

---

## 💰 Cost

- **Small file (5-10 events)**: ~$0.01-$0.02
- **Medium file (20-50 events)**: ~$0.02-$0.03
- **Large file (100+ events)**: ~$0.05-$0.10

Monitor costs at: https://platform.openai.com/usage

---

## ⚠️ Important Notes

### What AI Does
✅ Extracts event titles, dates, times  
✅ Matches existing locations and speakers  

### What AI Doesn't Do
❌ Create new locations or speakers  
❌ Modify formats, categories, organizers  
❌ Extract email addresses  

### What You Must Do
👤 Manually assign categories  
👤 Manually assign formats  
👤 Manually assign organizers  

---

## 🐛 Troubleshooting

### "Cannot find module 'openai'"
```bash
npm install openai@^4.20.1 xlsx@^0.18.5
```

### "OPENAI_API_KEY is not defined"
1. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
2. Restart server: `npm run dev`

### "Insufficient credits"
1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Add credits

### "No events extracted"
- Check file format matches examples
- Ensure dates are clear (YYYY-MM-DD preferred)
- Add more context to your file

---

## 📖 Next Steps

1. **Read**: `BULK_UPLOAD_QUICK_START.md` for detailed setup
2. **Test**: Use `BULK_UPLOAD_SETUP_CHECKLIST.md` to verify
3. **Learn**: Read `BULK_UPLOAD_AI_GUIDE.md` for complete documentation

---

## 🎉 Ready to Use!

Once you've added your OpenAI API key, the feature is ready to use!

Navigate to: **`/bulk-upload-ai`** and upload your first file.

---

**Questions?** Check the documentation files listed above or review the setup checklist.

**Version**: 1.0.0  
**Status**: ✅ Complete and ready to use

