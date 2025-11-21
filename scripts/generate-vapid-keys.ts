#!/usr/bin/env tsx
/**
 * Generate VAPID keys for Web Push Notifications
 * Run: npm run generate-vapid-keys
 * Then add the output to your .env.local and Vercel environment variables
 */

import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n========================================');
console.log('VAPID Keys Generated');
console.log('========================================\n');
console.log('Add these to your .env.local file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@bleepy.co.uk\n`);
console.log('Also add them to Vercel environment variables for production.\n');
console.log('========================================\n');

