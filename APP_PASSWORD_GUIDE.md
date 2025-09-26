# 🔐 Outlook App Password Setup Guide

## Step-by-Step Instructions

### 1. Enable Two-Factor Authentication

1. **Go to Microsoft Account Security**
   - Visit: https://account.microsoft.com/security
   - Sign in with your Outlook email

2. **Enable 2FA**
   - Click **"Security"** in the left menu
   - Find **"Two-step verification"**
   - Click **"Turn on"** and follow setup
   - Verify with phone number or authenticator app

### 2. Create App Password

1. **Find App Passwords**
   - In Security section, look for **"App passwords"**
   - If you don't see it, try: https://account.microsoft.com/security/app-passwords
   - Or go to: Security → Advanced security options → App passwords

2. **Create New App Password**
   - Click **"Create a new app password"**
   - Name it: `Bleepy Simulator`
   - Click **"Next"**

3. **Copy the Generated Password**
   - Microsoft generates a 16-character password
   - Format: `ABCD-EFGH-IJKL-MNOP`
   - **⚠️ COPY THIS IMMEDIATELY - You can't see it again!**

### 3. Set Environment Variables

Create or update your `.env.local` file:

```bash
# SMTP Configuration for Outlook
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASSWORD=ABCD-EFGH-IJKL-MNOP

# Remove these (no longer needed)
# RESEND_API_KEY=...
```

### 4. Test Your Setup

Run the test script:
```bash
node test-smtp.js
```

## Troubleshooting

### "App passwords" not visible?
- Make sure 2FA is enabled first
- Try the direct link: https://account.microsoft.com/security/app-passwords
- Some accounts might need to wait a few minutes after enabling 2FA

### Authentication still fails?
- Double-check the app password (no spaces, exact copy)
- Make sure 2FA is actually enabled
- Try generating a new app password

### Connection issues?
- Check your internet connection
- Verify firewall isn't blocking port 587
- Try different network if on corporate WiFi

## Alternative: Use Regular Password (Not Recommended)

If you can't get app passwords working:

```bash
# Use your regular Outlook password (less secure)
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASSWORD=your-regular-outlook-password
```

⚠️ **Warning**: This is less secure and may not work with 2FA enabled.

## Next Steps

1. ✅ Enable 2FA on your Outlook account
2. ✅ Create app password
3. ✅ Add to `.env.local`
4. ✅ Test with `node test-smtp.js`
5. ✅ Deploy to production

## Security Notes

- **App passwords are safer** than regular passwords
- **Each app gets its own password** - you can revoke individual ones
- **Store securely** - don't commit to version control
- **Rotate regularly** - create new ones periodically
