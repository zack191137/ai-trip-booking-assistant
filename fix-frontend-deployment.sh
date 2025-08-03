#!/bin/bash

# Fix frontend deployment script

DROPLET_IP="24.199.110.244"
USER="root"
APP_DIR="/opt/ai-booking-assistant"

echo "🔧 Fixing frontend deployment..."

ssh ${USER}@${DROPLET_IP} << 'ENDSSH'
cd /opt/ai-booking-assistant

echo "🛑 Stopping all containers..."
docker-compose down

echo "🧹 Cleaning up old images..."
docker system prune -f

echo "📋 Checking docker-compose file..."
cat docker-compose.yml

echo ""
echo "🔨 Building backend (to test)..."
docker-compose build backend

echo ""
echo "🔨 Building frontend specifically..."
docker-compose build frontend

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "📊 Final container status..."
docker ps -a

echo ""
echo "📝 Frontend logs (if any)..."
docker logs ai-booking-frontend 2>&1 || echo "Frontend container not found"

echo ""
echo "📝 Backend logs (last 10 lines)..."
docker logs ai-booking-backend --tail=10

ENDSSH

echo "✅ Fix attempt complete!"