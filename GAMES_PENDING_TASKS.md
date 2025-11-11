# Games Feature - Pending Tasks

This document outlines all pending tasks and incomplete features for the MedQuest Academy quiz game feature.

## ✅ Completed Features

1. **Practice Mode** - Fully functional
   - ✅ Question selection and filtering
   - ✅ Customizable time limits (30, 45, 60, 75, 90 seconds)
   - ✅ Timer and answer submission
   - ✅ Results page with breakdown (correct, incorrect, unanswered)
   - ✅ Session tracking and scoring

2. **Challenge Mode** - Fully functional
   - ✅ Create/join challenges with code or QR code
   - ✅ Real-time multiplayer (up to 8 players)
   - ✅ Lobby countdown and "Start Now" option
   - ✅ Real-time leaderboard updates
   - ✅ Results and rankings

3. **Question Management** - Fully functional
   - ✅ Create, edit, delete questions
   - ✅ Rich text editor for scenarios and explanations
   - ✅ Image upload support
   - ✅ Bulk upload with AI extraction
   - ✅ Category management (CRUD)

4. **Analytics Dashboard** - Fully functional
   - ✅ Analytics API endpoint
   - ✅ Analytics page with stats

5. **Games Portal** - Fully functional
   - ✅ Main hub page at `/games`
   - ✅ Navigation to all game modes
   - ✅ Beta notice component

---

## 🚧 Pending Tasks

### 1. **Campaign Mode - Missing Gameplay Page** (High Priority)

**Issue**: Campaign sections can be started via API, but there's no page to actually play the questions.

**What's Missing**:
- ❌ Page at `/games/campaigns/sections/[id]` to play campaign section questions
- ❌ Integration with existing question display component
- ❌ Timer and answer submission for campaign sections
- ❌ Results page for campaign sections
- ❌ Progress tracking and section completion

**Files Needed**:
- `app/games/campaigns/sections/[id]/page.tsx` - Gameplay page
- `app/games/campaigns/sections/[id]/results/page.tsx` - Results page
- API integration with `/api/quiz/campaigns/sections/[id]/start` (already exists)
- API integration with `/api/quiz/campaigns/sections/[id]/complete` (already exists)

**Estimated Effort**: 2-3 hours

---

### 2. **Campaign Management (Admin) - Full CRUD** (High Priority)

**Issue**: Admin can view campaigns but cannot create, edit, or delete them.

**What's Missing**:
- ❌ API endpoints for campaign CRUD:
  - `POST /api/quiz/campaigns` - Create campaign
  - `PUT /api/quiz/campaigns/[id]` - Update campaign
  - `DELETE /api/quiz/campaigns/[id]` - Delete campaign
- ❌ API endpoints for campaign sections CRUD:
  - `POST /api/quiz/campaigns/[id]/sections` - Create section
  - `PUT /api/quiz/campaigns/sections/[id]` - Update section
  - `DELETE /api/quiz/campaigns/sections/[id]` - Delete section
- ❌ UI for creating/editing campaigns
- ❌ UI for managing campaign sections (add questions, set unlock requirements)
- ❌ Question assignment to campaign sections

**Files Needed**:
- `app/api/quiz/campaigns/route.ts` - Add POST method
- `app/api/quiz/campaigns/[id]/route.ts` - Add PUT, DELETE methods
- `app/api/quiz/campaigns/[id]/sections/route.ts` - Add POST method
- `app/api/quiz/campaigns/sections/[id]/route.ts` - Create new file for PUT, DELETE
- `app/games-organiser/game-campaigns/page.tsx` - Add CRUD UI
- `components/quiz/CampaignForm.tsx` - Create campaign form component
- `components/quiz/CampaignSectionForm.tsx` - Create section form component

**Estimated Effort**: 4-5 hours

---

### 3. **User Statistics Page - Real Data** (Medium Priority)

**Issue**: Statistics page shows placeholder data, not real user statistics.

**What's Missing**:
- ❌ API endpoint: `GET /api/quiz/stats` - Aggregate user statistics
- ❌ Statistics aggregation from:
  - `quiz_practice_sessions` - Total sessions, questions answered, accuracy
  - `quiz_practice_answers` - Correct/incorrect counts, average time
  - `quiz_challenge_answers` - Challenge performance
  - `quiz_user_progress` - Campaign progress
- ❌ Calculate:
  - Total points
  - Overall accuracy
  - Current streak
  - Best category
  - Global rank
  - Average time per question
- ❌ Update stats page to use real API data

**Files Needed**:
- `app/api/quiz/stats/route.ts` - Create statistics API endpoint
- `app/games/stats/page.tsx` - Update to fetch from API

**Estimated Effort**: 2-3 hours

---

### 4. **Leaderboard Data Population** (Medium Priority)

**Issue**: Leaderboard table exists but data is not being populated when users complete sessions.

**What's Missing**:
- ❌ Leaderboard update logic when practice sessions complete
- ❌ Leaderboard update logic when challenges complete
- ❌ Periodic aggregation job (or real-time updates)
- ❌ Support for weekly/monthly leaderboards (currently only all_time)
- ❌ Category and difficulty-specific leaderboards

**Implementation Options**:
1. **Real-time updates**: Update leaderboard table on session/challenge completion
2. **Cron job**: Periodic aggregation (daily/weekly/monthly)
3. **On-demand**: Calculate leaderboards when requested (slower but more accurate)

**Files to Modify**:
- `app/api/quiz/practice/[sessionId]/complete/route.ts` - Add leaderboard update
- `app/api/quiz/challenges/[code]/complete/route.ts` - Add leaderboard update (if exists)
- `app/api/quiz/leaderboards/route.ts` - Add support for weekly/monthly periods

**Estimated Effort**: 3-4 hours

---

### 5. **Campaign Section Unlock Logic Fix** (Medium Priority)

**Issue**: Campaign sections use `unlock_requirement` as TEXT, but it should reference another section ID.

**What's Missing**:
- ❌ Database migration to change `unlock_requirement` from TEXT to UUID
- ❌ Update unlock logic to check if previous section is completed/mastered
- ❌ Update API to handle UUID-based unlock requirements

**Files Needed**:
- `supabase/migrations/fix-campaign-unlock-requirement.sql` - Migration file
- `app/api/quiz/campaigns/[id]/sections/route.ts` - Update unlock logic

**Estimated Effort**: 1-2 hours

---

### 6. **Campaign Details Page Enhancement** (Low Priority)

**Issue**: Campaign details page is basic and doesn't show campaign information.

**What's Missing**:
- ❌ Display campaign title and description
- ❌ Show campaign progress (completed sections, total sections)
- ❌ Better UI for section status (locked, unlocked, in progress, completed, mastered)
- ❌ Visual progress indicator

**Files to Modify**:
- `app/games/campaigns/[id]/page.tsx` - Enhance UI and add campaign info

**Estimated Effort**: 1-2 hours

---

### 7. **Database Migration - Time Limit Column** (Already Done ✅)

**Status**: ✅ User has run the migration successfully

**What Was Done**:
- ✅ Added `time_limit` column to `quiz_practice_sessions` table
- ✅ Default value: 60 seconds
- ✅ CHECK constraint: 30, 45, 60, 75, 90 seconds

---

### 8. **Campaign Section Question Assignment UI** (High Priority)

**Issue**: No way to assign questions to campaign sections via UI.

**What's Missing**:
- ❌ UI to select questions for a campaign section
- ❌ Question search and filter in campaign section form
- ❌ Drag-and-drop or multi-select for questions
- ❌ Preview of selected questions

**Files Needed**:
- `components/quiz/QuestionSelector.tsx` - Create question selector component
- Update `components/quiz/CampaignSectionForm.tsx` - Add question selection

**Estimated Effort**: 3-4 hours

---

## 📋 Testing Tasks

### Manual Testing Needed:
- [ ] Test campaign mode end-to-end (create campaign → create section → assign questions → play section → complete section)
- [ ] Test statistics page with real data
- [ ] Test leaderboard updates after completing sessions
- [ ] Test campaign unlock logic
- [ ] Test campaign section gameplay (once implemented)
- [ ] Test campaign management CRUD operations (once implemented)

---

## 🎯 Priority Summary

### High Priority (Must Have):
1. **Campaign Mode Gameplay Page** - Users can't play campaign sections
2. **Campaign Management CRUD** - Admins can't create/manage campaigns
3. **Campaign Section Question Assignment** - No way to assign questions to sections

### Medium Priority (Should Have):
4. **User Statistics API** - Statistics page shows placeholder data
5. **Leaderboard Data Population** - Leaderboards are empty
6. **Campaign Unlock Logic Fix** - Unlock requirements need proper implementation

### Low Priority (Nice to Have):
7. **Campaign Details Page Enhancement** - Better UI/UX

---

## 🔧 Implementation Notes

### Campaign Mode Gameplay
- Can reuse `QuestionDisplay` component from practice mode
- Can reuse timer logic from practice mode
- Need to integrate with campaign section completion API
- Need to track progress and unlock next sections

### Campaign Management
- Follow same patterns as question management
- Use similar form components and validation
- Question assignment can use existing question list component
- Unlock requirements should be dropdown of previous sections

### Statistics Aggregation
- Aggregate from multiple tables (practice sessions, challenges, campaign progress)
- Calculate streaks from practice answers
- Calculate accuracy from all answered questions
- Get global rank from leaderboard table
- Cache statistics for performance (optional)

### Leaderboard Updates
- Update on session completion (practice and challenge)
- Support for weekly/monthly periods (filter by date range)
- Category and difficulty filtering
- Real-time updates or cron job (recommend real-time for better UX)

---

## 📚 Related Documentation

- `MEDQUEST_ACADEMY_DOCUMENTATION.md` - Full feature documentation
- `SUPABASE_SETUP_INSTRUCTIONS.md` - Database setup instructions
- `GAMES_SETUP_COMPLETE.md` - Setup completion checklist

---

## 🚀 Next Steps

1. **Start with Campaign Mode Gameplay Page** (High Priority)
   - Create gameplay page for campaign sections
   - Reuse existing question display components
   - Integrate with completion API

2. **Implement Campaign Management CRUD** (High Priority)
   - Create API endpoints for campaigns and sections
   - Build UI for campaign management
   - Add question assignment functionality

3. **Implement User Statistics API** (Medium Priority)
   - Create statistics aggregation endpoint
   - Update statistics page to use real data

4. **Implement Leaderboard Updates** (Medium Priority)
   - Add leaderboard update logic to session completion
   - Support for weekly/monthly periods

---

**Last Updated**: Based on current codebase analysis
**Status**: Ready for implementation

