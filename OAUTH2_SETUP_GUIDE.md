# Microsoft Entra ID OAuth2 Setup Guide

This guide will help you set up OAuth2 authentication for Microsoft Entra ID to enable SMTP email sending.

## 🔧 **Step 1: Create App Registration in Azure AD**

1. **Go to** [Azure Portal](https://portal.azure.com)
2. **Navigate to** Azure Active Directory → App registrations
3. **Click** "New registration"
4. **Fill in the details**:
   - **Name**: `Bleepy Simulator Email Service`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank for now
5. **Click** "Register"

## 🔧 **Step 2: Configure API Permissions**

1. **In your app registration**, go to "API permissions"
2. **Click** "Add a permission"
3. **Select** "Microsoft Graph"
4. **Choose** "Application permissions"
5. **Add these permissions**:
   - `Mail.Send` (Send mail as any user)
   - `User.Read.All` (Read all users' full profiles)
6. **Click** "Grant admin consent" (since you're the Global Admin)

## 🔧 **Step 3: Create Client Secret**

1. **Go to** "Certificates & secrets"
2. **Click** "New client secret"
3. **Add description**: `Bleepy Simulator SMTP`
4. **Set expiration**: `24 months`
5. **Click** "Add"
6. **Copy the secret value** (you won't see it again!)

## 🔧 **Step 4: Get Tenant ID**

1. **Go to** Azure Active Directory → Overview
2. **Copy the Tenant ID**

## 🔧 **Step 5: Get Access Token**

You'll need to get an access token. Here are two methods:

### **Method A: Using Azure CLI (Recommended)**

```bash
# Install Azure CLI if you haven't already
# Then run:
az login
az account get-access-token --resource https://graph.microsoft.com
```

### **Method B: Using PowerShell**

```powershell
# Install Microsoft.Graph module
Install-Module Microsoft.Graph -Force

# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Mail.Send"

# Get access token
$token = Get-MgContext | Select-Object -ExpandProperty AccessToken
```

## 🔧 **Step 6: Update Environment Variables**

Add these to your `.env.local` file:

```bash
# SMTP Configuration
SMTP_USER=support@bleepy.co.uk

# Azure AD OAuth2 Configuration
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-app-client-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_ACCESS_TOKEN=your-access-token
AZURE_REFRESH_TOKEN=your-refresh-token
AZURE_TOKEN_EXPIRES=token-expiration-timestamp
```

## 🔧 **Step 7: Test the Connection**

Run the test script:

```bash
node test-oauth2-smtp.js
```

## 🔧 **Step 8: Update Email Service**

Once OAuth2 is working, update your email service in `lib/email.ts` to use OAuth2 authentication.

## 🚨 **Important Notes**

- **Access tokens expire** (usually 1 hour), so you'll need to refresh them
- **Consider using** a token refresh mechanism in production
- **Store secrets securely** and never commit them to version control
- **Test thoroughly** before deploying to production

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Insufficient privileges"**: Make sure you've granted admin consent for the API permissions
2. **"Invalid client"**: Check that your client ID and secret are correct
3. **"Token expired"**: You need to refresh the access token
4. **"Mail.Send permission denied"**: Ensure the app has the correct permissions

### **Getting Help:**

- Check the [Microsoft Graph documentation](https://docs.microsoft.com/en-us/graph/)
- Review [Azure AD app registration guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- Use [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) to test API calls

## 🎯 **Next Steps**

1. **Complete the Azure AD setup** above
2. **Test the OAuth2 connection**
3. **Update your email service** to use OAuth2
4. **Implement token refresh** for production use

---

**Need help?** Check the troubleshooting section or refer to Microsoft's documentation.
