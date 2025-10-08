-- Insert sample public announcements about new features
-- These will be visible on the public announcements page

INSERT INTO announcements (
  id,
  title,
  content,
  author_id,
  target_audience,
  priority,
  is_active,
  expires_at,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '🎉 Enhanced Search Experience with Advanced Filters',
  'We''ve completely revamped the search functionality! Now you can:

• Filter results by type (Stations, Resources, Events)
• Download resources directly from search results with a single click
• Get instant download notifications
• Improved mobile scrolling experience
• Better search result descriptions

The search is now faster, more intuitive, and works seamlessly across all devices. Try searching for any content and use the new filter buttons to narrow down your results!',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all"}',
  'high',
  true,
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  '📢 New Announcements System - Stay Connected!',
  'Introducing our brand new announcements system that keeps you informed about important updates:

• Personalized announcements based on your profile and role
• Priority-based notification system (Low, Normal, High, Urgent)
• Smart expiration dates to keep content relevant
• Easy dismissal and management of notifications
• Role-specific targeting (Students, Educators, Admins)

Educators and Admins can now create targeted announcements to communicate with specific audiences. Check your dashboard to see the new announcements widget!',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all"}',
  'normal',
  true,
  NOW() + INTERVAL '30 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  '🎯 Improved Event Management and Navigation',
  'We''ve made significant improvements to how events work:

• Individual event pages with detailed information
• Direct navigation from search results to specific events
• Enhanced calendar integration
• Better event filtering and organization
• Improved mobile experience for event browsing

Events now have their own dedicated pages with comprehensive details, making it easier to find and attend the sessions that matter most to your learning journey.',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all"}',
  'normal',
  true,
  NOW() + INTERVAL '45 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  '🚀 Performance Improvements and Bug Fixes',
  'Our latest update brings several performance enhancements and bug fixes:

• Faster page loading times across the platform
• Improved search responsiveness
• Fixed timezone issues with date selection
• Enhanced mobile compatibility
• Better error handling and user feedback

These improvements ensure a smoother, more reliable experience for all users. We''re committed to continuously improving Bleepy based on your feedback!',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all"}',
  'low',
  true,
  NOW() + INTERVAL '60 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  gen_random_uuid(),
  '📱 Mobile-First Design Updates',
  'We''ve enhanced the mobile experience across Bleepy:

• Improved touch interactions and gestures
• Better responsive design for all screen sizes
• Enhanced scrolling performance on mobile devices
• Optimized navigation for smaller screens
• Faster loading on mobile networks

Whether you''re using Bleepy on your phone, tablet, or desktop, you''ll notice a more polished and intuitive experience.',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all"}',
  'normal',
  true,
  NOW() + INTERVAL '90 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
),
(
  gen_random_uuid(),
  '🔒 Enhanced Security and Privacy Features',
  'We''ve strengthened security across the platform:

• Improved authentication and session management
• Enhanced data protection and privacy controls
• Better permission management for educators and admins
• Secure file upload and download processes
• Regular security audits and updates

Your data security and privacy remain our top priority. These updates ensure that Bleepy continues to be a safe and secure platform for all users.',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all"}',
  'normal',
  true,
  NOW() + INTERVAL '120 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- Verify the announcements were created
SELECT 
  title,
  priority,
  is_active,
  expires_at,
  created_at,
  target_audience
FROM announcements 
WHERE target_audience->>'type' = 'all'
ORDER BY created_at DESC;
