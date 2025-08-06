#!/bin/bash
set -e

# Frontend-only deployment script for Trip Booking Assistant
# This script deploys only the frontend service

DROPLET_IP="24.199.110.244"
DOMAIN="ai.zackz.net"
USER="root"
APP_DIR="/opt/ai-booking-assistant"
GITHUB_REPO="https://github.com/zack191137/ai-trip-booking-assistant"

echo "🚀 Starting frontend-only deployment to DigitalOcean droplet..."

# Check if required environment variables are set
required_vars=("GOOGLE_CLIENT_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        echo "Please set it before running: export $var=your_value_here"
        exit 1
    fi
done

echo "✅ Environment variables verified for frontend deployment"

echo "🔧 Deploying frontend service..."
ssh ${USER}@${DROPLET_IP} << ENDSSH
# Navigate to app directory
cd ${APP_DIR}

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Update .env file with frontend configuration
echo "🔐 Updating frontend environment configuration..."
cat > .env << EOF
# Frontend Configuration for Docker Compose
VITE_API_BASE_URL=https://${DOMAIN}:3000/api
VITE_WS_URL=wss://${DOMAIN}:3000
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}

# Frontend URL
FRONTEND_URL=https://${DOMAIN}
VITE_API_URL=https://${DOMAIN}:3000
VITE_WEBSOCKET_URL=wss://${DOMAIN}:3000

# Build environment
NODE_ENV=production
EOF

# Create frontend-specific .env.local for the build process
echo "📝 Creating frontend build environment..."
cat > frontend/.env.local << EOF
VITE_API_BASE_URL=https://${DOMAIN}:3000/api
VITE_WS_URL=wss://${DOMAIN}:3000
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
EOF

# Stop existing frontend container
echo "🛑 Stopping existing frontend container..."
docker-compose stop frontend 2>/dev/null || true

# Remove old frontend image to force rebuild
echo "🗑️ Removing old frontend image..."
docker image rm ai-booking-assistant-frontend:latest 2>/dev/null || true

# Clean up any cached frontend builds
echo "🧹 Cleaning frontend cache..."
docker system prune -f --filter "label=stage=frontend-build"

# Build and start only the frontend service  
echo "🔨 Building frontend Docker image..."
docker-compose build --no-cache frontend

echo "🚀 Starting frontend service..."
docker-compose up -d frontend

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in {1..15}; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    else
        echo "⏳ Attempt \$i/15 - waiting for frontend..."
        sleep 2
    fi
    
    if [ \$i -eq 15 ]; then
        echo "❌ Frontend failed to start after 30 seconds"
        echo "📋 Frontend logs:"
        docker-compose logs --tail=50 frontend
        exit 1
    fi
done

# Reload Nginx to ensure frontend routing works
echo "🔄 Reloading Nginx configuration..."
systemctl reload nginx

# Health checks
echo "🔍 Performing frontend health checks..."

echo -n "Frontend (Docker): "
curl -s http://localhost:8080 > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "Frontend (via Nginx HTTP): "
curl -s http://localhost > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "Frontend (via Nginx HTTPS): "
curl -k -s https://localhost > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "Frontend Assets: "
curl -k -s https://localhost/favicon.ico > /dev/null 2>&1 && echo "✅" || echo "❌"

# Show running containers
echo "📋 Running containers:"
docker-compose ps

echo "✅ Frontend deployment complete!"
ENDSSH

echo ""
echo "🎉 Frontend deployment completed!"
echo ""
echo "🌐 Frontend URLs:"
echo "  HTTPS:    https://${DOMAIN}"
echo "  HTTP:     http://${DOMAIN} (redirects to HTTPS)"
echo "  Direct:   http://${DOMAIN}:8080 (development only)"
echo ""
echo "🔧 Frontend Configuration:"
echo "  API URL:  https://${DOMAIN}:3000/api"
echo "  WS URL:   wss://${DOMAIN}:3000"
echo "  Google:   OAuth configured for ${DOMAIN}"
echo ""
echo "🔧 Manage frontend with:"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose logs -f frontend'"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose restart frontend'"
echo ""
echo "💡 Note: Backend must be running for full functionality"