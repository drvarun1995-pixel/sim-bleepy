# MedQuest Academy - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Feature Description](#feature-description)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [User Interface](#user-interface)
7. [Game Modes](#game-modes)
8. [Scoring System](#scoring-system)
9. [Admin Features](#admin-features)
10. [Setup Instructions](#setup-instructions)
11. [Configuration](#configuration)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

---

## Overview

**MedQuest Academy** is an interactive Single Best Answer (SBA) question game designed specifically for medical students in the UK. The application provides a gamified learning experience with multiple modes, real-time challenges, progress tracking, and comprehensive analytics.

### Key Features
- **Practice Mode**: Self-paced question practice
- **Challenge Mode**: Real-time multiplayer competitions (up to 8 players)
- **Campaign Mode**: Structured learning paths with unlockable sections
- **Leaderboards**: Global, weekly, monthly, and category-specific rankings
- **Admin Dashboard**: Comprehensive question management and analytics
- **AI-Powered Bulk Upload**: Intelligent question extraction from documents
- **Rich Text Editor**: Support for images, tables, and formatted text in questions

---

## Feature Description

### 1. Practice Mode
Students can practice medical questions at their own pace with:
- Customizable filters (category, difficulty, question count)
- 45-second timer per question
- Instant feedback with detailed explanations
- Progress tracking and statistics

### 2. Challenge Mode
Real-time competitive gameplay:
- Create or join challenges with a 6-digit code or QR code
- Up to 8 players per challenge
- 5-minute lobby countdown with "Start Now" option for host
- 1-minute reconnection allowance
- Real-time leaderboard updates
- Final results with individual question breakdown

### 3. Campaign Mode
Structured learning progression:
- Multiple campaigns with themed sections
- Unlock new sections by completing previous ones
- 80%+ accuracy required to master a section
- Progress tracking and completion badges

### 4. Leaderboards
Competitive rankings:
- Global, weekly, and monthly leaderboards
- Category-specific rankings
- Difficulty-based filtering
- User profiles with statistics

### 5. Admin Features
Comprehensive management tools:
- Question creation and editing with rich text editor
- Bulk upload with AI-powered extraction
- Category management
- Campaign management
- Analytics dashboard
- User statistics and performance metrics

---

## Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion (animations)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: NextAuth.js
- **Real-time**: Supabase Realtime + Server-Sent Events (SSE)
- **Storage**: Supabase Storage (for images)
- **AI**: OpenAI GPT-4o (for bulk upload)

### File Structure
```
app/
├── games/                          # Student-facing game pages
│   ├── page.tsx                    # Main games hub
│   ├── practice/                   # Practice mode
│   ├── challenge/                  # Challenge mode
│   ├── campaigns/                  # Campaign mode
│   ├── leaderboards/               # Leaderboards
│   ├── stats/                      # User statistics
│   └── help/                       # Help & tutorials
├── games-organiser/                # Admin-facing pages
│   ├── questions/                  # Question management
│   ├── create-question/            # Create/edit questions
│   ├── bulk-upload/                # Bulk upload
│   ├── game-categories/            # Category management
│   ├── game-campaigns/             # Campaign management
│   └── game-analytics/             # Analytics dashboard
├── api/
│   └── quiz/                       # Quiz API endpoints
│       ├── questions/              # Question CRUD
│       ├── practice/               # Practice session management
│       ├── challenges/             # Challenge management
│       ├── campaigns/              # Campaign management
│       ├── leaderboards/           # Leaderboard data
│       ├── bulk-upload-parse/      # AI parsing
│       └── bulk-upload-create/     # Bulk creation
components/
├── quiz/                           # Quiz components
│   ├── QuestionList.tsx            # Question list with filters
│   ├── QuestionForm.tsx            # Question editor
│   ├── PracticeSetup.tsx           # Practice configuration
│   ├── ChallengeLobby.tsx          # Challenge lobby
│   └── BulkQuestionReview.tsx      # Bulk upload review
lib/
├── quiz/
│   └── categories.ts               # Category and difficulty constants
supabase/
└── migrations/
    └── create-quiz-system.sql      # Database schema
```

---

## Database Schema

### Tables

#### `quiz_questions`
Stores all quiz questions with rich text support.

```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_text TEXT NOT NULL,
  scenario_image_url TEXT,
  scenario_table_data JSONB,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
  explanation_text TEXT NOT NULL,
  explanation_image_url TEXT,
  explanation_table_data JSONB,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_practice_sessions`
Tracks practice sessions for users.

```sql
CREATE TABLE quiz_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  category TEXT,
  difficulty TEXT,
  question_count INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0
);
```

#### `quiz_practice_answers`
Stores answers for practice sessions.

```sql
CREATE TABLE quiz_practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES quiz_practice_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  user_answer CHAR(1),
  is_correct BOOLEAN,
  time_taken INTEGER,
  points_earned INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_challenges`
Manages challenge sessions.

```sql
CREATE TABLE quiz_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id) NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  question_count INTEGER DEFAULT 10,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_challenge_participants`
Tracks participants in challenges.

```sql
CREATE TABLE quiz_challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES quiz_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'completed')),
  final_score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);
```

#### `quiz_challenge_answers`
Stores answers for challenge sessions.

```sql
CREATE TABLE quiz_challenge_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES quiz_challenges(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES quiz_challenge_participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  user_answer CHAR(1),
  is_correct BOOLEAN,
  time_taken INTEGER,
  points_earned INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_campaigns`
Defines learning campaigns.

```sql
CREATE TABLE quiz_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_campaign_sections`
Defines sections within campaigns.

```sql
CREATE TABLE quiz_campaign_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES quiz_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  question_count INTEGER DEFAULT 10,
  required_accuracy DECIMAL(5,2) DEFAULT 80.00,
  unlock_condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_campaign_progress`
Tracks user progress in campaigns.

```sql
CREATE TABLE quiz_campaign_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  section_id UUID REFERENCES quiz_campaign_sections(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed', 'mastered')),
  score INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, section_id)
);
```

#### `quiz_user_stats`
Aggregated user statistics.

```sql
CREATE TABLE quiz_user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  average_time_per_question DECIMAL(10,2),
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Questions

#### `GET /api/quiz/questions`
Fetch questions with optional filters.

**Query Parameters:**
- `category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty
- `status` (optional): Filter by status (draft, published, archived)
- `search` (optional): Search in question text
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "scenario_text": "string",
      "question_text": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "option_e": "string",
      "correct_answer": "A",
      "explanation_text": "string",
      "category": "string",
      "difficulty": "easy|medium|hard",
      "status": "draft|published|archived",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### `POST /api/quiz/questions`
Create a new question.

**Request Body:**
```json
{
  "scenario_text": "string",
  "scenario_image_url": "string (optional)",
  "scenario_table_data": "object (optional)",
  "question_text": "string",
  "option_a": "string",
  "option_b": "string",
  "option_c": "string",
  "option_d": "string",
  "option_e": "string",
  "correct_answer": "A|B|C|D|E",
  "explanation_text": "string",
  "explanation_image_url": "string (optional)",
  "explanation_table_data": "object (optional)",
  "category": "string",
  "difficulty": "easy|medium|hard",
  "tags": ["string"],
  "status": "draft|published"
}
```

#### `GET /api/quiz/questions/[id]`
Get a single question by ID.

#### `PUT /api/quiz/questions/[id]`
Update a question.

#### `DELETE /api/quiz/questions/[id]`
Delete a question.

### Practice Sessions

#### `POST /api/quiz/practice/start`
Start a new practice session.

**Request Body:**
```json
{
  "category": "string (optional)",
  "difficulty": "easy|medium|hard (optional)",
  "question_count": 10
}
```

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "category": "string",
    "difficulty": "string",
    "question_count": 10,
    "started_at": "timestamp"
  },
  "questions": [
    {
      "id": "uuid",
      "scenario_text": "string",
      "question_text": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "option_e": "string",
      "category": "string",
      "difficulty": "string"
    }
  ]
}
```

#### `POST /api/quiz/practice/answer`
Submit an answer for a practice question.

**Request Body:**
```json
{
  "session_id": "uuid",
  "question_id": "uuid",
  "user_answer": "A|B|C|D|E",
  "time_taken": 30
}
```

#### `GET /api/quiz/practice/[sessionId]/results`
Get practice session results.

### Challenges

#### `POST /api/quiz/challenges`
Create a new challenge.

**Request Body:**
```json
{
  "question_count": 10
}
```

**Response:**
```json
{
  "challenge": {
    "id": "uuid",
    "code": "ABC123",
    "host_id": "uuid",
    "status": "waiting",
    "question_count": 10,
    "created_at": "timestamp"
  }
}
```

#### `GET /api/quiz/challenges/[code]`
Get challenge details.

#### `POST /api/quiz/challenges/[code]/join`
Join a challenge.

#### `POST /api/quiz/challenges/[code]/start`
Start a challenge (host only).

#### `POST /api/quiz/challenges/[code]/answer`
Submit an answer in a challenge.

#### `GET /api/quiz/challenges/[code]/results`
Get challenge results.

### Campaigns

#### `GET /api/quiz/campaigns`
Get all campaigns.

#### `GET /api/quiz/campaigns/[id]`
Get campaign details with sections.

#### `POST /api/quiz/campaigns/[id]/sections/[sectionId]/start`
Start a campaign section.

### Leaderboards

#### `GET /api/quiz/leaderboards`
Get leaderboard data.

**Query Parameters:**
- `period`: all_time|weekly|monthly
- `category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "total_points": 1000,
      "correct_answers": 50,
      "total_questions": 60,
      "users": {
        "name": "string",
        "email": "string"
      }
    }
  ]
}
```

### Bulk Upload

#### `POST /api/quiz/bulk-upload-parse`
Parse uploaded file and extract questions using AI.

**Request:**
- `file`: File (Excel, PDF, or Word)
- `bulkCategory` (optional): Apply category to all questions
- `bulkDifficulty` (optional): Apply difficulty to all questions
- `additionalAiPrompt` (optional): Additional AI instructions

**Response:**
```json
{
  "questions": [
    {
      "scenario_text": "string",
      "question_text": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "option_e": "string",
      "correct_answer": "A",
      "explanation_text": "string",
      "category": "string",
      "difficulty": "easy|medium|hard",
      "isValid": true,
      "errors": []
    }
  ],
  "emailsFound": ["email@example.com"] // If emails detected
}
```

#### `POST /api/quiz/bulk-upload-create`
Create questions from parsed data.

**Request Body:**
```json
{
  "questions": [
    {
      "scenario_text": "string",
      "question_text": "string",
      "option_a": "string",
      "option_b": "string",
      "option_c": "string",
      "option_d": "string",
      "option_e": "string",
      "correct_answer": "A",
      "explanation_text": "string",
      "category": "string",
      "difficulty": "easy|medium|hard",
      "status": "draft|published"
    }
  ]
}
```

**Response:**
```json
{
  "created": 10,
  "failed": 0
}
```

### Analytics

#### `GET /api/quiz/analytics`
Get analytics data (admin only).

**Response:**
```json
{
  "stats": {
    "totalQuestions": 1000,
    "totalSessions": 5000,
    "totalUsers": 500,
    "averageScore": 75.5,
    "completionRate": 85.2,
    "averageTime": 30.5
  }
}
```

---

## User Interface

### Student Pages

#### `/games`
Main games hub with mode selection cards.

#### `/games/practice`
Practice mode setup page with filters and question count selection.

#### `/games/practice/[sessionId]`
Active practice session with question display and timer.

#### `/games/practice/[sessionId]/results`
Practice session results with score and breakdown.

#### `/games/challenge`
Challenge mode page to create or join challenges.

#### `/games/challenge/[code]`
Challenge lobby with participants and countdown.

#### `/games/challenge/[code]/game`
Active challenge game screen.

#### `/games/challenge/[code]/results`
Challenge results with rankings.

#### `/games/campaigns`
Campaigns list page.

#### `/games/campaigns/[id]`
Campaign details with sections.

#### `/games/leaderboards`
Leaderboards with filters.

#### `/games/stats`
User statistics dashboard.

#### `/games/help`
Help and tutorials page.

### Admin Pages

#### `/games-organiser/questions`
Question management with filters and search.

#### `/games-organiser/create-question`
Question creation/editing form with rich text editor.

#### `/games-organiser/bulk-upload`
Bulk upload page with AI parsing and review.

#### `/games-organiser/game-categories`
Category management page.

#### `/games-organiser/game-campaigns`
Campaign management page.

#### `/games-organiser/game-analytics`
Analytics dashboard.

---

## Game Modes

### Practice Mode
- **Purpose**: Self-paced learning and practice
- **Features**:
  - Customizable filters (category, difficulty, question count)
  - 45-second timer per question
  - Instant feedback with explanations
  - Progress tracking
- **Scoring**: Points calculated based on correctness, speed, difficulty, and streaks
- **Results**: Detailed breakdown of performance

### Challenge Mode
- **Purpose**: Real-time competitive gameplay
- **Features**:
  - Create or join with 6-digit code or QR code
  - Up to 8 players
  - 5-minute lobby countdown
  - "Start Now" option for host
  - 1-minute reconnection allowance
  - Real-time leaderboard updates
- **Scoring**: Same as practice mode, with competitive rankings
- **Results**: Final rankings with individual question breakdown

### Campaign Mode
- **Purpose**: Structured learning progression
- **Features**:
  - Multiple campaigns with themed sections
  - Unlock new sections by completing previous ones
  - 80%+ accuracy required to master a section
  - Progress tracking
- **Scoring**: Points contribute to overall campaign progress
- **Results**: Section completion status and mastery badges

---

## Scoring System

### Base Points
- **Correct Answer**: 100 points
- **Incorrect Answer**: 0 points

### Speed Bonus
- **0-15 seconds**: +75 points
- **15-30 seconds**: +50 points
- **30-45 seconds**: +25 points
- **>45 seconds**: 0 points (timeout)

### Difficulty Multiplier
- **Easy**: 1.0x
- **Medium**: 1.3x
- **Hard**: 1.6x

### Streak Multiplier
- **3+ consecutive correct**: 1.2x
- **5+ consecutive correct**: 1.5x
- **10+ consecutive correct**: 2.0x

### Final Score Calculation
```
base_points = 100 (if correct) or 0 (if incorrect)
speed_bonus = calculated based on time_taken
difficulty_multiplier = 1.0x, 1.3x, or 1.6x
streak_multiplier = 1.0x, 1.2x, 1.5x, or 2.0x

points_earned = (base_points + speed_bonus) * difficulty_multiplier * streak_multiplier
```

---

## Admin Features

### Question Management
- Create, edit, and delete questions
- Rich text editor for scenarios and explanations
- Image upload support
- Table data support (JSONB)
- Category and difficulty assignment
- Status management (draft, published, archived)
- Search and filter capabilities

### Bulk Upload
- AI-powered question extraction from documents
- Support for Excel, PDF, and Word files
- Automatic email detection and removal
- Review and edit extracted questions
- Bulk category and difficulty assignment
- Validation and error checking

### Category Management
- Add, edit, and delete categories
- Category list display
- Integration with question creation

### Campaign Management
- Create and manage campaigns
- Define sections with requirements
- Set unlock conditions
- Track campaign progress

### Analytics
- Total questions count
- Total practice sessions
- Active users count
- Average score
- Completion rate
- Average time per question
- Performance trends (coming soon)
- Category distribution (coming soon)

---

## Setup Instructions

### Prerequisites
1. **Node.js** (v18 or higher)
2. **PostgreSQL** database (via Supabase)
3. **Supabase account** with project setup
4. **OpenAI API key** (for bulk upload feature)
5. **NextAuth.js** configuration

### Step 1: Database Setup

1. **Run the migration**:
   ```bash
   # Apply the database schema
   psql -h your-db-host -U your-user -d your-database -f supabase/migrations/create-quiz-system.sql
   ```

2. **Verify tables are created**:
   ```sql
   \dt quiz_*
   ```

3. **Set up Row Level Security (RLS)**:
   - Enable RLS on user-specific tables (`quiz_practice_sessions`, `quiz_user_stats`, etc.)
   - Disable RLS on shared tables (`quiz_questions`) - authorization handled at API layer
   - Create policies for user data access

### Step 2: Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OpenAI (for bulk upload)
OPENAI_API_KEY=your-openai-api-key

# Storage (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 4: Configure NextAuth

Ensure your NextAuth configuration includes the quiz routes in the session callback and protected routes.

### Step 5: Set Up Storage Buckets

1. **Create storage buckets in Supabase**:
   - `quiz-images` - for question images
   - Set public access if needed for images

2. **Configure CORS** for image access

### Step 6: Initialize Categories

1. **Access the Game Categories page** (`/games-organiser/game-categories`)
2. **Add categories** manually or use the default categories from `lib/quiz/categories.ts`
3. **Verify categories** are available in question creation

### Step 7: Create Initial Questions

1. **Access the Create Question page** (`/games-organiser/create-question`)
2. **Create sample questions** or use bulk upload
3. **Set status to "published"** to make them available for games

### Step 8: Set Up Campaigns (Optional)

1. **Access the Game Campaigns page** (`/games-organiser/game-campaigns`)
2. **Create campaigns** with sections
3. **Define unlock conditions** for sections
4. **Set required accuracy** for mastery (default: 80%)

### Step 9: Test the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test student features**:
   - Create a practice session
   - Join a challenge
   - View leaderboards
   - Check statistics

3. **Test admin features**:
   - Create questions
   - Bulk upload questions
   - Manage categories
   - View analytics

### Step 10: Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variables** in your hosting platform

3. **Run database migrations** on production database

4. **Configure storage buckets** in production Supabase project

5. **Set up monitoring** and error tracking

---

## Configuration

### Categories

Categories are defined in `lib/quiz/categories.ts`:

```typescript
export const QUIZ_CATEGORIES = [
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pathology',
  'Pharmacology',
  // ... more categories
] as const
```

### Difficulties

Difficulties are defined in `lib/quiz/categories.ts`:

```typescript
export const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
```

### Scoring Configuration

Scoring parameters can be adjusted in the API routes:
- `app/api/quiz/practice/answer/route.ts`
- `app/api/quiz/challenges/[code]/answer/route.ts`

### Timer Configuration

Timer duration (45 seconds) is configured in:
- `components/quiz/QuestionDisplay.tsx` (if exists)
- Practice and challenge game pages

### Challenge Configuration

- **Max players**: 8 (configured in challenge creation)
- **Lobby countdown**: 5 minutes (300 seconds)
- **Reconnection window**: 1 minute (60 seconds)

---

## Testing

### Manual Testing Checklist

#### Student Features
- [ ] Practice mode: Create session, answer questions, view results
- [ ] Challenge mode: Create challenge, join challenge, play game, view results
- [ ] Campaigns: View campaigns, start sections, complete sections, unlock new sections
- [ ] Leaderboards: View rankings, filter by period/category/difficulty
- [ ] Statistics: View personal statistics and progress
- [ ] Help: Access help documentation

#### Admin Features
- [ ] Question management: Create, edit, delete, search, filter questions
- [ ] Bulk upload: Upload file, review questions, create questions
- [ ] Category management: Add, edit, delete categories
- [ ] Campaign management: Create campaigns, manage sections
- [ ] Analytics: View analytics dashboard

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Test question creation
curl -X POST http://localhost:3000/api/quiz/questions \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_text": "A 45-year-old patient...",
    "question_text": "What is the diagnosis?",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "option_e": "Option E",
    "correct_answer": "A",
    "explanation_text": "Explanation...",
    "category": "Cardiology",
    "difficulty": "medium",
    "status": "published"
  }'
```

### Database Testing

Verify data integrity:

```sql
-- Check questions
SELECT COUNT(*) FROM quiz_questions;

-- Check practice sessions
SELECT COUNT(*) FROM quiz_practice_sessions;

-- Check challenges
SELECT COUNT(*) FROM quiz_challenges;

-- Check user stats
SELECT * FROM quiz_user_stats LIMIT 10;
```

---

## Troubleshooting

### Common Issues

#### 1. Questions not appearing in games
- **Cause**: Questions are in "draft" status
- **Solution**: Set status to "published" in question management

#### 2. Images not loading
- **Cause**: Storage bucket not configured or CORS issues
- **Solution**: Verify storage bucket exists and CORS is configured in Supabase

#### 3. Bulk upload failing
- **Cause**: OpenAI API key not configured or file format not supported
- **Solution**: Verify OpenAI API key is set and file is in supported format (Excel, PDF, Word)

#### 4. Challenge not starting
- **Cause**: Not enough participants or host not starting
- **Solution**: Ensure at least one participant is ready and host clicks "Start Now"

#### 5. Leaderboard not updating
- **Cause**: Stats not being calculated or aggregated
- **Solution**: Verify `quiz_user_stats` table is being updated and leaderboard query is correct

#### 6. Categories not saving
- **Cause**: API endpoint not implemented
- **Solution**: Implement category management API endpoints (currently using local state)

#### 7. Analytics showing zero values
- **Cause**: Analytics API not implemented or no data
- **Solution**: Implement analytics API endpoint to aggregate data from database

### Error Logging

Check browser console and server logs for errors:
- **Browser**: Open DevTools → Console
- **Server**: Check terminal output or logging service

### Database Issues

Check database connections and queries:
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## What You Need to Do to Make This Feature Work

### 1. Database Setup ✅
- [x] Run the migration file (`supabase/migrations/create-quiz-system.sql`)
- [ ] Verify all tables are created
- [ ] Set up RLS policies (if needed)
- [ ] Create storage buckets for images

### 2. Environment Variables ✅
- [ ] Set `DATABASE_URL`
- [ ] Set `SUPABASE_URL` and keys
- [ ] Set `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- [ ] Set `OPENAI_API_KEY` (for bulk upload)
- [ ] Set storage bucket configuration

### 3. API Endpoints Implementation 🔄
- [x] Question CRUD endpoints
- [x] Practice session endpoints
- [x] Challenge endpoints
- [x] Campaign endpoints
- [x] Leaderboard endpoints
- [x] Bulk upload endpoints
- [ ] **Analytics endpoint** (`GET /api/quiz/analytics`) - **NEEDS IMPLEMENTATION**
- [ ] **Category management endpoints** - **NEEDS IMPLEMENTATION**
  - `GET /api/quiz/categories`
  - `POST /api/quiz/categories`
  - `PUT /api/quiz/categories/[id]`
  - `DELETE /api/quiz/categories/[id]`

### 4. Initialize Data 📝
- [ ] **Create categories** manually via `/games-organiser/game-categories` page
- [ ] **Create initial questions** via `/games-organiser/create-question` or bulk upload
- [ ] **Set question status to "published"** to make them available
- [ ] **Create campaigns** (optional) via `/games-organiser/game-campaigns`

### 5. Test Features ✅
- [ ] Test practice mode end-to-end
- [ ] Test challenge mode with multiple users
- [ ] Test campaign mode progression
- [ ] Test leaderboards with data
- [ ] Test admin features (create, edit, delete questions)
- [ ] Test bulk upload with sample files

### 6. Production Deployment 🚀
- [ ] Set environment variables in production
- [ ] Run migrations on production database
- [ ] Configure storage buckets in production
- [ ] Set up monitoring and error tracking
- [ ] Test all features in production environment

### 7. Optional Enhancements 🔮
- [ ] Implement real-time updates for challenges (WebSockets/SSE)
- [ ] Add chart visualizations for analytics
- [ ] Implement category management API
- [ ] Add email notifications for challenge invites
- [ ] Add push notifications for mobile
- [ ] Implement question review and approval workflow
- [ ] Add question difficulty auto-adjustment based on performance
- [ ] Implement spaced repetition algorithm
- [ ] Add social features (share results, invite friends)

---

## Additional Notes

### Security Considerations
- All API endpoints should verify user authentication
- Admin endpoints should check for admin role
- User-specific data should be filtered by `user_id`
- File uploads should be validated and sanitized
- SQL injection prevention (use parameterized queries)
- XSS prevention (sanitize user inputs)

### Performance Optimization
- Implement pagination for large question lists
- Cache frequently accessed data (categories, campaigns)
- Optimize database queries with indexes
- Use CDN for image assets
- Implement lazy loading for images
- Use database connection pooling

### Accessibility
- Ensure keyboard navigation works
- Add ARIA labels for screen readers
- Ensure color contrast meets WCAG standards
- Provide alternative text for images
- Test with screen readers

### Mobile Optimization
- Ensure responsive design works on all screen sizes
- Optimize touch targets for mobile
- Test on various mobile devices
- Consider mobile-specific features (push notifications)

---

## Support and Maintenance

### Regular Maintenance Tasks
1. **Monitor database performance** and optimize queries
2. **Review and update questions** regularly
3. **Monitor user feedback** and address issues
4. **Update categories** as needed
5. **Backup database** regularly
6. **Update dependencies** and security patches

### Monitoring
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor API response times
- Track user engagement metrics
- Monitor database performance
- Set up alerts for critical errors

---

## Conclusion

MedQuest Academy is a comprehensive quiz game platform for medical students. This documentation provides a complete overview of the system, including setup instructions, API documentation, and troubleshooting guides. Follow the setup instructions carefully to get the system running, and refer to the troubleshooting section if you encounter any issues.

For additional support or questions, please refer to the codebase or contact the development team.


