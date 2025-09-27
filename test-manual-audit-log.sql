-- Manual test to insert an audit log entry
-- This will help us verify if the audit log table and API are working

INSERT INTO consent_audit_log (
    user_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent,
    timestamp
) VALUES (
    (SELECT id FROM users WHERE email = 'drvarun1995@gmail.com'),
    'manual_test_entry',
    '{"test": "old_value"}',
    '{"test": "new_value"}',
    '127.0.0.1',
    'Test Browser',
    NOW()
);

-- Check if it was inserted
SELECT 
    id,
    action,
    new_values,
    timestamp
FROM consent_audit_log 
WHERE action = 'manual_test_entry'
ORDER BY timestamp DESC 
LIMIT 1;
