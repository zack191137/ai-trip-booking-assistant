# Deployment Guide

This project includes multiple deployment scripts to give you flexibility in how you deploy updates.

## Available Scripts

### 🚀 `./deploy.sh` - Interactive Deployment Menu
Shows deployment options and lets you choose which script to run interactively.

### 📦 `./deploy-full.sh` - Complete Deployment
Deploys the entire application including:
- Backend API service
- Frontend web application  
- Nginx reverse proxy with SSL/HTTPS
- SSL certificates via Let's Encrypt
- Firewall configuration
- Health checks

**Use for**: Initial deployment, major updates, infrastructure changes

### ⚙️ `./deploy-backend.sh` - Backend Only
Deploys only the backend API service:
- Pulls latest backend code
- Rebuilds backend Docker image
- Restarts backend container
- Health checks for API endpoints

**Use for**: Backend code updates, API changes, environment variable updates

### 🎨 `./deploy-frontend.sh` - Frontend Only
Deploys only the frontend web application:
- Pulls latest frontend code
- Rebuilds frontend Docker image with latest environment variables
- Restarts frontend container
- Reloads Nginx configuration

**Use for**: UI updates, frontend code changes, styling updates

## Prerequisites

### Required Environment Variables
```bash
export GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
export GOOGLE_CLIENT_ID=your_google_oauth_client_id
export GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Server Configuration
- DigitalOcean droplet with Docker and Docker Compose
- Domain pointed to your server IP (ai.zackz.net)
- SSH access configured

## Usage Examples

### First Time Deployment
```bash
# Set environment variables
export GOOGLE_GEMINI_API_KEY=your_key
export GOOGLE_CLIENT_ID=your_id
export GOOGLE_CLIENT_SECRET=your_secret

# Run full deployment
./deploy-full.sh
```

### Updating Backend Only
```bash
# After making backend changes
git push origin main
./deploy-backend.sh
```

### Updating Frontend Only
```bash
# After making frontend changes  
git push origin main
./deploy-frontend.sh
```

### Interactive Deployment
```bash
# Shows menu and guides you through options
./deploy.sh
```

## Deployment Architecture

```
Internet
    ↓
Nginx (Port 80/443)
    ├── Frontend (Port 8080) → React App
    └── Backend API (Port 5000) → Node.js API
            ↓
        Port 3000 (SSL) → Public API Access
```

## Health Check Endpoints

After deployment, verify these endpoints:
- Frontend: `https://ai.zackz.net`
- Backend Health: `https://ai.zackz.net:3000/api/health`
- Authentication: `https://ai.zackz.net:3000/api/auth/register`

## Troubleshooting

### View Logs
```bash
# Backend logs
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose logs -f backend'

# Frontend logs  
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose logs -f frontend'

# All services
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose logs -f'
```

### Restart Services
```bash
# Restart backend only
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose restart backend'

# Restart frontend only
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose restart frontend'

# Restart all services
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose restart'
```

### Check Container Status
```bash
ssh root@24.199.110.244 'cd /opt/ai-booking-assistant && docker-compose ps'
```

## Performance Tips

- Use `deploy-backend.sh` or `deploy-frontend.sh` for faster deployments when only one service changed
- The full deployment takes 5-10 minutes, individual deployments take 1-3 minutes
- Backend deployments are faster than frontend (no asset compilation)
- Frontend deployments include a complete rebuild for optimal performance

## Security

- All deployments use HTTPS with automatic SSL certificate renewal
- CORS is configured for both production and development origins
- Rate limiting is applied to API endpoints
- Firewall rules restrict access to necessary ports only