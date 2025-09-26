# 📧 Exchange Online Setup for support@bleepy.co.uk

## Your Email Configuration

**Email Provider**: Microsoft Exchange Online (Office 365)  
**Domain**: bleepy.co.uk  
**Email**: support@bleepy.co.uk  
**SMTP Server**: smtp.office365.com  

## Step 1: Get Your Exchange Online Password

Since you have Exchange Online, you need to:

1. **Use your regular Exchange Online password** (not app password)
2. **OR create an app password** if 2FA is enabled

### Option A: Regular Password (If 2FA is disabled)
```bash
SMTP_USER=support@bleepy.co.uk
SMTP_PASSWORD=your-exchange-online-password
```

### Option B: App Password (If 2FA is enabled)
1. **Go to**: https://admin.microsoft.com
2. **Sign in** with your admin account
3. **Go to**: Users → Active users → support@bleepy.co.uk
4. **Click "Mail"** → **"Manage app passwords"**
5. **Create new app password**

## Step 2: Environment Variables

Update your `.env.local` file:

```bash
# Exchange Online SMTP Configuration
SMTP_USER=support@bleepy.co.uk
SMTP_PASSWORD=your-exchange-online-password

# Remove these (no longer needed)
# RESEND_API_KEY=...
```

## Step 3: Test Your Setup

Run the test script:
```bash
node test-smtp.js
```

## Exchange Online SMTP Settings

- **Host**: `smtp.office365.com`
- **Port**: `587`
- **Security**: `STARTTLS`
- **Authentication**: Required
- **Username**: `support@bleepy.co.uk`
- **Password**: Your Exchange Online password

## Alternative Exchange Online Settings

If the above doesn't work, try these alternatives:

### Option 1: Port 465 (SSL)
```javascript
{
  host: 'smtp.office365.com',
  port: 465,
  secure: true,
  auth: {
    user: 'support@bleepy.co.uk',
    pass: 'your-password'
  }
}
```

### Option 2: Different Host
```javascript
{
  host: 'outlook.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'support@bleepy.co.uk',
    pass: 'your-password'
  }
}
```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check if 2FA is enabled on your Exchange Online account
   - Use app password if 2FA is enabled
   - Verify email account is active

2. **Connection Timeout**
   - Check firewall settings
   - Verify port 587 is not blocked
   - Try port 465 with SSL

3. **TLS/SSL Errors**
   - Try `secure: true` for port 465
   - Check TLS configuration
   - Verify certificate settings

## Benefits of Exchange Online

✅ **Professional domain** - support@bleepy.co.uk  
✅ **Microsoft infrastructure** - Reliable delivery  
✅ **Full control** - Manage through Office 365 admin  
✅ **Brand consistency** - Your domain name  
✅ **Enterprise features** - Advanced security  

## Next Steps

1. ✅ Get your Exchange Online password
2. ✅ Update `.env.local` with correct password
3. ✅ Test with `node test-smtp.js`
4. ✅ Deploy to production
5. ✅ Monitor email delivery

Your verification emails will now come from your professional Exchange Online domain! 🎯
