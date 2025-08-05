#!/bin/bash
set -e

# Quick fix for CORS to allow localhost:3002
echo "🔧 Fixing CORS for development..."

cd /opt/ai-booking-assistant

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop Nginx
echo "🛑 Stopping Nginx..."
systemctl stop nginx

# Copy updated nginx config
echo "📝 Updating Nginx configuration..."
cp nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl

# Test configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Start Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx

echo ""
echo "✅ CORS fix applied!"
echo "🌐 Allowed origins: localhost:3002, ai.zackz.net"
echo ""
echo "🔍 Test with:"
echo "  curl -H 'Origin: http://localhost:3002' -I https://ai.zackz.net:3000/api/health"