-- Test if the consent audit logging is working
-- Run this in Supabase SQL Editor to check if audit logs are being created

-- Check if the consent_audit_log table exists and has data
SELECT 
    'consent_audit_log table check' as test_name,
    COUNT(*) as total_records,
    MIN(timestamp) as earliest_record,
    MAX(timestamp) as latest_record
FROM consent_audit_log;

-- Check recent audit logs
SELECT 
    id,
    action,
    new_values,
    timestamp,
    ip_address
FROM consent_audit_log 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_log_consent_change';

-- Check recent user consent changes
SELECT 
    id,
    email,
    marketing_consent,
    analytics_consent,
    consent_timestamp,
    consent_version,
    updated_at
FROM users 
WHERE email = 'drvarun1995@gmail.com'
ORDER BY updated_at DESC 
LIMIT 5;
