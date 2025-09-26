# SMTP Email Setup with Outlook

## Environment Variables Setup

Add these variables to your `.env.local` file:

```bash
# SMTP Configuration for Outlook
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASSWORD=your-outlook-password-or-app-password

# Remove these (no longer needed)
# RESEND_API_KEY=...
```

## Outlook SMTP Settings

### For Personal Outlook Accounts:
- **SMTP Server**: `smtp-mail.outlook.com`
- **Port**: `587`
- **Security**: `STARTTLS`
- **Authentication**: Required

### For Office 365/Outlook.com:
- **SMTP Server**: `smtp-mail.outlook.com`
- **Port**: `587`
- **Security**: `STARTTLS`

## Security Setup

### Option 1: Use App Password (Recommended)
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable **Two-factor authentication**
3. Go to **App passwords**
4. Create a new app password for "Bleepy Simulator"
5. Use this app password in `SMTP_PASSWORD`

### Option 2: Use Regular Password (Less Secure)
- Use your regular Outlook password
- ⚠️ **Not recommended** for production

## Testing Your Setup

### Test Script
Create a test file to verify your SMTP connection:

```javascript
// test-smtp.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'your-test-email@example.com',
      subject: 'Test Email from Bleepy Simulator',
      html: '<h1>Test Email</h1><p>If you receive this, SMTP is working!</p>'
    });
    
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();
```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check if 2FA is enabled
   - Use app password instead of regular password
   - Verify email and password are correct

2. **Connection Timeout**
   - Check firewall settings
   - Try different port (465 with SSL)
   - Verify SMTP server address

3. **TLS/SSL Errors**
   - Ensure `secure: false` for port 587
   - Try `secure: true` for port 465
   - Check TLS configuration

### Alternative SMTP Settings:

If Outlook doesn't work, try these alternatives:

```javascript
// Gmail SMTP
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-gmail@gmail.com',
    pass: 'your-app-password'
  }
}

// Yahoo SMTP
{
  host: 'smtp.mail.yahoo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-yahoo@yahoo.com',
    pass: 'your-app-password'
  }
}
```

## Production Considerations

1. **Rate Limits**: Outlook has sending limits
2. **Reputation**: Use a dedicated email for sending
3. **Monitoring**: Set up email delivery monitoring
4. **Backup**: Consider having a backup SMTP provider

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test SMTP connection
3. ✅ Deploy to production
4. ✅ Monitor email delivery
5. ✅ Set up email analytics
