# Supabase Setup Instructions for MedQuest Academy

This document provides step-by-step instructions for setting up the MedQuest Academy quiz game feature in Supabase.

## Prerequisites

- Access to your Supabase project dashboard
- Admin access to run SQL queries
- Basic understanding of Supabase dashboard

---

## Step 1: Run Database Migration

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run the Migration Script**
   - Open the file: `supabase/migrations/create-quiz-system.sql`
   - Copy the entire contents of the file
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should see the following tables:
     - `quiz_questions`
     - `quiz_challenges`
     - `quiz_challenge_participants`
     - `quiz_challenge_answers`
     - `quiz_practice_sessions`
     - `quiz_practice_answers`
     - `quiz_campaigns`
     - `quiz_campaign_sections`
     - `quiz_user_progress`
     - `quiz_leaderboards`
     - `quiz_categories`

4. **Verify RLS Policies**
   - Go to "Authentication" → "Policies" in the left sidebar
   - Verify that Row Level Security (RLS) is enabled for all quiz tables
   - All tables should have policies allowing service_role full access

---

## Step 2: Set Up Storage Buckets

### 2a. Create Storage Bucket for Question Images

1. **Create Storage Bucket**
   - Go to "Storage" in the left sidebar
   - Click "New bucket"
   - Bucket name: `quiz-images`
   - Make it **Public** (uncheck "Private bucket")
   - Click "Create bucket"

2. **Set Up Bucket Policies for quiz-images**
   - Click on the `quiz-images` bucket
   - Go to "Policies" tab
   - Click "New policy"
   - Select "For full customization"
   - Policy name: `Allow public read access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Policy definition:
     ```sql
     (bucket_id = 'quiz-images')
     ```
   - Click "Review" then "Save policy"

   - Create another policy for uploads (admin only):
     - Policy name: `Allow authenticated uploads`
     - Allowed operation: `INSERT`
     - Target roles: `authenticated`
     - Policy definition:
       ```sql
       (bucket_id = 'quiz-images' AND auth.role() = 'authenticated')
       ```

### 2b. Create Storage Bucket for Challenge QR Codes

1. **Create Storage Bucket**
   - Go to "Storage" in the left sidebar
   - Click "New bucket"
   - Bucket name: `challenge-qr-codes`
   - Make it **Public** (uncheck "Private bucket")
   - Click "Create bucket"

2. **Set Up Bucket Policies for challenge-qr-codes**
   - Click on the `challenge-qr-codes` bucket
   - Go to "Policies" tab
   - Click "New policy"
   - Select "For full customization"
   - Policy name: `Allow public read access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Policy definition:
     ```sql
     (bucket_id = 'challenge-qr-codes')
     ```
   - Click "Review" then "Save policy"

   - Create another policy for uploads (authenticated users):
     - Policy name: `Allow authenticated uploads`
     - Allowed operation: `INSERT`
     - Target roles: `authenticated`
     - Policy definition:
       ```sql
       (bucket_id = 'challenge-qr-codes' AND auth.role() = 'authenticated')
       ```

---

## Step 3: Enable Realtime for Challenge Mode

1. **Enable Realtime Publication**
   - Go to "Database" → "Replication" in the left sidebar
   - Find the following tables:
     - `quiz_challenges`
     - `quiz_challenge_participants`
   - Toggle the switch to enable replication for each table

   **OR** run this SQL in the SQL Editor:

   ```sql
   -- Enable realtime for challenge tables
   ALTER PUBLICATION supabase_realtime ADD TABLE quiz_challenges;
   ALTER PUBLICATION supabase_realtime ADD TABLE quiz_challenge_participants;
   ```

2. **Verify Realtime is Enabled**
   - Go to "Database" → "Replication"
   - Both tables should show as enabled (green toggle)

---

## Step 4: Create Categories

**Important**: Categories are now stored in the database. You must create them manually via the UI.

1. **Navigate to Game Categories Page**
   - Go to `/games-organiser/game-categories` in your application
   - You should see an empty page (or categories if you've already created some)

2. **Create Categories**
   - Click "Add New Category"
   - Enter the category name (e.g., "Cardiology", "Anatomy", etc.)
   - Click "Add"
   - Repeat for all categories you want to create

3. **Manage Categories**
   - You can edit or delete categories from this page
   - Only delete categories that aren't used in any questions
   - Categories can be marked as active/inactive

**Note**: The system no longer uses seeded categories. All categories must be created through the UI.

---

## Step 5: Verify Setup

1. **Test Database Connection**
   - Go to your application
   - Navigate to `/games-organiser/game-categories`
   - You should see the categories page load (may be empty if you didn't run Option B)

2. **Test Analytics Endpoint**
   - Navigate to `/games-organiser/game-analytics`
   - You should see analytics stats (all zeros initially, which is expected)

3. **Test Question Creation**
   - Navigate to `/games-organiser/create-question`
   - Try creating a test question
   - Verify it appears in `/games-organiser/questions`

---

## Step 6: Create Categories and Your First Question

1. **Create Categories First** (Required)
   - Navigate to `/games-organiser/game-categories`
   - Create at least one category (e.g., "Cardiology", "Anatomy")
   - Categories are required before you can create questions

2. **Create Your First Question**
   - Go to `/games-organiser/create-question`
   - Fill in the question details:
     - Scenario text (optional, supports rich text)
     - Question text
     - Options A-E
     - Correct answer (select the radio button next to the correct option)
     - Explanation (supports rich text, explains why the correct answer is correct)
     - Category (select from the categories you created)
     - Difficulty (easy/medium/hard)
     - Status: **Published** (important - set to "published" to make it available)

3. **Verify Question Appears**
   - Go to `/games-organiser/questions`
   - Your question should appear in the list
   - Only "published" questions will be available for practice/challenge modes

---

## Step 7: Test the Game Modes

1. **Test Practice Mode**
   - Go to `/games/practice`
   - Select a category and difficulty
   - Start a practice session
   - Answer questions and verify results

2. **Test Challenge Mode**
   - Go to `/games/challenge`
   - Create a challenge (you'll need at least 2 browser windows/tabs)
   - Join the challenge from another window
   - Start the challenge and verify real-time updates

3. **Test Leaderboards**
   - Complete a few practice sessions
   - Go to `/games/leaderboards`
   - Verify your scores appear

---

## Troubleshooting

### Issue: Tables not created
**Solution**: Check the SQL Editor for error messages. Make sure you have the necessary permissions to create tables.

### Issue: RLS policies blocking queries
**Solution**: Verify that all tables have the "Service role full access" policy. The API uses `supabaseAdmin` which uses the service role.

### Issue: Categories not loading
**Solution**: 
- Check browser console for errors
- Verify the `quiz_categories` table exists
- Check that RLS policies allow reading categories
- Try inserting a category manually via SQL to test

### Issue: Images not uploading
**Solution**:
- Verify the `quiz-images` storage bucket exists
- Check that bucket policies allow uploads for authenticated users
- Verify the bucket is public for reading

### Issue: Realtime not working in challenge mode
**Solution**:
- Verify realtime is enabled for `quiz_challenges` and `quiz_challenge_participants`
- Check that the tables are added to the `supabase_realtime` publication
- Verify your Supabase project has realtime enabled (check project settings)

### Issue: Analytics showing zeros
**Solution**: This is normal if you haven't created any questions or completed any sessions yet. Create some questions, set them to "published", and complete a practice session to see data.

---

## Next Steps

1. **Create Categories**
   - Go to `/games-organiser/game-categories`
   - Create all the categories you need
   - Categories are required before creating questions

2. **Create More Questions**
   - Use the bulk upload feature at `/games-organiser/questions-bulk-upload`
   - Or create questions individually at `/games-organiser/create-question`

2. **Create Campaigns** (Optional)
   - Navigate to `/games-organiser/game-campaigns`
   - Create campaigns with sections
   - Assign questions to campaign sections

3. **Monitor Analytics**
   - Check `/games-organiser/game-analytics` regularly
   - Track user engagement and performance

4. **Manage Categories**
   - Add/edit/delete categories at `/games-organiser/game-categories`
   - Only delete categories that aren't used in any questions

---

## Important Notes

- **Question Status**: Questions must be set to "published" to be available for practice/challenge modes
- **Admin Access**: Only users with `role = 'admin'` in the `users` table can access admin features
- **Storage**: Question images are stored in the `quiz-images` bucket. Make sure it's set up correctly.
- **Realtime**: Challenge mode requires realtime to be enabled. Make sure it's set up in Step 3.

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify all steps above were completed
4. Check that your user has admin role in the database

---

## Migration File Location

The migration file is located at:
```
supabase/migrations/create-quiz-system.sql
```

Make sure to run this file in the Supabase SQL Editor before using the quiz game features.

