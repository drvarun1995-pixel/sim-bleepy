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
    'varun.tyagi@nhs.net'
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
                return true;
              }
              
              // Check sessionStorage for user email
              const sessionEmail = sessionStorage.getItem('userEmail');
              if (sessionEmail && excludedEmails.includes(sessionEmail)) {
                return true;
              }
              
              // Check if any excluded email appears in the current URL
              const currentUrl = window.location.href;
              return excludedEmails.some(email => currentUrl.includes(email));
            }
            
            // Disable tracking if user should be excluded
            if (shouldExcludeFromTracking()) {
              console.log('Google Analytics tracking disabled for excluded user');
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: false,
                custom_map: {
                  'custom_parameter_1': 'excluded_user'
                }
              });
              
              // Override gtag to prevent any tracking
              window.gtag = function() {
                console.log('Analytics tracking blocked for excluded user');
              };
            } else {
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                send_page_view: true,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure',
                cookie_domain: 'sim.bleepy.co.uk',
                cookie_expires: 63072000
              });
            }
          `,
        }}
      />
    </>
  );
}
