-- Simple Supabase SQL Script to Check Feedback Forms
-- This version works even if anonymous_enabled column doesn't exist yet
-- Run this in your Supabase SQL Editor

-- 1. Check all feedback forms (basic info only)
SELECT 
    id,
    form_name,
    form_template,
    active,
    created_at,
    event_id,
    created_by
FROM feedback_forms
ORDER BY created_at DESC;

-- 2. Check feedback forms with event details
SELECT 
    ff.id,
    ff.form_name,
    ff.form_template,
    ff.active,
    ff.created_at,
    e.title as event_title,
    e.date as event_date,
    e.status as event_status,
    u.name as created_by_name,
    u.email as created_by_email
FROM feedback_forms ff
LEFT JOIN events e ON ff.event_id = e.id
LEFT JOIN users u ON ff.created_by = u.id
ORDER BY ff.created_at DESC;

-- 3. Count feedback forms by template
SELECT 
    form_template,
    COUNT(*) as form_count,
    COUNT(CASE WHEN active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN active = false THEN 1 END) as inactive_count
FROM feedback_forms
GROUP BY form_template
ORDER BY form_count DESC;

-- 4. Check feedback forms with response counts
SELECT 
    ff.id,
    ff.form_name,
    ff.form_template,
    ff.active,
    ff.created_at,
    e.title as event_title,
    COUNT(fr.id) as response_count
FROM feedback_forms ff
LEFT JOIN events e ON ff.event_id = e.id
LEFT JOIN feedback_responses fr ON ff.id = fr.feedback_form_id
GROUP BY ff.id, ff.form_name, ff.form_template, ff.active, ff.created_at, e.title
ORDER BY ff.created_at DESC;

-- 5. Check for orphaned feedback forms (forms without events)
SELECT 
    ff.id,
    ff.form_name,
    ff.form_template,
    ff.created_at,
    ff.event_id
FROM feedback_forms ff
LEFT JOIN events e ON ff.event_id = e.id
WHERE e.id IS NULL;

-- 6. Check feedback responses
SELECT 
    fr.id,
    fr.feedback_form_id,
    ff.form_name,
    u.name as respondent_name,
    u.email as respondent_email,
    fr.responses,
    fr.completed_at,
    fr.created_at
FROM feedback_responses fr
LEFT JOIN feedback_forms ff ON fr.feedback_form_id = ff.id
LEFT JOIN users u ON fr.user_id = u.id
ORDER BY fr.created_at DESC;

-- 7. Summary statistics
SELECT 
    'Total Feedback Forms' as metric,
    COUNT(*) as count
FROM feedback_forms
UNION ALL
SELECT 
    'Active Feedback Forms' as metric,
    COUNT(*) as count
FROM feedback_forms
WHERE active = true
UNION ALL
SELECT 
    'Inactive Feedback Forms' as metric,
    COUNT(*) as count
FROM feedback_forms
WHERE active = false
UNION ALL
SELECT 
    'Total Feedback Responses' as metric,
    COUNT(*) as count
FROM feedback_responses
UNION ALL
SELECT 
    'Completed Responses' as metric,
    COUNT(*) as count
FROM feedback_responses
WHERE completed_at IS NOT NULL;

-- 8. Check for feedback forms with no responses
SELECT 
    ff.id,
    ff.form_name,
    ff.form_template,
    ff.created_at,
    e.title as event_title
FROM feedback_forms ff
LEFT JOIN events e ON ff.event_id = e.id
LEFT JOIN feedback_responses fr ON ff.id = fr.feedback_form_id
WHERE fr.id IS NULL
ORDER BY ff.created_at DESC;
