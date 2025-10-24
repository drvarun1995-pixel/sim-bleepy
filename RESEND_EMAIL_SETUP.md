# 🚀 Switch to Resend API for Better Email Delivery

## Why Resend?
- ✅ No domain authentication needed
- ✅ Better deliverability rates
- ✅ Professional email service
- ✅ Easy setup (5 minutes)
- ✅ No security warnings

## Step 1: Sign Up for Resend
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your account
4. Get your API key from the dashboard

## Step 2: Update Environment Variables
Add to your `.env.local`:

```bash
# Resend API Configuration
RESEND_API_KEY=re_your_api_key_here

# Remove these (no longer needed)
# AZURE_TENANT_ID=...
# AZURE_CLIENT_ID=...
# AZURE_CLIENT_SECRET=...
# SMTP_USER=...
```

## Step 3: Update Email Service
Replace the current email service with Resend:

```typescript
// lib/email-resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailViaResend(to: string, subject: string, htmlContent: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Bleepy <support@bleepy.co.uk>',
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}
```

## Step 4: Install Resend Package
```bash
npm install resend
```

## Step 5: Update Your Email Functions
Replace the Microsoft Graph API calls with Resend calls in `lib/email.ts`.

## Benefits of Resend:
- 🚀 **Immediate setup** - No DNS configuration needed
- 📧 **Better deliverability** - Professional email infrastructure
- 🛡️ **No security warnings** - Trusted email service
- 💰 **Cost-effective** - $20/month for 50,000 emails
- 🔧 **Easy maintenance** - Simple API

## Testing
After setup, test with:
```bash
curl -X POST https://sim.bleepy.co.uk/api/test-email/verification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

## Cost Comparison:
- **Microsoft Graph API**: Free (but requires domain setup)
- **Resend**: $20/month for 50,000 emails
- **Bluehost SMTP**: Free (but requires domain setup)

## Recommendation:
Switch to Resend for immediate resolution of security warnings and better email delivery.




