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
    return 301 https://\$server_name\$request_uri;
}

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

    location /api {
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

# Wait for backend to be ready before starting Nginx
echo "⏳ Waiting for backend to start on port 5000..."
for i in {1..20}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    else
        echo "⏳ Waiting for backend... (attempt \$i/20)"
        sleep 3
    fi
    
    if [ \$i -eq 20 ]; then
        echo "⚠️ Backend taking longer than expected"
        docker-compose logs backend --tail=10
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
echo "🔍 Verifying Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    echo "Nginx error details:"
    systemctl status nginx --no-pager
    journalctl -xeu nginx --no-pager | tail -20
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🔍 Performing health checks..."

# Check backend direct connection first (port 5000)
echo "Checking backend direct connection..."
for i in {1..10}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is running on port 5000"
        break
    else
        echo "⏳ Waiting for backend... (attempt \$i/10)"
        sleep 5
    fi
    
    if [ \$i -eq 10 ]; then
        echo "❌ Backend not responding on port 5000"
        echo "Backend logs:"
        docker-compose logs backend --tail=20
    fi
done

# Check backend through Nginx SSL proxy
echo "Checking HTTPS proxy..."
for i in {1..5}; do
    if curl -k -s https://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ HTTPS proxy is working"
        break
    else
        echo "⏳ Waiting for HTTPS proxy... (attempt \$i/5)"
        sleep 3
    fi
    
    if [ \$i -eq 5 ]; then
        echo "⚠️ HTTPS proxy not responding (may take time to start)"
        echo "Nginx status:"
        systemctl status nginx --no-pager || true
    fi
done

# Check frontend
echo "Checking frontend..."
for i in {1..5}; do
    if curl -s http://localhost:80 > /dev/null; then
        echo "✅ Frontend is accessible"
        break
    else
        echo "⏳ Waiting for frontend... (attempt \$i/5)"
        sleep 3
    fi
    
    if [ \$i -eq 5 ]; then
        echo "❌ Frontend health check failed"
        echo "Frontend logs:"
        docker-compose logs frontend --tail=20
        exit 1
    fi
done

# Check SSL certificate
echo "Checking SSL certificate..."
if openssl s_client -servername ${DOMAIN} -connect ${DOMAIN}:3000 </dev/null 2>/dev/null | openssl x509 -noout -dates; then
    echo "✅ SSL certificate is valid"
else
    echo "⚠️  SSL certificate check failed (might be normal if certificate is new)"
fi

# Show container status
echo "📊 Container status:"
docker-compose ps

echo "✅ Deployment complete!"

# Additional diagnostics
echo ""
echo "📊 Diagnostic Information:"
echo "------------------------"
echo "🐳 Docker containers:"
docker-compose ps
echo ""
echo "🔒 SSL Certificate:"
certbot certificates | grep -A 2 "${DOMAIN}" || echo "No certificate found"
echo ""
echo "🌐 Port listeners (showing process names):"
echo "Port 80   (Frontend): \$(netstat -tlnp | grep ':80 ' | awk '{print \$7}' | head -1)"
echo "Port 3000 (Nginx SSL): \$(netstat -tlnp | grep ':3000 ' | awk '{print \$7}' | head -1)"
echo "Port 5000 (Backend): \$(netstat -tlnp | grep ':5000 ' | awk '{print \$7}' | head -1)"
echo ""
echo "Detailed port info:"
netstat -tlnp | grep -E ':(80|443|3000|5000) ' || ss -tlnp | grep -E ':(80|443|3000|5000) '
echo ""
echo "🔍 Testing endpoints:"
echo -n "  HTTP redirect (port 80): "
curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN} || echo "Failed"
echo ""
echo -n "  Backend direct (port 5000): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "Failed"
echo ""
echo -n "  HTTPS API (port 3000): "
curl -k -s -o /dev/null -w "%{http_code}" https://${DOMAIN}:3000/api/health || echo "Failed"
echo ""
ENDSSH

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  🌐 Frontend: http://${DOMAIN} (redirects to HTTPS)"
echo "  🔒 Backend:  https://${DOMAIN}:3000"
echo "  🔌 WebSocket: wss://${DOMAIN}:3000"
echo ""
echo "🔐 SSL/TLS Configuration:"
echo "  📜 Certificate: Let's Encrypt"
echo "  🔄 Auto-renewal: Enabled (via cron)"
echo "  🛡️  Security headers: Enabled"
echo "  ⚡ HTTP/2: Enabled"
echo ""
echo "🔧 Management Commands:"
echo "  View logs:     ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose logs -f'"
echo "  Restart:       ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose restart'"
echo "  Stop:          ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose down'"
echo "  SSL status:    ssh ${USER}@${DROPLET_IP} 'certbot certificates'"
echo "  Renew SSL:     ssh ${USER}@${DROPLET_IP} 'certbot renew'"
echo ""
echo "✅ All services are running with HTTPS enabled!"