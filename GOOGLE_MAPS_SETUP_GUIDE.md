# Google Maps API Setup Guide

This guide will help you set up Google Maps integration for the event pages in your application.

## Step 1: Get a Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Either select an existing project or create a new one
   - Name your project (e.g., "Basildon Hospital Events")

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps JavaScript API** (required for displaying maps)
     - **Geocoding API** (optional, for address lookup)
     - **Directions API** (optional, for route planning)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

## Step 2: Secure Your API Key

**IMPORTANT:** Always restrict your API key to prevent unauthorized usage and unexpected charges.

### For Your Specific Domains (sim.bleepy.co.uk & bleepy.co.uk):

1. **Click on your API key** in the Credentials page
2. **Set Application Restrictions:**
   - Choose "HTTP referrers (web sites)"
   - Add these exact entries (one per line):
     ```
     localhost:3000/*
     https://sim.bleepy.co.uk/*
     https://bleepy.co.uk/*
     https://*.bleepy.co.uk/*
     ```
   - **Important Notes:**
     - Include the `https://` protocol
     - Use `/*` at the end to allow all paths on those domains
     - The `*.bleepy.co.uk/*` entry covers any subdomains
     - `localhost:3000/*` is for your development environment

3. **Set API Restrictions:**
   - Choose "Restrict key"
   - Select only the APIs you need:
     - Maps JavaScript API
     - Geocoding API (if enabled)
     - Directions API (if enabled)

### Visual Guide for Application Restrictions:

When you're in the Google Cloud Console, you'll see a section that looks like this:

**Application restrictions:**
- [ ] None
- [x] HTTP referrers (web sites)
  - Website restrictions:
    ```
    localhost:3000/*
    https://sim.bleepy.co.uk/*
    https://bleepy.co.uk/*
    https://*.bleepy.co.uk/*
    ```

**What each entry does:**
- `localhost:3000/*` → Allows development on your local machine
- `https://sim.bleepy.co.uk/*` → Allows your main application domain
- `https://bleepy.co.uk/*` → Allows your main website domain  
- `https://*.bleepy.co.uk/*` → Allows any subdomain of bleepy.co.uk (future-proofing)

## Step 3: Add API Key to Your Application

1. **Open your `.env.local` file** in the project root
2. **Add the Google Maps API key:**
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

   Replace `your_actual_api_key_here` with the API key you copied from Google Cloud Console.

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Step 4: Test the Integration

1. **Navigate to an event page** in your application
2. **Verify the map loads** correctly
3. **Test the directions feature** by entering an address and clicking "Get Directions"

## Features Included

### ✅ What's Implemented:

1. **Interactive Google Map**
   - Displays the event location with a numbered marker
   - Map controls (zoom, satellite view, street view, fullscreen)
   - Centered on Basildon Hospital coordinates

2. **Directions Integration**
   - Input field for starting address
   - "Get Directions" button that opens Google Maps with directions
   - Opens in a new tab for better user experience

3. **Responsive Design**
   - Works on desktop and mobile devices
   - Proper loading states and error handling

### 🔧 Customization Options:

You can customize the map by modifying the `GoogleMap.tsx` component:

1. **Change default location:**
   ```typescript
   const basildonHospitalCoords = {
     lat: 51.5740,  // Update latitude
     lng: 0.4600    // Update longitude
   };
   ```

2. **Adjust map zoom level:**
   ```typescript
   zoom: 16,  // Change zoom level (1-20)
   ```

3. **Customize map styling:**
   - Add custom map styles
   - Change marker appearance
   - Modify map controls

## Troubleshooting

### Common Issues:

1. **Map not loading:**
   - Check if API key is correctly set in `.env.local`
   - Verify API restrictions allow your domain
   - Ensure Maps JavaScript API is enabled

2. **"For development purposes only" watermark:**
   - This appears when billing is not set up
   - Go to Google Cloud Console > Billing
   - Add a payment method (Google provides free credits)

3. **API key errors:**
   - Check browser console for specific error messages
   - Verify API key restrictions
   - Ensure all required APIs are enabled

### Billing Information:

- Google Maps API has a generous free tier
- First $200 of usage per month is free
- After that, you pay per request
- For typical usage, costs are very low

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables** for all sensitive data
3. **Restrict API keys** by domain and API type
4. **Monitor usage** in Google Cloud Console
5. **Set up billing alerts** to avoid unexpected charges

## Next Steps

Once set up, the Google Map will automatically:
- Display on all event detail pages
- Show the correct location for each event
- Allow users to get directions to the event location
- Work seamlessly with your existing event data

The integration is now complete and ready to use! 🗺️✨
