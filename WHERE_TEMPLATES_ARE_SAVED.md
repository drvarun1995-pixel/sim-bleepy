# 📍 Where Certificate Templates Are Saved

## 🗄️ **Storage Location**

Templates are saved in your **Supabase database** in the `certificate_templates` table.

### **To View Templates in Supabase:**

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project**: `mtugjycjaztilqiqcjqr`
3. **Click**: "Table Editor" (left sidebar)
4. **Find**: `certificate_templates` table
5. **View**: All saved templates will be listed there

---

## 🔍 **Quick SQL Check**

Run this in **Supabase SQL Editor** to see all templates:

```sql
SELECT 
  id,
  name,
  created_by,
  created_at,
  LENGTH(background_image) as image_size,
  jsonb_array_length(fields) as field_count
FROM certificate_templates
ORDER BY created_at DESC;
```

---

## 🐛 **Debugging: Why Template Might Not Be Saving**

### **1. Check Browser Console**

After clicking "Save Template", check the browser console for:

```
📤 Saving template: { name: "...", fieldCount: X, canvasSize: {...} }
📥 API Response status: 201
📥 API Response data: { success: true, template: {...} }
```

**If you see errors**, they will tell us what's wrong!

### **2. Common Issues**

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Not logged in | Refresh page and log in again |
| `403 Insufficient permissions` | Wrong role | Must be admin, meded_team, or ctf |
| `500 Internal Server Error` | Server issue | Check API route logs |

### **3. Run Verification Script**

Run `verify-template-system.sql` in Supabase SQL Editor to check:
- ✅ Table exists
- ✅ RLS is configured
- ✅ Your user role
- ✅ Existing templates

---

## 📊 **Table Structure**

The `certificate_templates` table has:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique template ID |
| `name` | TEXT | Template name |
| `background_image` | TEXT | Base64 image data |
| `fields` | JSONB | Array of text fields |
| `canvas_size` | JSONB | Canvas dimensions |
| `created_by` | UUID | User who created it |
| `created_at` | TIMESTAMP | Creation date |
| `updated_at` | TIMESTAMP | Last update |

---

## 🔐 **Permissions**

Only these roles can create templates:
- ✅ **admin**
- ✅ **meded_team**
- ✅ **ctf**

Check your role:
```sql
SELECT role FROM users WHERE id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';
```

---

## 🚀 **Test Again**

1. **Go to**: http://localhost:3000/certificates/image-builder
2. **Upload an image**
3. **Add text fields**
4. **Click "Save Template"**
5. **Open browser console** (F12)
6. **Watch for the 📤 and 📥 logs**
7. **Tell me what you see!**

If it still doesn't work, **send me the browser console logs** and I'll fix it immediately! 🔧


