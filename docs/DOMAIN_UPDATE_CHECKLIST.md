# Domain Update Checklist - ai.zackz.net

This document tracks all the changes made to update the application from using IP address (24.199.110.244) to the domain name (ai.zackz.net).

## ✅ Completed Updates

### 1. Frontend Configuration
- [x] `/frontend/.env.local` - Updated API URLs to use https://ai.zackz.net
- [x] `/frontend/vite.config.ts` - Updated proxy targets to use domain
- [x] `/frontend/src/App.tsx` - Updated backend URL display

### 2. Backend Configuration
- [x] `/backend/.env.example` - Cleaned up to use placeholders

### 3. Docker & Deployment
- [x] `/docker-compose.yml` - Updated FRONTEND_URL and API URLs
- [x] `/deploy.sh` - Added DOMAIN variable and updated all URLs to use HTTPS

### 4. Nginx Configuration
- [x] `/frontend/nginx.conf` - Added domain to server_name
- [x] Created `/nginx-ssl.conf` - Full SSL configuration for HTTPS
- [x] Created `/setup-ssl.sh` - Script to set up Let's Encrypt SSL certificates

### 5. Documentation
- [x] `/docs/GOOGLE_OAUTH_SETUP.md` - Updated with new domain URLs

## 🔄 Required Actions

### 1. Update Google OAuth Console
You need to update your Google Cloud Console OAuth settings:

1. Go to https://console.cloud.google.com/
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Update the following:

**Authorized JavaScript origins** (add these):
- `https://ai.zackz.net`
- `https://ai.zackz.net:3000`

**Authorized redirect URIs** (add these):
- `https://ai.zackz.net/auth/callback`
- `https://ai.zackz.net:3000/api/auth/google/callback`

5. Save the changes

### 2. Deploy with New Configuration
```bash
# Set environment variables
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
export GOOGLE_GEMINI_API_KEY=your-gemini-key

# Run deployment
./deploy.sh
```

### 3. Set Up SSL (After Initial Deployment)
```bash
# Update email in setup-ssl.sh first!
# Then run:
./setup-ssl.sh
```

## 🌐 New URLs

### Production URLs
- Frontend: https://ai.zackz.net
- Backend API: https://ai.zackz.net:3000
- WebSocket: wss://ai.zackz.net:3000

### Local Development URLs (unchanged)
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- WebSocket: ws://localhost:3000

## 📝 Notes

1. **HTTPS is now required** - All production URLs use HTTPS/WSS
2. **SSL certificates** - Will be automatically obtained via Let's Encrypt
3. **Port 3000** - Backend API is accessible on port 3000 with SSL
4. **Auto-renewal** - SSL certificates will auto-renew via cron job

## 🔒 Security Improvements

1. All traffic is now encrypted with HTTPS
2. Strict Transport Security (HSTS) is enabled
3. Modern TLS protocols only (TLS 1.2+)
4. Security headers are properly configured

## 🚨 Important Reminders

1. **Update Google OAuth** - Must be done before Google login will work
2. **Email for SSL** - Update email in `setup-ssl.sh` before running
3. **DNS Propagation** - May take up to 48 hours for DNS to fully propagate
4. **Firewall Rules** - Ensure ports 80, 443, and 3000 are open