# Google reCAPTCHA v3 Setup Guide

This guide explains how to set up Google reCAPTCHA v3 for the contact form to prevent spam.

## 1. Create reCAPTCHA v3 Site

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to create a new site
3. Fill in the form:
   - **Label**: Bleepy Contact Form
   - **reCAPTCHA type**: Select "reCAPTCHA v3"
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - `yourdomain.com` (for production)
     - `*.vercel.app` (for Vercel deployments)
   - Accept the Terms of Service
4. Click "Submit"

## 2. Get Your Keys

After creating the site, you'll get two keys:
- **Site Key** (public): Used in the frontend
- **Secret Key** (private): Used in the backend

## 3. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

## 4. How It Works

### Frontend (Contact Form)
- The contact form automatically loads the reCAPTCHA v3 script
- When the form is submitted, it generates a token using `grecaptcha.execute()`
- The token is sent along with the form data to the backend

### Backend (API Route)
- The API receives the reCAPTCHA token
- It sends the token to Google's verification endpoint
- Google returns a score between 0.0 (bot) and 1.0 (human)
- We accept scores above 0.5 as valid submissions

## 5. Development vs Production

### Development
- If reCAPTCHA keys are not configured, the form will still work
- A warning will be logged but the submission will proceed
- This allows development without requiring reCAPTCHA setup

### Production
- Always configure reCAPTCHA keys for production
- The system will reject submissions with invalid or missing tokens
- This provides spam protection for live contact forms

## 6. Testing

### Test the Contact Form
1. Go to `/contact`
2. Fill out and submit the form
3. Check the browser console for reCAPTCHA loading messages
4. Verify the message appears in the admin panel at `/admin/contact-messages`

### Test Admin Panel
1. Log in as an admin user
2. Go to `/admin/contact-messages`
3. Verify you can see submitted contact messages
4. Test updating message status and adding admin notes

## 7. Troubleshooting

### Common Issues

1. **reCAPTCHA not loading**
   - Check that `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set correctly
   - Verify the domain is added to your reCAPTCHA site settings
   - Check browser console for JavaScript errors

2. **Form submissions failing**
   - Check that `RECAPTCHA_SECRET_KEY` is set correctly
   - Verify the secret key matches your site key
   - Check server logs for reCAPTCHA verification errors

3. **Admin panel access denied**
   - Ensure the user has admin role in the database
   - Check that the admin API routes are properly configured
   - Verify authentication is working correctly

### Debug Mode

To enable debug logging, add this to your `.env.local`:

```bash
DEBUG_RECAPTCHA=true
```

This will log additional information about reCAPTCHA verification in the server console.

## 8. Security Notes

- Never expose your secret key in client-side code
- Keep your secret key secure and rotate it periodically
- Monitor reCAPTCHA scores and adjust thresholds if needed
- Consider implementing rate limiting for additional protection

## 9. Customization

### Adjusting Score Threshold
The default threshold is 0.5. To change it, modify the API route:

```typescript
// In app/api/contact/route.ts
return data.success && data.score >= 0.3 // Lower threshold
```

### Custom Error Messages
You can customize the error messages shown to users by modifying the contact form component.

## 10. Monitoring

- Monitor reCAPTCHA scores in your application logs
- Track form submission rates and success rates
- Set up alerts for unusual patterns (high bot activity, etc.)
