#!/bin/bash
set -e

# Quick fix for Nginx configuration
echo "🔧 Fixing Nginx configuration..."

cd /opt/ai-booking-assistant

# Stop Nginx
echo "🛑 Stopping Nginx..."
systemctl stop nginx 2>/dev/null || true

# Pull latest config from git
echo "📥 Pulling latest configuration..."
git pull origin main

# Remove any default Nginx sites
echo "🧹 Cleaning up Nginx sites..."
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/backend-ssl

# Copy the updated nginx config
echo "📝 Installing updated Nginx configuration..."
cp nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Start Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl reload nginx

# Verify services
echo ""
echo "🔍 Verifying services..."
sleep 3

echo -n "Frontend HTTP (port 80): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost || echo "Failed"

echo -n "Frontend HTTPS (port 443): "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost || echo "Failed"

echo -n "Backend API HTTPS (port 3000): "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:3000/api/health || echo "Failed"

echo ""
echo "🌐 Port listeners:"
netstat -tlnp | grep -E 'nginx|:(80|443|3000|5000|8080) '

echo ""
echo "✅ Nginx configuration updated!"
echo ""
echo "📋 Access URLs:"
echo "  Frontend HTTP:  http://ai.zackz.net"
echo "  Frontend HTTPS: https://ai.zackz.net"
echo "  Backend API:    https://ai.zackz.net:3000/api"
echo "  WebSocket:      wss://ai.zackz.net:3000"