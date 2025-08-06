#!/bin/bash
set -e

# Backend-only deployment script for Trip Booking Assistant
# This script deploys only the backend service

DROPLET_IP="24.199.110.244"
DOMAIN="ai.zackz.net"
USER="root"
APP_DIR="/opt/ai-booking-assistant"
GITHUB_REPO="https://github.com/zack191137/ai-trip-booking-assistant"

echo "🚀 Starting backend-only deployment to DigitalOcean droplet..."

# Check if required environment variables are set
required_vars=("GOOGLE_GEMINI_API_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        echo "Please set it before running: export $var=your_value_here"
        exit 1
    fi
done

echo "✅ Environment variables verified for backend deployment"

echo "🔧 Deploying backend service..."
ssh ${USER}@${DROPLET_IP} << ENDSSH
# Navigate to app directory
cd ${APP_DIR}

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Update .env file with backend configuration
echo "🔐 Updating backend environment configuration..."
cat > .env << EOF
# Backend Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_SECRET=\$(openssl rand -base64 32 2>/dev/null || echo "fallback-jwt-secret-$(date +%s)")
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://${DOMAIN}
GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=https://${DOMAIN}:3000/api/auth/google/callback

# CORS Origins - Allow both production and development origins
ALLOWED_ORIGINS=https://${DOMAIN},http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173

# Database & Storage (if needed)
# Add your database configuration here

# Logging
LOG_LEVEL=info
EOF

# Stop existing backend container
echo "🛑 Stopping existing backend container..."
docker-compose stop backend 2>/dev/null || true

# Remove old backend image to force rebuild
echo "🗑️ Removing old backend image..."
docker image rm ai-booking-assistant-backend:latest 2>/dev/null || true

# Build and start only the backend service
echo "🔨 Building backend Docker image..."
docker-compose build --no-cache backend

echo "🚀 Starting backend service..."
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..20}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    else
        echo "⏳ Attempt \$i/20 - waiting for backend..."
        sleep 3
    fi
    
    if [ \$i -eq 20 ]; then
        echo "❌ Backend failed to start after 60 seconds"
        echo "📋 Backend logs:"
        docker-compose logs --tail=50 backend
        exit 1
    fi
done

# Health checks
echo "🔍 Performing backend health checks..."

echo -n "Backend Health: "
curl -s http://localhost:5000/api/health > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "Backend API (via Nginx SSL): "
curl -k -s https://localhost:3000/api/health > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "Auth Endpoints: "
curl -k -s -o /dev/null -w "%{http_code}" -X OPTIONS https://localhost:3000/api/auth/register | grep -q "200" && echo "✅" || echo "❌"

# Show running containers
echo "📋 Running containers:"
docker-compose ps

echo "✅ Backend deployment complete!"
ENDSSH

echo ""
echo "🎉 Backend deployment completed!"
echo ""
echo "🌐 Backend API URLs:"
echo "  Health:   https://${DOMAIN}:3000/api/health"
echo "  Auth:     https://${DOMAIN}:3000/api/auth"
echo "  API Docs: https://${DOMAIN}:3000/api"
echo ""
echo "🔐 Authentication Endpoints:"
echo "  Register: https://${DOMAIN}:3000/api/auth/register"
echo "  Login:    https://${DOMAIN}:3000/api/auth/login"  
echo "  Google:   https://${DOMAIN}:3000/api/auth/google"
echo ""
echo "🔧 Manage backend with:"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose logs -f backend'"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose restart backend'"