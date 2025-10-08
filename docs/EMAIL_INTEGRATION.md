# Email Integration Guide

This guide explains how to set up and use the email integration features in Midday Pivot, which allows you to connect Gmail and Outlook/Microsoft 365 accounts for reading, syncing, and sending emails.

## Overview

The email integration provides:
- **OAuth2 authentication** for Gmail and Outlook
- **Email syncing** to read and store emails locally
- **Email search** with filters for subject, sender, date, attachments
- **Email sending** through connected accounts
- **Inbox widget** for quick access to emails

## Quick Reference: Required Permissions

### Gmail (Google Cloud)

**For Email Integration (This Guide):**
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails and settings
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Read, send, delete, and manage emails
- Additional: `access_type=offline` - Get refresh tokens for background sync

**For SSO Login (Optional - See end of guide):**
- `openid` - Sign users in with OpenID Connect
- `email` - User's email address
- `profile` - User's basic profile info

### Azure AD (Microsoft)

**For Email Integration (This Guide):**
- `Mail.Read` - Read user's emails
- `Mail.Send` - Send emails
- `Mail.ReadWrite` - Full email access
- `User.Read` - Get user profile/email address
- `offline_access` - Refresh tokens for background sync

**For SSO Login (Optional - See end of guide):**
- `openid` - Sign users in
- `profile` - User profile info
- `email` - User email address
- `offline_access` - Maintain access

**Note:** Azure permissions are **Delegated** (user context), NOT **Application** (server context).

---

## Prerequisites

### Gmail Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gmail API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"

   **Select User Type:**
   - ✅ **Recommended:** "External" - Available to any Google account
   - Alternative: "Internal" - Only for Google Workspace organization users

   **Fill in App Information:**
   - Application name (e.g., "Midday Email Integration")
   - User support email
   - Developer contact information

   **Add OAuth Scopes:**
   Click "Add or Remove Scopes" and add these Gmail API scopes:

   - `https://www.googleapis.com/auth/gmail.readonly`
     - Read emails and email settings
     - Required for syncing and reading emails

   - `https://www.googleapis.com/auth/gmail.send`
     - Send emails on behalf of the user
     - Required for sending emails

   - `https://www.googleapis.com/auth/gmail.modify`
     - All operations except delete emails permanently
     - Required for marking as read, archiving, labeling
     - Includes both read and send capabilities

   **Important Notes:**
   - While in development, app is in "Testing" mode (up to 100 test users)
   - For production, submit for Google verification (may take 1-2 weeks)
   - Verification is required for apps accessing sensitive scopes (like Gmail)

4. **Create OAuth2 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Give it a name (e.g., "Midday Email OAuth")

   **Add Authorized Redirect URIs:**
   - Development: `http://localhost:3000/api/email/oauth/gmail/callback`
   - Production: `https://yourdomain.com/api/email/oauth/gmail/callback`

   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

   **Important Implementation Details:**
   - The OAuth flow uses `access_type=offline` to get refresh tokens
   - This allows background email syncing without user interaction
   - Refresh tokens are stored securely and used to get new access tokens when they expire

### Outlook/Microsoft 365 Setup

1. **Register an Azure AD Application**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to "Azure Active Directory" > "App registrations"
   - Click "New registration"
   - Enter application name (e.g., "Midday Email Integration")

   **Select Supported Account Types:**
   - ✅ **Recommended:** "Accounts in any organizational directory and personal Microsoft accounts"
     - Supports personal accounts (Outlook.com, Hotmail, Live)
     - Supports work/school accounts (Office 365, Azure AD)
     - Supports any organization's Azure AD
   - Alternative: "Single tenant" (only your organization)
   - Alternative: "Multitenant" (any organization's work accounts only)

   **Add Redirect URIs:**
   - Platform type: "Web"
   - Development: `http://localhost:3000/api/email/oauth/outlook/callback`
   - Production: `https://yourdomain.com/api/email/oauth/outlook/callback`

2. **Configure API Permissions**
   - In your app registration, go to "API permissions"
   - Click "Add a permission" > "Microsoft Graph"
   - Select **"Delegated permissions"** (NOT "Application permissions")

   **Required Permissions for Email Integration:**
   - `Mail.Read` - Read user's mailbox
   - `Mail.Send` - Send emails on behalf of the user
   - `Mail.ReadWrite` - Full access to user's mail (create, read, update, delete)
   - `User.Read` - Read user profile to get email address
   - `offline_access` - Get refresh tokens for background sync

   - Click "Grant admin consent" (optional but recommended)

   **Important Notes:**
   - Use **Delegated permissions** - these run in the context of a signed-in user
   - **Application permissions** are NOT needed unless you want server-to-server access without user context
   - Each user must consent to these permissions when connecting their email
   - Admin consent bypasses individual user consent prompts (good for organizations)

3. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Add a description and select expiration period
   - Copy the **Client Secret** value (you won't be able to see it again)
   - Copy the **Application (client) ID** from the Overview page
   - Copy the **Directory (tenant) ID** from the Overview page

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Gmail Integration
GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Outlook/Microsoft Graph
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_TENANT_ID=your-tenant-id  # Optional, defaults to "common"

# Application URLs (must match OAuth redirect URIs)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Database Setup

Run the database migration to create the required tables:

```bash
cd packages/db
bunx drizzle-kit push
```

This will create:
- `email_connections` - Stores OAuth credentials and connection settings
- `synced_emails` - Stores synchronized email messages

## Usage

### Connecting an Email Account

1. Navigate to **Settings > Emails** in the Pivot Dashboard
2. Click "Connect Email" button
3. Select either "Gmail" or "Outlook"
4. Complete the OAuth flow by signing in and granting permissions
5. You'll be redirected back to the settings page with a success message

### Syncing Emails

Emails are synced automatically when:
- A new connection is established
- Manual sync is triggered via the API

To manually sync emails using the tRPC API:

```typescript
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const trpc = useTRPC();

const syncMutation = useMutation(
  trpc.emails.sync.mutationOptions({
    onSuccess: (data) => {
      console.log(`Synced ${data.emailsCount} emails`);
    },
  })
);

// Trigger sync
syncMutation.mutate({
  connectionId: "connection-uuid",
  maxResults: 100,
  folders: ["INBOX"], // Optional
  startDate: "2024-01-01T00:00:00Z", // Optional
});
```

### Searching Emails

```typescript
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const trpc = useTRPC();

const { data: emails } = useQuery(
  trpc.emails.search.queryOptions({
    connectionId: "connection-uuid",
    query: "invoice",
    hasAttachments: true,
    isUnread: false,
    limit: 20,
  })
);
```

### Sending Emails

```typescript
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const trpc = useTRPC();

const sendMutation = useMutation(
  trpc.emails.sendEmail.mutationOptions({
    onSuccess: (data) => {
      console.log(`Email sent: ${data.messageId}`);
    },
  })
);

sendMutation.mutate({
  connectionId: "connection-uuid",
  to: "recipient@example.com",
  subject: "Hello from Midday",
  body: "<p>This is an HTML email</p>",
  cc: ["cc@example.com"], // Optional
});
```

## API Endpoints

### OAuth Flow

- **Gmail Authorization**: `GET /api/email/oauth/gmail/authorize`
- **Gmail Callback**: `GET /api/email/oauth/gmail/callback`
- **Outlook Authorization**: `GET /api/email/oauth/outlook/authorize`
- **Outlook Callback**: `GET /api/email/oauth/outlook/callback`

### tRPC Procedures

- `emails.connections` - Get all email connections for the team
- `emails.disconnect` - Disconnect an email account
- `emails.sync` - Manually sync emails from a connection
- `emails.search` - Search synced emails with filters
- `emails.getEmail` - Get full email details by message ID
- `emails.sendEmail` - Send an email through a connected account

## Security Considerations

1. **Credentials Storage**
   - OAuth tokens are stored encrypted in the database
   - Never expose client secrets in frontend code
   - Rotate client secrets regularly

2. **Token Refresh**
   - The email providers automatically refresh access tokens when they expire
   - Refresh tokens are securely stored and used to obtain new access tokens

3. **Permissions**
   - Users can only access emails from their own team's connections
   - Team ID is validated on all API requests

4. **Rate Limiting**
   - Gmail API: 250 quota units per user per second
   - Microsoft Graph: Varies by endpoint, typically 10,000 requests per 10 minutes

## Troubleshooting

### "OAuth not configured" Error

- Ensure `GMAIL_CLIENT_ID` or `OUTLOOK_CLIENT_ID` is set in `.env`
- Restart the Next.js development server after adding environment variables

### "Token exchange failed" Error

- Verify redirect URIs match exactly between OAuth provider and `.env`
- Check that client ID and secret are correct
- Ensure the OAuth consent screen is properly configured

### "Failed to sync emails" Error

- Check that the required API scopes are granted
- Verify the connection is still active in the database
- Check application logs for detailed error messages

### Emails Not Appearing

- Confirm sync was successful by checking `emailsCount` in the response
- Check the `synced_emails` table in the database
- Verify filters aren't excluding the emails you expect to see

## Testing

For development and testing:

1. Use test accounts rather than production email accounts
2. Enable OAuth test mode in Google Cloud Console or Azure AD
3. Add test users to the allowed test users list
4. Monitor the application logs for detailed error information

## Production Deployment

### Pre-Deployment Checklist

1. ✅ Update redirect URIs in OAuth providers to production URLs
2. ✅ Set production environment variables
3. ✅ Implement monitoring and alerting for email sync failures
4. ✅ Set up log aggregation to track OAuth errors
5. ✅ Configure rate limiting to prevent API quota exhaustion

### Google OAuth Verification (Required for Production)

**Why Verification is Needed:**
- Apps using sensitive scopes (Gmail, Drive, etc.) show an "unverified app" warning
- The app is limited to 100 test users until verified
- Production apps MUST complete Google's OAuth verification

**Verification Process:**

1. **Prepare Your App:**
   - Complete Privacy Policy and Terms of Service
   - Host them on your domain (e.g., `https://yourdomain.com/privacy`)
   - Ensure your app uses HTTPS in production
   - Remove test/development code

2. **Submit for Verification:**
   - Go to Google Cloud Console → OAuth consent screen
   - Click "Publish App" to move from Testing to Production
   - Click "Prepare for verification"
   - Fill out the OAuth verification form:
     - App description and justification for scopes
     - Links to privacy policy and terms
     - Demo video showing the OAuth flow
     - Test credentials (if applicable)

3. **Review Timeline:**
   - Initial review: 1-2 weeks
   - If additional information needed: 3-5 business days
   - Total time: 2-4 weeks typically

4. **During Review:**
   - Keep app in "Testing" mode (continues to work for test users)
   - Respond promptly to Google's requests for information
   - Don't change scopes or app configuration

**Workaround for Development:**
- Keep app in "Testing" mode
- Add users as "Test users" (up to 100)
- Users won't see "unverified app" warning
- Good for internal tools or limited rollouts

### Azure AD Production Considerations

**Admin Consent:**
- For work/school accounts, IT admin can grant consent for entire organization
- Users won't see individual consent prompts
- Go to app registration → API permissions → "Grant admin consent"

**Certification (Optional but Recommended):**
- Microsoft 365 App Compliance certification
- Shows users your app meets security standards
- Process: https://learn.microsoft.com/en-us/microsoft-365-app-certification/overview

## Supabase OAuth Provider Configuration

**✅ This implementation uses Supabase OAuth providers** instead of custom OAuth endpoints. This means:
- No need to create custom `/api/auth/google/authorize` endpoints
- Supabase handles the OAuth flow automatically
- Same credentials can be used for both email integration and SSO login
- Simpler setup and maintenance

### Configuring Supabase Dashboard

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/[your-project-id]

2. **Navigate to**: Authentication → Providers

3. **Configure Google Provider:**
   - Click on "Google" in the providers list
   - Toggle "Enable Sign in with Google" to ON
   - Enter your **Client ID** (from Google Cloud Console)
   - Enter your **Client Secret** (from Google Cloud Console)
   - Copy the **Redirect URL**: `https://[your-project].supabase.co/auth/v1/callback`
   - Click "Save"

4. **Configure Azure Provider:**
   - Click on "Azure" in the providers list
   - Toggle "Enable Sign in with Azure" to ON
   - Enter your **Application (client) ID** (from Azure Portal)
   - Enter your **Client secret** (from Azure Portal)
   - Enter your **Azure Tenant ID** (from Azure Portal)
   - Copy the **Redirect URL**: `https://[your-project].supabase.co/auth/v1/callback`
   - Click "Save"

### Adding Redirect URIs to OAuth Providers

After configuring Supabase, you need to add the Supabase redirect URL to your OAuth provider consoles:

**Google Cloud Console:**
1. Go to APIs & Services → Credentials
2. Click your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   - `https://[your-project].supabase.co/auth/v1/callback`
4. Click "Save"

**Azure Portal:**
1. Go to Azure Active Directory → App registrations
2. Click your app registration
3. Go to "Authentication"
4. Under "Redirect URIs", add a "Web" platform URI:
   - `https://[your-project].supabase.co/auth/v1/callback`
5. Click "Save"

### Required Scopes for SSO

**Important:** You need to add SSO scopes to your OAuth consent screens:

**Google Cloud Console:**
- Go to APIs & Services → OAuth consent screen
- Click "Edit App"
- In "Scopes" section, add:
  - `openid` (if not already added)
  - `email` (usually added by default)
  - `profile` (usually added by default)
- These are IN ADDITION to the Gmail API scopes for email integration
- Click "Save and Continue"

**Azure Portal:**
- Go to your app registration → API permissions
- Click "Add a permission" → Microsoft Graph → Delegated permissions
- Add (if not already added):
  - `openid`
  - `email`
  - `profile`
- These are IN ADDITION to the Mail.* permissions for email integration
- Click "Add permissions"

### Testing the Configuration

1. **Test Google Login:**
   - Go to your login page
   - Click "Continue with Google"
   - You should be redirected to Google sign-in
   - After authentication, you should be redirected back to your app

2. **Test Microsoft Login:**
   - Go to your login page
   - Click "Continue with Microsoft"
   - You should be redirected to Microsoft sign-in
   - After authentication, you should be redirected back to your app

3. **Check for Errors:**
   - If you see "redirect_uri_mismatch", verify the redirect URI in your OAuth console matches Supabase exactly
   - If you see "invalid_client", verify your Client ID and Secret are correct in Supabase
   - If you see "consent_required", make sure the required scopes are added in your OAuth consent screen

---

## Google SSO for Login (Optional - Already Implemented!)

**✅ SSO login buttons are already added to the login page!** The code implementation is complete. You just need to configure Supabase (see section above).

If you want to understand how it works:

### Additional Google Scopes for SSO

In the same Google Cloud project (or create a separate one):

**Required OAuth Scopes:**
- `openid` - Sign users in with OpenID Connect
- `email` - User's email address
- `profile` - User's basic profile information (name, picture)

### Implementation Options

**Option 1: Supabase OAuth Provider (Recommended)**

1. Configure Google in Supabase Dashboard:
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Client ID and Client Secret (from Google Cloud Console)
   - The redirect URL is: `https://your-project.supabase.co/auth/v1/callback`

2. Add "Sign in with Google" button to login page:
   ```typescript
   const supabase = createClient();
   await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
     },
   });
   ```

**Option 2: Custom Google Integration**

Similar to the email OAuth implementation, but for authentication:
- Create `/api/auth/google/authorize` endpoint
- Create `/api/auth/google/callback` endpoint
- Use scopes: `openid email profile`
- Handle user creation/login in Supabase

### Redirect URIs for SSO

Add these additional redirect URIs in Google Cloud Console OAuth credentials:

```
For Supabase OAuth:
https://your-project.supabase.co/auth/v1/callback

For Custom Implementation:
https://yourdomain.com/api/auth/google/callback
```

### Environment Variables for SSO

```bash
# If using separate OAuth client for SSO
GOOGLE_CLIENT_ID=your-sso-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-sso-client-secret

# Or reuse the same credentials as email integration
# GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET
```

**Note:** You can use the same OAuth client for both email integration and SSO, but the redirect URIs must include both callback URLs.

---

## Azure AD SSO for Login (Optional - Already Implemented!)

**✅ SSO login buttons are already added to the login page!** The code implementation is complete. You just need to configure Supabase (see "Supabase OAuth Provider Configuration" section above).

If you want to understand how it works:

### Additional Azure AD Permissions for SSO

In the same Azure AD app (or create a separate one):

**Required Delegated Permissions:**
- `openid` - Sign users in with OpenID Connect
- `profile` - View users' basic profile information
- `email` - View users' email address
- `offline_access` - Maintain access to data

### Implementation Options

**Option 1: Supabase OAuth Provider (Recommended)**

1. Configure Azure AD in Supabase Dashboard:
   - Go to Authentication → Providers → Azure
   - Enable Azure provider
   - Add your Client ID and Client Secret
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

2. Add "Sign in with Microsoft" button to login page:
   ```typescript
   const supabase = createClient();
   await supabase.auth.signInWithOAuth({
     provider: 'azure',
     options: {
       scopes: 'openid profile email offline_access',
       redirectTo: `${window.location.origin}/auth/callback`,
     },
   });
   ```

**Option 2: Custom Azure AD Integration**

Similar to the email OAuth implementation, but for authentication:
- Create `/api/auth/azure/authorize` endpoint
- Create `/api/auth/azure/callback` endpoint
- Handle user creation/login in Supabase

### Redirect URIs for SSO

Add these additional redirect URIs in Azure AD app registration:

```
For Supabase OAuth:
https://your-project.supabase.co/auth/v1/callback

For Custom Implementation:
https://yourdomain.com/api/auth/azure/callback
```

### Environment Variables for SSO

```bash
# If using separate app registration for SSO
AZURE_AD_CLIENT_ID=your-sso-client-id
AZURE_AD_CLIENT_SECRET=your-sso-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Or reuse the same credentials as email integration
# OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET
```

## Support

For additional help:
- Gmail API: [Google Gmail API Documentation](https://developers.google.com/gmail/api)
- Microsoft Graph: [Microsoft Graph Mail API](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- Azure AD Authentication: [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- Supabase Auth: [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- Midday Issues: Create an issue in the repository
