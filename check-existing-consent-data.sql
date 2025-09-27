-- Check consent data for existing users
SELECT 
    email,
    name,
    consent_given,
    consent_timestamp,
    consent_version,
    marketing_consent,
    analytics_consent,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;
