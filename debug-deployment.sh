#!/bin/bash

# Debug deployment script
DROPLET_IP="24.199.110.244"
USER="root"
APP_DIR="/opt/ai-booking-assistant"

echo "🔍 Debugging deployment on server..."

ssh ${USER}@${DROPLET_IP} << 'ENDSSH'
cd /opt/ai-booking-assistant

echo "📁 Checking directory structure..."
echo "=== Root directory ==="
ls -la

echo ""
echo "=== Frontend directory ==="
ls -la frontend/

echo ""
echo "=== Docker images ==="
docker images | grep ai-booking

echo ""
echo "=== Docker containers ==="
docker ps -a

echo ""
echo "=== Docker compose logs ==="
docker-compose logs --tail=20

echo ""
echo "=== Try building frontend manually ==="
docker-compose build frontend

echo ""
echo "=== Container status after manual build ==="
docker ps -a

ENDSSH