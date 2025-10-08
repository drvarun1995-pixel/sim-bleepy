# Google Analytics Quick Start Guide

## ⚡ Quick Setup (5 Minutes)

### 1. Get Your Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing)
3. Set up a Web data stream
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add to Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX` (your actual ID)
   - **Environments**: Check all (Production, Preview, Development)
3. Click **Save**

### 3. Deploy

```bash
git add .
git commit -m "Add Google Analytics setup"
git push origin main
vercel --prod
```

### 4. Verify

- Visit your website
- Go to Google Analytics → **Reports** → **Realtime**
- You should see your visit within 30 seconds

## ✅ That's It!

Your Google Analytics is now live and tracking:
- ✅ Page views
- ✅ User interactions
- ✅ Custom events (sign ups, station completions, downloads, etc.)
- ✅ Search queries
- ✅ Newsletter subscriptions

## 📖 Full Documentation

For detailed setup instructions, troubleshooting, and advanced features, see:
- **[GOOGLE_ANALYTICS_SETUP.md](./GOOGLE_ANALYTICS_SETUP.md)** - Complete setup guide

## 🎯 What's Being Tracked

### Automatic
- Page views
- Scrolls
- Outbound clicks
- File downloads
- Video engagement

### Custom Events
- User sign up/login/logout
- Station starts and completions (with scores)
- Resource downloads
- Event registrations
- Newsletter subscriptions
- Search queries
- Dashboard views
- Profile completions

## 🔧 Need to Track More?

Add custom tracking anywhere in your code:

```typescript
import { trackEvent } from '@/lib/gtag';

// Example: Track a button click
trackEvent.downloadResource('Study Guide.pdf');

// Example: Track station completion
trackEvent.completeStation('Cardiology OSCE', 92);
```

## 🐛 Not Working?

1. Check environment variable is set in Vercel
2. Verify Measurement ID starts with `G-` (not `UA-`)
3. Redeploy after adding the variable
4. Wait 30 seconds and check Realtime reports
5. Disable ad blockers for testing

---

**Questions?** See the full [GOOGLE_ANALYTICS_SETUP.md](./GOOGLE_ANALYTICS_SETUP.md) guide.
