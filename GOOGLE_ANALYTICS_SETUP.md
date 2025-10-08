# Google Analytics Setup Guide for Bleepy Simulator

This guide will walk you through setting up Google Analytics 4 (GA4) for your Bleepy Simulator application.

## 📋 Prerequisites

- A Google account
- Access to [Google Analytics](https://analytics.google.com/)
- Admin access to your Bleepy Simulator deployment

## 🚀 Step-by-Step Setup

### 1. Create a Google Analytics 4 Property

1. **Go to Google Analytics**
   - Visit [https://analytics.google.com/](https://analytics.google.com/)
   - Sign in with your Google account

2. **Create a New Property**
   - Click **Admin** (gear icon) in the bottom left
   - Under the **Property** column, click **Create Property**
   - Enter property details:
     - **Property name**: `Bleepy Simulator` (or your preferred name)
     - **Reporting time zone**: Select your timezone (e.g., `United Kingdom`)
     - **Currency**: Select `GBP - British Pound Sterling`
   - Click **Next**

3. **Configure Business Information**
   - **Industry category**: Select `Health & Fitness` or `Education`
   - **Business size**: Select appropriate size
   - **How you plan to use Google Analytics**: Check relevant options
   - Click **Create**
   - Accept the Terms of Service

### 2. Set Up Data Stream

1. **Create a Web Data Stream**
   - After creating the property, you'll be prompted to set up a data stream
   - Click **Web**
   - Enter your website details:
     - **Website URL**: `https://your-domain.com` (your production URL)
     - **Stream name**: `Bleepy Simulator - Production`
     - **Enhanced measurement**: Leave ON (recommended)
   - Click **Create stream**

2. **Get Your Measurement ID**
   - After creating the stream, you'll see your **Measurement ID**
   - It will look like: `G-XXXXXXXXXX`
   - **Copy this ID** - you'll need it for the next step

### 3. Configure Environment Variables

1. **Add to Your Environment File**
   
   For **local development**, create/edit `.env.local`:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. **Add to Vercel (Production)**
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
     - **Value**: `G-XXXXXXXXXX` (your Measurement ID)
     - **Environment**: Select `Production`, `Preview`, and `Development`
   - Click **Save**

3. **Redeploy Your Application**
   - After adding the environment variable, redeploy your app:
   ```bash
   vercel --prod
   ```
   - Or push to your git repository to trigger automatic deployment

### 4. Verify Installation

1. **Test in Real-Time**
   - Go to Google Analytics
   - Navigate to **Reports** → **Realtime**
   - Visit your website
   - You should see your visit appear in real-time (may take 10-30 seconds)

2. **Check Browser Console**
   - Open your website
   - Open browser DevTools (F12)
   - Go to **Network** tab
   - Filter by `google-analytics.com` or `gtag`
   - You should see requests being sent

3. **Use Google Analytics Debugger**
   - Install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
   - Enable it and reload your page
   - Check the console for GA debug messages

## 📊 What's Being Tracked

### Automatic Tracking (Enhanced Measurement)

With enhanced measurement enabled, GA4 automatically tracks:

- ✅ **Page views** - Every page navigation
- ✅ **Scrolls** - When users scroll to bottom of page
- ✅ **Outbound clicks** - Clicks on external links
- ✅ **Site search** - Internal search queries
- ✅ **Video engagement** - YouTube video interactions
- ✅ **File downloads** - PDF, DOC, etc.

### Custom Events (Already Implemented)

The following custom events are tracked in your application:

#### User Actions
- `sign_up` - New user registration
- `login` - User sign in
- `logout` - User sign out
- `complete_profile` - Profile completion

#### Station Interactions
- `start_station` - User starts a clinical station
- `complete_station` - User completes a station (includes score)

#### Resources
- `download` - Resource file downloads

#### Events
- `register_event` - Event registration

#### Newsletter
- `subscribe` - Newsletter subscription (includes source)

#### Search
- `search` - Search queries (includes search term)

#### Dashboard
- `view_dashboard` - Dashboard section views

## 🎯 Using Custom Events in Your Code

You can track custom events anywhere in your application:

```typescript
import { trackEvent } from '@/lib/gtag';

// Track user sign up
trackEvent.signUp();

// Track station completion with score
trackEvent.completeStation('Cardiovascular Examination', 85);

// Track resource download
trackEvent.downloadResource('OSCE Guide.pdf');

// Track newsletter subscription
trackEvent.subscribeNewsletter('homepage');
```

## 🔧 Advanced Configuration

### Custom Dimensions (Optional)

To track additional user properties:

1. Go to **Admin** → **Custom definitions**
2. Click **Create custom dimension**
3. Add dimensions like:
   - User role (student, educator, admin)
   - Subscription tier
   - Institution type

### Goals and Conversions

Set up key conversions:

1. Go to **Admin** → **Events**
2. Mark important events as conversions:
   - `sign_up`
   - `complete_station`
   - `subscribe`

### Audience Segmentation

Create audiences for targeted analysis:

1. Go to **Admin** → **Audiences**
2. Create audiences like:
   - Active students (completed 5+ stations)
   - Newsletter subscribers
   - High performers (average score > 80%)

## 🔒 Privacy & GDPR Compliance

Your GA4 setup includes privacy-friendly configurations:

- ✅ **IP Anonymization**: Enabled by default in GA4
- ✅ **Cookie Consent**: Integrated with your existing CookieConsent component
- ✅ **Data Retention**: Set to 14 months by default (configurable)
- ✅ **User Deletion**: Users can request data deletion

### Configure Data Retention

1. Go to **Admin** → **Data Settings** → **Data Retention**
2. Set retention period (recommended: 14 months)
3. Enable **Reset user data on new activity**

### Configure User Data Deletion

When users request data deletion:

1. Go to **Admin** → **Data deletion requests**
2. Submit deletion request with user identifier
3. Google will process within 72 hours

## 📈 Recommended Reports

### Key Metrics to Monitor

1. **Acquisition Overview**
   - Where users come from
   - Which channels drive most traffic

2. **Engagement Overview**
   - Average engagement time
   - Most popular pages
   - User retention

3. **User Demographics**
   - Geographic distribution
   - Device types
   - Browser usage

4. **Custom Events**
   - Station completion rates
   - Average scores
   - Resource downloads

### Setting Up Custom Reports

1. Go to **Explore** → **Create new exploration**
2. Choose template or start blank
3. Add dimensions and metrics relevant to your needs

## 🐛 Troubleshooting

### GA Not Tracking

**Problem**: No data appearing in Google Analytics

**Solutions**:
1. Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. Check that the ID starts with `G-` (not `UA-`)
3. Ensure you've redeployed after adding the environment variable
4. Check browser console for errors
5. Verify ad blockers aren't blocking GA scripts

### Events Not Showing

**Problem**: Page views work but custom events don't appear

**Solutions**:
1. Check that events are being called in your code
2. Verify event names match GA4 naming conventions (lowercase, underscores)
3. Wait 24-48 hours for events to appear in standard reports
4. Check **Realtime** reports for immediate feedback

### Duplicate Tracking

**Problem**: Seeing duplicate page views

**Solutions**:
1. Ensure GA script is only included once (in `layout.tsx`)
2. Check for conflicting GA implementations
3. Verify no browser extensions are injecting GA

## 🔄 Migration from Universal Analytics (UA)

If you're migrating from UA (tracking IDs starting with `UA-`):

1. **Create New GA4 Property** (don't delete UA yet)
2. **Run Both in Parallel** for comparison
3. **Update Environment Variable** to use GA4 ID
4. **Verify Data** matches between UA and GA4
5. **Sunset UA** after GA4 is validated

## 📞 Support Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Setup Assistant](https://support.google.com/analytics/answer/9744165)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [GA4 Best Practices](https://support.google.com/analytics/answer/9267744)

## ✅ Post-Setup Checklist

- [ ] GA4 property created
- [ ] Data stream configured
- [ ] Measurement ID added to environment variables
- [ ] Application redeployed
- [ ] Real-time tracking verified
- [ ] Custom events tested
- [ ] Data retention configured
- [ ] Key conversions marked
- [ ] Privacy settings reviewed
- [ ] Team members granted access

## 🎉 You're All Set!

Your Google Analytics is now properly configured and tracking user interactions. Data will start appearing in your reports within 24-48 hours, though real-time data is available immediately.

### Next Steps

1. **Set up alerts** for important metrics
2. **Create custom dashboards** for quick insights
3. **Schedule regular reports** for stakeholders
4. **Monitor conversion funnels** for optimization opportunities

---

**Need Help?** Check the troubleshooting section or contact your development team.
