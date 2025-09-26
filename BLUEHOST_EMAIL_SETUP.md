# 📧 Bluehost Email Setup for support@bleepy.co.uk

## Your Email Configuration

**Email Provider**: Bluehost  
**Domain**: bleepy.co.uk  
**Email**: support@bleepy.co.uk  
**SMTP Server**: mail.bleepy.co.uk  

## Step 1: Get Your Bluehost Email Password

1. **Log into your Bluehost cPanel**
2. **Go to "Email Accounts"**
3. **Find your support@bleepy.co.uk account**
4. **Note the password** (or reset it if needed)

## Step 2: Environment Variables

Update your `.env.local` file:

```bash
# Bluehost SMTP Configuration
SMTP_USER=support@bleepy.co.uk
SMTP_PASSWORD=your-bluehost-email-password

# Remove these (no longer needed)
# RESEND_API_KEY=...
```

## Step 3: Test Your Setup

Run the test script:
```bash
node test-smtp.js
```

## Bluehost SMTP Settings

- **Host**: `mail.bleepy.co.uk`
- **Port**: `587`
- **Security**: `STARTTLS`
- **Authentication**: Required
- **Username**: `support@bleepy.co.uk`
- **Password**: Your Bluehost email password

## Alternative Bluehost SMTP Settings

If the above doesn't work, try these alternatives:

### Option 1: Port 465 (SSL)
```javascript
{
  host: 'mail.bleepy.co.uk',
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
  host: 'smtp.bleepy.co.uk',
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
   - Check email password in Bluehost cPanel
   - Reset password if needed
   - Verify email account is active

2. **Connection Timeout**
   - Check firewall settings
   - Verify port 587 is not blocked
   - Try port 465 with SSL

3. **TLS/SSL Errors**
   - Try `secure: true` for port 465
   - Check TLS configuration
   - Verify certificate settings

## Benefits of Bluehost Email

✅ **Professional domain** - support@bleepy.co.uk  
✅ **No third-party costs** - Use your own email  
✅ **Full control** - Manage through Bluehost  
✅ **Reliable delivery** - Bluehost's infrastructure  
✅ **Brand consistency** - Your domain name  

## Next Steps

1. ✅ Get your Bluehost email password
2. ✅ Update `.env.local` with correct password
3. ✅ Test with `node test-smtp.js`
4. ✅ Deploy to production
5. ✅ Monitor email delivery

Your verification emails will now come from your professional Bluehost domain! 🎯
