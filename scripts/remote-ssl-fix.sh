#!/bin/bash
set -e

# Remote SSL Fix Script - Run this directly on the server
echo "🔧 Starting SSL fix on server..."

DOMAIN="ai.zackz.net"
APP_DIR="/opt/ai-booking-assistant"

# Stop all services
echo "🛑 Stopping all services..."
systemctl stop nginx 2>/dev/null || true
cd $APP_DIR && docker-compose down 2>/dev/null || true

# Pull latest changes from git to get nginx config
echo "📥 Pulling latest changes..."
cd $APP_DIR
git pull origin main

# Ensure nginx directory exists
if [ ! -f "$APP_DIR/nginx/backend-ssl.conf" ]; then
    echo "❌ Error: Nginx config not found in repository"
    echo "Creating nginx config manually..."
    mkdir -p $APP_DIR/nginx
    
    cat > $APP_DIR/nginx/backend-ssl.conf << 'EOF'
# Nginx configuration for backend with SSL/TLS
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    listen [::]:80;
    server_name ai.zackz.net;
    return 301 https://$server_name$request_uri;
}

server {
    listen 3000 ssl http2;
    listen [::]:3000 ssl http2;
    server_name ai.zackz.net;

    ssl_certificate /etc/letsencrypt/live/ai.zackz.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.zackz.net/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        location ~* ^/api/auth/(login|register|google)$ {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_set_header X-NginX-Proxy true;
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
fi

# Clean up nginx config
echo "🧹 Cleaning up nginx configuration..."
rm -f /etc/nginx/sites-enabled/backend-ssl
rm -f /etc/nginx/sites-available/backend-ssl

# Copy nginx config
echo "📝 Setting up Nginx configuration..."
cp $APP_DIR/nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    echo "Nginx error details:"
    nginx -t 2>&1
    exit 1
fi

# Update .env with HTTPS CORS origins
echo "🔐 Updating environment configuration..."
if [ -f "$APP_DIR/.env" ]; then
    # Add ALLOWED_ORIGINS and FRONTEND_URL if not present
    if ! grep -q "^ALLOWED_ORIGINS=" "$APP_DIR/.env"; then
        echo "ALLOWED_ORIGINS=https://${DOMAIN},https://localhost:3002" >> "$APP_DIR/.env"
    else
        sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN},https://localhost:3002|g" "$APP_DIR/.env"
    fi
    
    if ! grep -q "^FRONTEND_URL=" "$APP_DIR/.env"; then
        echo "FRONTEND_URL=https://${DOMAIN}" >> "$APP_DIR/.env"
    else
        sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://${DOMAIN}|g" "$APP_DIR/.env"
    fi
    
    echo "✅ Environment updated"
else
    echo "❌ .env file not found"
    exit 1
fi

# Start Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 20

# Test services
echo "🔍 Testing services..."

# Test backend directly (port 5000)
echo -n "Testing backend on port 5000: "
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
    echo "Backend logs:"
    docker-compose logs backend --tail=20
fi

# Test Nginx SSL proxy
echo -n "Testing HTTPS proxy on port 3000: "
if curl -k -s https://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
    echo "Nginx error log:"
    tail -n 20 /var/log/nginx/error.log
fi

# Test frontend
echo -n "Testing frontend on port 80: "
if curl -s http://localhost > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

# Show final status
echo ""
echo "🎉 SSL fix completed!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🔒 Nginx Status:"
systemctl status nginx --no-pager
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: https://${DOMAIN}"
echo "  Backend:  https://${DOMAIN}:3000"
echo ""
echo "📋 Check logs with:"
echo "  docker-compose logs -f"
echo "  journalctl -u nginx -f"