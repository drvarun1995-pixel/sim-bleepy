# Dynamic Feedback Templates System

## 🎯 Overview
A complete dynamic feedback template system that allows administrators to create, manage, and reuse feedback form templates instead of using hardcoded templates.

## 📊 Database Schema

### `feedback_templates` Table
```sql
CREATE TABLE feedback_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'custom' CHECK (category IN ('workshop', 'seminar', 'clinical_skills', 'custom', 'system')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, created_by)
);
```

### Key Features:
- **Template Categorization**: workshop, seminar, clinical_skills, custom, system
- **Usage Tracking**: Automatic usage count increment
- **System Templates**: Pre-built templates that can't be deleted
- **User Templates**: Custom templates created by users
- **Soft Delete**: Templates can be deactivated instead of deleted

## 🔐 Row Level Security (RLS) Policies

### View Permissions:
- **Anyone**: Can view active templates
- **Staff**: Can view all templates (including inactive)

### Create Permissions:
- **Staff Only**: admin, meded_team, ctf roles

### Update Permissions:
- **Admins**: Can update any template
- **Staff**: Can only update their own templates

### Delete Permissions:
- **Admins Only**: Can delete templates
- **System Templates**: Cannot be deleted

## 🚀 API Endpoints

### 1. List Templates
```
GET /api/feedback/templates
```
**Query Parameters:**
- `category`: Filter by category (workshop, seminar, clinical_skills, custom, system, all)
- `includeInactive`: Include inactive templates (true/false)
- `limit`: Maximum number of templates to return (default: 50)

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "uuid",
      "name": "Workshop Evaluation",
      "description": "Comprehensive feedback form for workshops",
      "category": "workshop",
      "questions": [...],
      "is_system_template": true,
      "is_active": true,
      "usage_count": 15,
      "question_count": 5,
      "created_at": "2025-01-29T10:00:00Z",
      "users": {
        "id": "uuid",
        "name": "Admin User",
        "role": "admin"
      }
    }
  ]
}
```

### 2. Create Template
```
POST /api/feedback/templates
```
**Body:**
```json
{
  "name": "My Custom Template",
  "description": "Template description",
  "category": "custom",
  "questions": [
    {
      "type": "rating",
      "question": "How would you rate this event?",
      "required": true,
      "scale": 5
    }
  ],
  "is_active": true
}
```

### 3. Get Template
```
GET /api/feedback/templates/[templateId]
```

### 4. Update Template
```
PUT /api/feedback/templates/[templateId]
```

### 5. Delete Template
```
DELETE /api/feedback/templates/[templateId]
```

### 6. Increment Usage
```
POST /api/feedback/templates/[templateId]/usage
```

## 🎨 Frontend Components

### 1. Template Management Page
**Path:** `/feedback/templates`
- **Features:**
  - Grid view of all templates
  - Search and filter functionality
  - Category filtering
  - Show/hide inactive templates
  - Template actions (view, edit, duplicate, delete)
  - Usage statistics display

### 2. Dynamic Template Selection
**Path:** Event creation form
- **Features:**
  - Dynamic dropdown populated from database
  - Template preview with question count and usage stats
  - Auto-generate option (default simple template)
  - Custom form creation option
  - Existing form selection option

## 🔄 Integration Flow

### 1. Template Creation
1. User creates template via `/feedback/templates` page
2. Template stored in `feedback_templates` table
3. Template becomes available in event creation dropdown

### 2. Event Creation with Template
1. User enables "QR Code Attendance Tracking"
2. Feedback template dropdown appears
3. User selects template (or auto-generate)
4. Template questions loaded dynamically
5. Feedback form created using selected template
6. Template usage count incremented

### 3. Template Management
1. Templates can be viewed, edited, duplicated, or deleted
2. System templates are protected from deletion
3. Usage statistics tracked automatically
4. Templates can be deactivated instead of deleted

## 📈 System Templates Included

### 1. Basic Event Feedback
- **Category:** custom
- **Questions:** 3 (rating, text, yes/no)
- **Use Case:** General events

### 2. Workshop Evaluation
- **Category:** workshop
- **Questions:** 5 (ratings, text, long_text, yes/no)
- **Use Case:** Workshop-style events

### 3. Seminar Assessment
- **Category:** seminar
- **Questions:** 4 (ratings, text)
- **Use Case:** Seminar and presentation events

### 4. Clinical Skills Training
- **Category:** clinical_skills
- **Questions:** 6 (ratings, text, yes/no)
- **Use Case:** Clinical skills training sessions

## 🛠️ Database Functions

### 1. `update_feedback_templates_updated_at()`
- Automatically updates `updated_at` timestamp on template changes

### 2. `increment_template_usage(template_id)`
- Increments usage count for a template

### 3. `get_templates_by_category(category)`
- Returns templates filtered by category with question count

## 📊 Views

### `feedback_template_stats`
- Comprehensive view with template statistics
- Includes creator information and question counts
- Ordered by usage count and creation date

## 🔧 Migration Files

### `migrations/create-feedback-templates-system.sql`
- Creates the complete template system
- Includes RLS policies, indexes, and functions
- Inserts default system templates
- Sets up proper permissions and constraints

## 🎯 Benefits

### 1. **Flexibility**
- Create unlimited custom templates
- Reuse templates across multiple events
- Easy template management and organization

### 2. **Consistency**
- Standardized feedback collection
- Template-based form creation
- Consistent question formats

### 3. **Analytics**
- Usage tracking per template
- Template performance metrics
- Creator attribution

### 4. **Scalability**
- Database-driven template system
- Efficient querying and filtering
- Proper indexing for performance

### 5. **User Experience**
- Intuitive template selection
- Preview of template contents
- Easy template creation and management

## 🚀 Next Steps

1. **Run Migration**: Execute `create-feedback-templates-system.sql`
2. **Test Templates**: Create and test custom templates
3. **Monitor Usage**: Track template usage and performance
4. **Expand Categories**: Add new template categories as needed
5. **Template Sharing**: Consider template sharing between users

## 🔍 Technical Notes

- **Question Types Supported**: rating, text, long_text, yes_no, multiple_choice
- **Template Validation**: Server-side validation of question structure
- **Usage Tracking**: Automatic increment on template usage
- **Permission System**: Role-based access control
- **Performance**: Optimized queries with proper indexing
- **Security**: RLS policies prevent unauthorized access

This system provides a complete, scalable solution for dynamic feedback template management, replacing the previous hardcoded approach with a flexible, database-driven system.
