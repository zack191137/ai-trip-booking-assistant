#!/bin/bash
set -e

# Quick fix for port configuration
echo "🔧 Fixing port configuration..."

cd /opt/ai-booking-assistant

# Stop everything
echo "🛑 Stopping all services..."
docker-compose down
systemctl stop nginx 2>/dev/null || true

# Fix docker-compose.yml to use port 5000
echo "📝 Updating docker-compose.yml..."
sed -i 's/- "3000:3000"/- "5000:3000"/' docker-compose.yml

# Ensure Nginx config exists and is correct
echo "📝 Setting up Nginx configuration..."
if [ -f "nginx/backend-ssl.conf" ]; then
    cp nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
else
    # Create nginx config if missing
    cat > /etc/nginx/sites-available/backend-ssl << 'EOF'
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

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api {
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
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
fi

# Enable nginx site
ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo "🧪 Testing Nginx configuration..."
nginx -t

# Start nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Start containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 15

# Test services
echo ""
echo "🔍 Testing services..."
echo -n "Backend on port 5000: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/health || echo "Failed"

echo -n "HTTPS on port 3000: "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:3000/api/health || echo "Failed"

echo -n "Frontend on port 80: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost || echo "Failed"

echo ""
echo "🌐 Port listeners:"
netstat -tlnp | grep -E ':(80|443|3000|5000) '

echo ""
echo "🐳 Container status:"
docker-compose ps

echo ""
echo "🔒 Nginx status:"
systemctl status nginx --no-pager

echo ""
echo "✅ Fix completed!"