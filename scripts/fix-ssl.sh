#!/bin/bash
set -e

# Quick fix script for SSL deployment issues
echo "🔧 Fixing SSL deployment issues..."

DOMAIN="ai.zackz.net"
APP_DIR="/opt/ai-booking-assistant"

# Stop all services first
echo "🛑 Stopping all services..."
systemctl stop nginx 2>/dev/null || true
docker-compose down 2>/dev/null || true
docker stop $(docker ps -q --filter "publish=80") 2>/dev/null || true

# Remove broken nginx config
echo "🧹 Cleaning up broken nginx config..."
rm -f /etc/nginx/sites-enabled/backend-ssl
rm -f /etc/nginx/sites-available/backend-ssl

# Check if SSL certificate exists, if not generate it
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "🔒 Generating SSL certificate..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        -d ${DOMAIN}
    echo "✅ SSL certificate generated"
else
    echo "✅ SSL certificate already exists"
fi

# Copy nginx config properly
echo "📝 Setting up Nginx configuration..."
if [ -f "${APP_DIR}/nginx/backend-ssl.conf" ]; then
    cp ${APP_DIR}/nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
    ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    echo "✅ Nginx configuration copied"
else
    echo "❌ Error: ${APP_DIR}/nginx/backend-ssl.conf not found"
    echo "📋 Available files in nginx directory:"
    ls -la ${APP_DIR}/nginx/ || echo "nginx directory not found"
    exit 1
fi

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Update .env with correct CORS origins
echo "🔐 Updating environment configuration..."
cd ${APP_DIR}
if [ -f ".env" ]; then
    # Update ALLOWED_ORIGINS to use HTTPS
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN},https://localhost:3002|g" .env
    echo "✅ Environment updated"
else
    echo "❌ .env file not found"
    exit 1
fi

# Start nginx first
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Wait a moment for nginx to start
sleep 5

# Start containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Test health
echo "🔍 Testing backend health..."
for i in {1..5}; do
    if curl -k -s https://localhost:3000/api/health > /dev/null; then
        echo "✅ Backend is healthy"
        break
    else
        echo "⏳ Waiting for backend... (attempt $i/5)"
        sleep 5
    fi
done

echo ""
echo "🎉 SSL fix completed!"
echo "🌐 Frontend: https://${DOMAIN}"
echo "🔒 Backend: https://${DOMAIN}:3000"
echo ""
echo "🔧 If issues persist, check:"
echo "  - Nginx logs: journalctl -u nginx"
echo "  - Container logs: docker-compose logs"
echo "  - SSL certificate: certbot certificates"