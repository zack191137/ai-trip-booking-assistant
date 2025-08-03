# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for the Trip Booking Assistant application.

## Prerequisites
- A Google account
- Access to Google Cloud Console

## Step-by-Step Instructions

### 1. Access Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Sign in with your Google account

### 2. Create a New Project (or select existing)
1. Click the project dropdown at the top
2. Click "New Project"
3. Enter project name: "Trip Booking Assistant"
4. Click "Create"

### 3. Enable Required APIs
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - Google+ API
   - Google Identity Toolkit API

### 4. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Trip Booking Assistant
   - **User support email**: your-email@example.com
   - **App logo**: (optional)
   - **App domain**: (optional for development)
   - **Developer contact**: your-email@example.com
4. Click "Save and Continue"
5. On the Scopes page:
   - Click "Add or Remove Scopes"
   - Select these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click "Update" and "Save and Continue"
6. Add test users (your email and any others for testing)
7. Review and go back to dashboard

### 5. Create OAuth 2.0 Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application" as the application type
4. Configure the client:
   - **Name**: Trip Booking Assistant Web Client
   - **Authorized JavaScript origins** (add all of these):
     ```
     http://localhost:3001
     http://localhost:3000
     https://ai.zackz.net
     https://ai.zackz.net:3000
     ```
     For development, also keep:
     ```
     http://24.199.110.244
     https://24.199.110.244
     ```
   - **Authorized redirect URIs** (add all of these):
     ```
     http://localhost:3001/auth/callback
     http://localhost:3000/api/auth/google/callback
     https://ai.zackz.net/auth/callback
     https://ai.zackz.net:3000/api/auth/google/callback
     ```
     For development, also keep:
     ```
     http://24.199.110.244/auth/callback
     https://24.199.110.244/auth/callback
     ```
5. Click "Create"

### 6. Save Your Credentials
After creation, you'll see:
- **Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important**: Keep the Client Secret secure! Never commit it to Git.

### 7. Configure Your Application

#### For Frontend (Client ID only):
Update `/frontend/.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

#### For Backend (Client ID and Secret):
Create `/backend/.env` file (copy from `.env.example`):
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

⚠️ **IMPORTANT**: 
- **Never put the Client Secret in frontend code!**
- **Add `/backend/.env` to `.gitignore`**
- **Client Secret should only exist on the backend server**

#### For Deployment:
Set environment variables before running deploy script:
```bash
export GOOGLE_CLIENT_ID=your-client-id-here
export GOOGLE_CLIENT_SECRET=your-client-secret-here
export GOOGLE_GEMINI_API_KEY=your-gemini-key-here
./deploy.sh
```

## Testing Your Setup

1. Start your local development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to http://localhost:3001

3. Click the "Sign in with Google" button

4. You should see Google's OAuth consent screen

5. After authorization, you should be redirected back to your app

## Troubleshooting

### "Invalid Origin" Error
- Make sure all your URLs are added to "Authorized JavaScript origins"
- URLs must match exactly (http vs https, with/without www)

### "Redirect URI Mismatch" Error
- Check that your redirect URIs in Google Console match your app's callback URL
- The redirect URI must be exact, including the path

### "This app is blocked" Error
- Make sure you've added your email to test users in OAuth consent screen
- For production, you'll need to verify your app with Google

### Client ID Not Working
- Ensure you're using the Client ID, not the Client Secret in frontend
- Check for extra spaces or characters when copying
- Verify the project is selected in Google Console

## Production Considerations

1. **Domain Verification**: For production, verify your domain ownership
2. **Privacy Policy**: Add a privacy policy URL to your OAuth consent screen
3. **Terms of Service**: Add terms of service URL
4. **App Verification**: Submit for verification if you have more than 100 users
5. **HTTPS**: Always use HTTPS in production

## Security Best Practices

1. **Never expose Client Secret**: Only use it on the backend
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate tokens**: Always validate tokens on the backend
4. **Limit scopes**: Only request the minimum necessary scopes
5. **Regular audits**: Regularly review your OAuth app settings

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)