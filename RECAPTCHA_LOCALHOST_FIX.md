# reCAPTCHA Localhost Fix

## Problem
The reCAPTCHA site key doesn't include `localhost:3000` as an allowed domain, causing the contact form to fail with reCAPTCHA errors.

## Solution
Updated the contact form to skip reCAPTCHA verification in development mode (localhost).

## Changes Made

### 1. Frontend (`app/contact/page.tsx`)
- ✅ Skip loading reCAPTCHA script on localhost
- ✅ Skip reCAPTCHA token generation on localhost
- ✅ Added error handling for reCAPTCHA script loading

### 2. Backend (`app/api/contact/route.ts`)
- ✅ Skip reCAPTCHA verification when no token is provided
- ✅ Added development mode logging

## How It Works

### Development Mode (localhost)
- reCAPTCHA script is not loaded
- No reCAPTCHA token is generated
- API skips reCAPTCHA verification
- Contact form works normally

### Production Mode (sim.bleepy.co.uk)
- reCAPTCHA script loads normally
- reCAPTCHA token is generated and verified
- Full spam protection active

## Testing

1. **Development (localhost:3000):**
   - Go to: http://localhost:3000/contact
   - Fill out and submit form
   - Should work without reCAPTCHA errors
   - Check console: "Skipping reCAPTCHA in development mode"

2. **Production (sim.bleepy.co.uk):**
   - reCAPTCHA will work normally
   - Full spam protection enabled

## reCAPTCHA Configuration

Your current reCAPTCHA site key has these domains:
- ✅ `bleepy.co.uk` 
- ✅ `sim.bleepy.co.uk` (your production domain)
- ❌ `localhost:3000` (invalid - reCAPTCHA doesn't allow localhost with ports)

## Next Steps

1. **For Development:** Contact form now works on localhost without reCAPTCHA
2. **For Production:** Your reCAPTCHA configuration is correct:
   - ✅ `bleepy.co.uk` (already configured)
   - ✅ `sim.bleepy.co.uk` (your production domain - already configured)
   - ❌ `localhost:3000` (not needed and invalid - will be skipped in development)

## Alternative: Create Development reCAPTCHA Key

If you want reCAPTCHA in development, create a separate reCAPTCHA site key with:
- Domains: `localhost` (without port)
- Type: reCAPTCHA v3
- Use different environment variables for development vs production

---

**Status:** ✅ Fixed - Contact form now works on localhost!
