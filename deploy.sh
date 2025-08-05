#!/bin/bash
set -e

# SSL-enabled deployment script for Trip Booking Assistant
# This script deploys the application with HTTPS support

DROPLET_IP="24.199.110.244"
DOMAIN="ai.zackz.net"
USER="root"
APP_DIR="/opt/ai-booking-assistant"
GITHUB_REPO="https://github.com/zack191137/ai-trip-booking-assistant"

echo "🚀 Starting SSL-enabled deployment to DigitalOcean droplet..."

# Check if required environment variables are set
required_vars=("GOOGLE_GEMINI_API_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        echo "Please set it before running: export $var=your_value_here"
        exit 1
    fi
done

echo "✅ Environment variables verified for deployment"

echo "🔧 Setting up application on server..."
ssh ${USER}@${DROPLET_IP} << ENDSSH
# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Git if not present
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi

# Install Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx and Certbot for SSL
if ! command -v nginx &> /dev/null; then
    echo "🔒 Installing Nginx and SSL tools..."
    apt-get install -y nginx certbot python3-certbot-nginx
fi

# Clone or update repository
if [ -d "${APP_DIR}/.git" ]; then
    echo "📥 Updating existing repository..."
    cd ${APP_DIR}
    git pull origin main
else
    echo "📥 Cloning repository..."
    rm -rf ${APP_DIR}
    git clone ${GITHUB_REPO} ${APP_DIR}
    cd ${APP_DIR}
fi

# Create .env file with production values
echo "🔐 Creating environment configuration..."
cat > .env << EOF
# Backend
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://${DOMAIN}
GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=https://${DOMAIN}:3000/api/auth/google/callback

# CORS Origins (HTTPS only for production)
ALLOWED_ORIGINS=https://${DOMAIN},https://localhost:3002

# Frontend (for docker-compose)
FRONTEND_URL=https://${DOMAIN}
VITE_API_URL=https://${DOMAIN}:3000
VITE_WEBSOCKET_URL=wss://${DOMAIN}:3000
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
EOF

# Stop existing containers first to free port 80
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Set up SSL certificate if not exists
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "🔒 Setting up SSL certificate..."
    
    # Stop Nginx and any services using port 80
    systemctl stop nginx 2>/dev/null || true
    docker stop \$(docker ps -q --filter "publish=80") 2>/dev/null || true
    
    # Generate Let's Encrypt certificate
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        -d ${DOMAIN}
    
    echo "✅ SSL certificate generated"
else
    echo "✅ SSL certificate already exists"
fi

# Configure Nginx for SSL
echo "📝 Setting up Nginx SSL configuration..."

# Ensure nginx config exists
if [ ! -f "${APP_DIR}/nginx/backend-ssl.conf" ]; then
    echo "⚠️ Nginx config not found, creating it..."
    mkdir -p ${APP_DIR}/nginx
    cat > ${APP_DIR}/nginx/backend-ssl.conf << 'NGINXEOF'
# Nginx configuration for backend with SSL/TLS
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth_limit:10m rate=5r/m;

upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    
    # Serve frontend from Docker container on port 8080
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# HTTPS Server for frontend (port 443)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve frontend from Docker container on port 8080
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}

# HTTPS Server for backend API (port 3000)
server {
    listen 3000 ssl http2;
    listen [::]:3000 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

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
    # Dynamic CORS based on origin
    set \$cors_origin "";
    if (\$http_origin ~* ^https?://(localhost:3002|${DOMAIN})\$) {
        set \$cors_origin \$http_origin;
    }
    
    add_header Access-Control-Allow-Origin \$cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    location /api {
        # Handle OPTIONS requests for CORS
        if (\$request_method = 'OPTIONS') {
            set \$cors_origin "";
            if (\$http_origin ~* ^https?://(localhost:3002|${DOMAIN})\$) {
                set \$cors_origin \$http_origin;
            }
            add_header Access-Control-Allow-Origin \$cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        limit_req zone=api_limit burst=20 nodelay;
        
        location ~* ^/api/auth/(login|register|google)\$ {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_set_header X-NginX-Proxy true;
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
    }

    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # Root location - redirect to /api
    location = / {
        return 301 /api;
    }
}
NGINXEOF
fi

# Clean up old nginx configs
rm -f /etc/nginx/sites-enabled/backend-ssl
rm -f /etc/nginx/sites-available/backend-ssl

# Copy nginx config
cp ${APP_DIR}/nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > /etc/cron.d/certbot-renewal << 'CRONEOF'
# Renew Let's Encrypt certificates twice daily
0 0,12 * * * root certbot renew --quiet --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"
CRONEOF

# Ensure docker-compose.yml has correct port mapping
echo "📝 Verifying Docker port configuration..."
if grep -q "3000:3000" docker-compose.yml; then
    echo "🔧 Fixing backend port mapping to 5000:3000..."
    sed -i 's/- "3000:3000"/- "5000:3000"/' docker-compose.yml
fi

# Update frontend to use different port to avoid conflict with Nginx
echo "🔧 Updating frontend port to avoid Nginx conflict..."
sed -i 's/- "80:80"/- "8080:80"/' docker-compose.yml

# Remove any cached images to force complete rebuild
echo "🗑️ Removing cached Docker images..."
docker image rm ai-booking-assistant-frontend:latest 2>/dev/null || true
docker image rm ai-booking-assistant-backend:latest 2>/dev/null || true
docker system prune -f

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..15}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    else
        sleep 3
    fi
    
    if [ \$i -eq 15 ]; then
        echo "❌ Backend failed to start"
        exit 1
    fi
done

# Configure firewall for SSL
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Start Nginx only after backend is ready
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Verify Nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    systemctl reload nginx
else
    echo "❌ Nginx failed to start"
    exit 1
fi

# Wait for services to stabilize
sleep 10

# Health checks
echo "🔍 Performing health checks..."

# Quick health checks
echo -n "Backend: "
curl -s http://localhost:5000/api/health > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "API SSL: "
curl -k -s https://localhost:3000/api/health > /dev/null 2>&1 && echo "✅" || echo "❌"

echo -n "Frontend: "
curl -s http://localhost > /dev/null 2>&1 && echo "✅" || echo "❌"

echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: https://${DOMAIN}"
echo "  API:      https://${DOMAIN}:3000/api"
echo ""
echo "🔧 Manage with:"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose logs -f'"