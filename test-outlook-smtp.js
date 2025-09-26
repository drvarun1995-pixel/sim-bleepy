// Test different Outlook SMTP configurations
// Run with: node test-outlook-smtp.js

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testOutlookSMTP() {
  console.log('Testing Outlook SMTP configurations...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***hidden***' : 'NOT SET');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Environment variables not set!');
    return;
  }

  // Different Outlook SMTP configurations
  const configs = [
    {
      name: 'Outlook (smtp-mail.outlook.com) - Port 587',
      config: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      }
    },
    {
      name: 'Outlook (smtp-mail.outlook.com) - Port 25',
      config: {
        host: 'smtp-mail.outlook.com',
        port: 25,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      }
    },
    {
      name: 'Outlook (smtp-mail.outlook.com) - Port 465 SSL',
      config: {
        host: 'smtp-mail.outlook.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      }
    },
    {
      name: 'Outlook (smtp-mail.outlook.com) - No TLS',
      config: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🧪 Testing ${name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      // Test connection
      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log(`✅ ${name} connection successful!`);

      // Send test email
      console.log('Sending test email...');
      const info = await transporter.sendMail({
        from: `"Bleepy Simulator" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        subject: 'Bleepy Simulator - Outlook SMTP Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🏥 Bleepy Simulator</h1>
              <h2 style="margin: 10px 0 0 0; font-size: 18px;">Outlook SMTP Test Successful!</h2>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Your Outlook SMTP configuration is working correctly for <strong>support@bleepy.co.uk</strong>.</p>
              <p><strong>Configuration:</strong> ${name}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>From:</strong> Bleepy Simulator &lt;support@bleepy.co.uk&gt;</p>
              <p><strong>To:</strong> ${process.env.SMTP_USER}</p>
              <p><strong>Status:</strong> ✅ Ready for production</p>
            </div>
          </div>
        `
      });

      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Check your inbox for the test email.');
      console.log(`\n🎉 SUCCESS! Use this configuration: ${name}`);
      return;

    } catch (error) {
      console.log(`❌ ${name} failed: ${error.message}`);
      continue;
    }
  }

  console.log('\n❌ All Outlook SMTP configurations failed!');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Try using your regular Outlook password (not app password)');
  console.log('2. Check if 2FA is enabled on your Outlook account');
  console.log('3. Verify the email address is correct');
  console.log('4. Check if SMTP is enabled for your account');
}

testOutlookSMTP();
