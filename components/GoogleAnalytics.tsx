'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID, isGAEnabled } from '@/lib/gtag';

export function GoogleAnalytics() {
  if (!isGAEnabled) {
    return null;
  }

  // Emails to exclude from Google Analytics tracking
  const excludedEmails = [
    'drvarun1995@gmail.com',
    'varun.tyagi@nhs.net',
    // Add any additional emails from environment variables
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [])
  ];

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Check if current user should be excluded from tracking
            function shouldExcludeFromTracking() {
              const excludedEmails = ${JSON.stringify(excludedEmails)};
              
              // Check localStorage for user email (set during login)
              const userEmail = localStorage.getItem('userEmail');
              if (userEmail && excludedEmails.includes(userEmail)) {
                console.log('User excluded from GA tracking:', userEmail);
                return true;
              }
              
              // Check sessionStorage for user email
              const sessionEmail = sessionStorage.getItem('userEmail');
              if (sessionEmail && excludedEmails.includes(sessionEmail)) {
                console.log('User excluded from GA tracking:', sessionEmail);
                return true;
              }
              
              // Check if any excluded email appears in the current URL
              const currentUrl = window.location.href;
              if (excludedEmails.some(email => currentUrl.includes(email))) {
                console.log('User excluded from GA tracking via URL:', currentUrl);
                return true;
              }
              
                    // Check if user has given consent at all
                    const cookieConsentGiven = localStorage.getItem('cookie-consent-given');
                    if (!cookieConsentGiven) {
                      console.log('User excluded from GA tracking: no consent given');
                      return true;
                    }
                    
                    // Check analytics preference
                    const cookiePreferences = localStorage.getItem('cookie-preferences');
                    if (cookiePreferences) {
                      try {
                        const preferences = JSON.parse(cookiePreferences);
                        if (preferences.analytics === false) {
                          console.log('User excluded from GA tracking: analytics disabled');
                          return true;
                        }
                      } catch (e) {
                        console.log('User excluded from GA tracking: invalid preferences data');
                        return true;
                      }
                    } else {
                      console.log('User excluded from GA tracking: no preferences found');
                      return true;
                    }
              
              return false;
            }
            
            // Disable tracking if user should be excluded
            if (shouldExcludeFromTracking()) {
              console.log('Google Analytics tracking disabled - user excluded or no consent');
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: false,
                custom_map: {
                  'custom_parameter_1': 'excluded_user'
                }
              });
              
              // Override gtag to prevent any tracking
              window.gtag = function() {
                console.log('Analytics tracking blocked - no consent or excluded user');
              };
            } else {
              console.log('Google Analytics tracking enabled');
              
              // Get specific page title based on pathname
              function getPageTitle(pathname) {
                const pageTitles = {
                  '/': 'Home',
                  '/dashboard': 'Dashboard',
                  '/analytics': 'Analytics Dashboard',
                  '/admin-dashboard': 'Admin Dashboard',
                  '/admin-file-requests': 'File Requests',
                  '/admin-teaching-requests': 'Teaching Requests',
                  '/auth/signin': 'Sign In',
                  '/auth/signup': 'Sign Up',
                  '/profile': 'User Profile',
                  '/events': 'Events',
                  '/resources': 'Resources',
                  '/tutorials': 'Tutorials',
                  '/getting-started': 'Getting Started',
                  '/simulator-analytics': 'Simulator Analytics',
                  '/data-retention': 'Data Retention',
                  '/cookies': 'Cookie Policy',
                  '/terms': 'Terms of Service'
                };
                
                return pageTitles[pathname] || document.title;
              }
              
              const specificPageTitle = getPageTitle(window.location.pathname);
              
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                page_title: specificPageTitle,
                page_location: window.location.href,
                send_page_view: true,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure',
                cookie_domain: 'auto',
                cookie_expires: 63072000,
                custom_map: {
                  'custom_parameter_1': 'page_title',
                  'custom_parameter_2': 'user_type'
                }
              });
              
              // Send initial page view with enhanced data
              gtag('event', 'page_view', {
                page_title: specificPageTitle,
                page_location: window.location.href,
                page_path: window.location.pathname,
                user_type: 'authenticated_user'
              });
            }
          `,
        }}
      />
    </>
  );
}
