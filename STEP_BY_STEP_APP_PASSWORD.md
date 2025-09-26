# 🔐 Step-by-Step App Password Creation Guide

## For: support@bleepy.co.uk

### **Step 1: Go to Microsoft Account Security**

1. **Open your web browser**
2. **Go to**: https://account.microsoft.com/security
3. **Sign in** with: `support@bleepy.co.uk`
4. **Enter your password** when prompted

### **Step 2: Enable Two-Factor Authentication (2FA)**

1. **Look for "Security"** in the left menu
2. **Click on "Security"**
3. **Find "Two-step verification"**
4. **Click "Turn on"**
5. **Follow the setup process**:
   - Choose phone number or authenticator app
   - Enter verification code
   - Confirm setup

### **Step 3: Create App Password**

1. **Go to App Passwords**:
   - Direct link: https://account.microsoft.com/security/app-passwords
   - OR: Security → Advanced security options → App passwords

2. **Click "Create a new app password"**

3. **Name your app password**:
   - Type: `Bleepy Simulator SMTP`
   - Click "Next"

4. **Copy the generated password**:
   - Microsoft will show a 16-character password
   - Format: `ABCD-EFGH-IJKL-MNOP`
   - **⚠️ COPY THIS IMMEDIATELY - You can't see it again!**

### **Step 4: Add to Your .env.local File**

1. **Open your `.env.local` file**
2. **Update the SMTP_PASSWORD line**:
   ```bash
   SMTP_USER=support@bleepy.co.uk
   SMTP_PASSWORD=ABCD-EFGH-IJKL-MNOP
   ```
3. **Save the file**

### **Step 5: Test Your Setup**

Run this command:
```bash
node test-smtp.js
```

## 🚨 **Important Notes:**

- ✅ **No spaces** in the app password
- ✅ **Exact copy** from Microsoft
- ✅ **No quotes** around the password
- ✅ **Copy immediately** - you can't see it again

## 🔍 **If You Can't Find "App Passwords":**

1. **Make sure 2FA is enabled first**
2. **Wait 5-10 minutes** after enabling 2FA
3. **Try the direct link**: https://account.microsoft.com/security/app-passwords
4. **Look for "Advanced security options"**

## 📱 **Alternative: Use Authenticator App**

If you prefer using an authenticator app:
1. **Download Microsoft Authenticator** (Google Play/App Store)
2. **Scan the QR code** during 2FA setup
3. **Use the app** for verification codes

## 🆘 **Still Having Issues?**

If you can't find the app passwords option:
1. **Check if 2FA is actually enabled**
2. **Try a different browser**
3. **Clear browser cache**
4. **Wait a few minutes** and try again

## ✅ **Success Indicators:**

When working correctly, you'll see:
```
✅ SMTP connection successful!
✅ Test email sent successfully!
Message ID: <message-id>
Check your inbox for the test email.
```

Your verification emails will then come from `support@bleepy.co.uk`! 🎯
