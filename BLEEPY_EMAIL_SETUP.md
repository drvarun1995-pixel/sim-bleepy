# 📧 Bleepy Email Setup - support@bleepy.co.uk

## Your Email Configuration

**Email**: `support@bleepy.co.uk`  
**Domain**: `bleepy.co.uk`  
**Provider**: Outlook/Office 365

## Step 1: Create App Password

1. **Go to Microsoft Account Security**
   - Visit: https://account.microsoft.com/security
   - Sign in with: `support@bleepy.co.uk`

2. **Enable Two-Factor Authentication**
   - Click **"Security"** in the left menu
   - Find **"Two-step verification"**
   - Click **"Turn on"** and follow setup
   - Verify with phone number or authenticator app

3. **Create App Password**
   - Go to: https://account.microsoft.com/security/app-passwords
   - Click **"Create a new app password"**
   - Name it: `Bleepy Simulator SMTP`
   - Click **"Next"**
   - **Copy the 16-character password immediately!**

## Step 2: Environment Variables

Add to your `.env.local` file:

```bash
# SMTP Configuration for Bleepy
SMTP_USER=support@bleepy.co.uk
SMTP_PASSWORD=YOUR_APP_PASSWORD_HERE

# Remove these (no longer needed)
# RESEND_API_KEY=...
```

## Step 3: Test Your Setup

Run the test script:
```bash
node test-smtp.js
```

## Expected Output

When working correctly, you should see:
```
Testing SMTP connection...
SMTP_USER: support@bleepy.co.uk
SMTP_PASSWORD: ***hidden***
✅ SMTP connection successful!
✅ Test email sent successfully!
Message ID: <message-id>
Check your inbox for the test email.
```

## Professional Email Setup

Your emails will now be sent from:
- **From**: `"Bleepy Simulator" <support@bleepy.co.uk>`
- **Reply-To**: `support@bleepy.co.uk`
- **Domain**: `bleepy.co.uk`

## Troubleshooting

### If App Passwords Not Available:
- Make sure 2FA is enabled first
- Try: https://account.microsoft.com/security/app-passwords
- Wait a few minutes after enabling 2FA

### If Authentication Fails:
- Double-check the app password (exact copy, no spaces)
- Verify 2FA is actually enabled
- Try generating a new app password

### If Connection Fails:
- Check firewall settings
- Verify port 587 is not blocked
- Try different network if on corporate WiFi

## Production Benefits

✅ **Professional appearance** - Emails from your domain  
✅ **Brand consistency** - All emails from bleepy.co.uk  
✅ **Trust factor** - Users recognize your domain  
✅ **No third-party costs** - Use your own email infrastructure  
✅ **Full control** - You manage email delivery  

## Next Steps

1. ✅ Create app password for support@bleepy.co.uk
2. ✅ Add to `.env.local`
3. ✅ Test with `node test-smtp.js`
4. ✅ Deploy to production
5. ✅ Monitor email delivery

Your verification emails will now come from your professional Bleepy domain! 🎯
