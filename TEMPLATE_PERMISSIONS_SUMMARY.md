# 📋 Template Permissions Summary

## 🎯 Overview

Certificate templates are now stored in the database with proper Row Level Security (RLS) policies to ensure proper access control.

---

## 🔐 Permission Rules

### **Admin Role**
✅ **Can see ALL templates** from everyone
✅ Can create new templates
✅ Can edit ANY template  
✅ Can delete ANY template
✅ Can use ANY template to generate certificates

**Use Case:** Admin can help any team member by editing their templates or using them to generate certificates.

---

### **MedEd Team Role**
✅ Can see **ONLY their own** templates
✅ Can create new templates
✅ Can edit their own templates
✅ Can delete their own templates
✅ Can use their own templates to generate certificates
❌ **Cannot see** templates created by other MedEd Team members
❌ **Cannot see** templates created by CTF members
❌ **Cannot see** templates created by Educators

**Use Case:** MedEd Team member creates templates for their events and keeps them private from other teams.

---

### **CTF Role**
✅ Can see **ONLY their own** templates
✅ Can create new templates
✅ Can edit their own templates
✅ Can delete their own templates
✅ Can use their own templates to generate certificates
❌ **Cannot see** templates created by MedEd Team members
❌ **Cannot see** templates created by other CTF members
❌ **Cannot see** templates created by Educators

**Use Case:** CTF team creates templates for career fair events and keeps them separate from other teams.

---

### **Educator Role** (For Future Use)
✅ Can see **ONLY their own** templates
✅ Can create new templates
✅ Can edit their own templates
✅ Can delete their own templates
❌ **Cannot generate certificates yet** (permission to be added later)
❌ **Cannot see** templates from other educators or teams

**Note:** Educator permissions will be refined later based on requirements.

---

### **Student Role**
❌ Cannot see any templates
❌ Cannot create templates
❌ Cannot generate certificates

**Note:** Students can only view and download their own certificates.

---

## 🗄️ Database Structure

```sql
certificate_templates
├── id (text, primary key)
├── name (text)
├── background_image (text)
├── fields (jsonb)
├── canvas_size (jsonb)
├── created_by (uuid) ← WHO OWNS THIS TEMPLATE
├── created_at (timestamp)
├── updated_at (timestamp)
├── last_used_at (timestamp)
└── usage_count (integer)
```

---

## 📊 Examples

### Scenario 1: Admin Managing Templates
```
Admin logs in:
- Sees "Advanced Cardiac Certificate" by MedEd User 1
- Sees "CPD Workshop Certificate" by MedEd User 2
- Sees "Career Fair Certificate" by CTF User 1
- Sees "Student Workshop" by CTF User 2
= Can see and use ALL 4 templates
```

### Scenario 2: MedEd Team Member
```
MedEd User 1 logs in:
- Sees "Advanced Cardiac Certificate" (their own)
- Does NOT see "CPD Workshop Certificate" (created by MedEd User 2)
- Does NOT see any CTF templates
= Can see and use ONLY 1 template (their own)
```

### Scenario 3: CTF Member
```
CTF User 1 logs in:
- Sees "Career Fair Certificate" (their own)
- Does NOT see "Student Workshop" (created by CTF User 2)
- Does NOT see any MedEd templates
= Can see and use ONLY 1 template (their own)
```

---

## 🔄 Template Sharing (Future Feature)

If you want to allow template sharing between team members in the future, you could add:

1. **Public Templates** - A flag to make a template visible to all staff
2. **Shared With** - A list of user IDs who can access the template
3. **Team Templates** - Templates owned by a team rather than an individual

For now, templates are **private by default** with only Admin having full access.

---

## 🚀 How It Works in the App

### When Creating a Template:
```typescript
// User creates template
const template = {
  id: 'template-' + Date.now(),
  name: 'My Event Certificate',
  background_image: '...',
  fields: [...],
  created_by: currentUserId  // ← IMPORTANT!
}

// Saved to database
await supabase
  .from('certificate_templates')
  .insert(template)
```

### When Viewing Templates:
```typescript
// MedEd/CTF user queries templates
const { data } = await supabase
  .from('certificate_templates')
  .select('*')
// RLS automatically filters to show only THEIR templates

// Admin queries templates
const { data } = await supabase
  .from('certificate_templates')
  .select('*')
// RLS shows ALL templates (no filter for admin)
```

### When Generating Certificates:
```typescript
// User selects a template (can only see their own or all if admin)
// System uses template_id to generate certificates
// Stores template_id in certificates table for tracking
```

---

## ✅ Benefits

1. **Privacy**: Teams can't see each other's templates
2. **Admin Oversight**: Admin can help any team member
3. **Auditability**: Track who created what template
4. **Flexibility**: Easy to add sharing features later
5. **Security**: RLS enforced at database level

---

## 📝 Migration

The `migrations/create-certificate-templates-table.sql` file includes:
- Table creation
- All RLS policies
- Indexes for performance
- Proper comments and documentation

**Run this migration** along with the certificates migration to enable template storage in database.

---

## 🎯 Summary

| Role | View Templates | Create | Edit | Delete | Generate Certs |
|------|---------------|--------|------|--------|----------------|
| **Admin** | ALL | ✅ | ALL | ALL | ✅ |
| **MedEd Team** | Own only | ✅ | Own | Own | ✅ |
| **CTF** | Own only | ✅ | Own | Own | ✅ |
| **Educator** | Own only | ✅ | Own | Own | 🔜 Future |
| **Student** | ❌ | ❌ | ❌ | ❌ | ❌ |

This ensures proper separation of concerns while giving Admin full oversight! 🎯












