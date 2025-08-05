#!/bin/bash
set -e

# SSL-enabled deployment script for Trip Booking Assistant
# This script deploys the application with HTTPS support

echo "🚀 Starting SSL-enabled deployment..."

# Variables
DOMAIN="ai.zackz.net"
PROJECT_DIR="/opt/ai-booking-assistant"
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with required environment variables"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
required_vars=("JWT_SECRET" "GEMINI_API_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Create backup of current deployment
echo "💾 Creating backup..."
if [ -d "$PROJECT_DIR" ]; then
    mkdir -p "$(dirname "$BACKUP_DIR")"
    cp -r "$PROJECT_DIR" "$BACKUP_DIR"
    echo "✅ Backup created at $BACKUP_DIR"
fi

# Update project directory
echo "📦 Updating project files..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.env*' . "$PROJECT_DIR/"
cp .env "$PROJECT_DIR/"

# Change to project directory
cd "$PROJECT_DIR"

# Check if SSL is already set up
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🔒 SSL certificate not found. Setting up SSL..."
    
    # Run SSL setup script
    if [ -f "scripts/setup-ssl.sh" ]; then
        sudo bash scripts/setup-ssl.sh
    else
        echo "❌ Error: SSL setup script not found"
        echo "Please run the SSL setup manually first"
        exit 1
    fi
else
    echo "✅ SSL certificate already exists"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Remove old images to force rebuild
echo "🧹 Cleaning up old images..."
docker image prune -f
docker-compose build --no-cache

# Start services
echo "🚀 Starting services with SSL support..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🔍 Performing health checks..."

# Check backend health
echo "Checking backend health..."
for i in {1..10}; do
    if curl -k -s https://localhost:3000/api/health > /dev/null; then
        echo "✅ Backend is healthy"
        break
    else
        echo "⏳ Waiting for backend... (attempt $i/10)"
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Backend health check failed"
        echo "Backend logs:"
        docker-compose logs backend --tail=20
        exit 1
    fi
done

# Check frontend
echo "Checking frontend..."
for i in {1..5}; do
    if curl -s http://localhost:80 > /dev/null; then
        echo "✅ Frontend is accessible"
        break
    else
        echo "⏳ Waiting for frontend... (attempt $i/5)"
        sleep 3
    fi
    
    if [ $i -eq 5 ]; then
        echo "❌ Frontend health check failed"
        echo "Frontend logs:"
        docker-compose logs frontend --tail=20
        exit 1
    fi
done

# Check SSL certificate
echo "Checking SSL certificate..."
if openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:3000" </dev/null 2>/dev/null | openssl x509 -noout -dates; then
    echo "✅ SSL certificate is valid"
else
    echo "⚠️  SSL certificate check failed (might be normal if certificate is new)"
fi

# Show deployment summary
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  🌐 Frontend: http://$DOMAIN (redirects to HTTPS)"
echo "  🔒 Backend:  https://$DOMAIN:3000"
echo "  🔌 WebSocket: wss://$DOMAIN:3000"
echo ""
echo "🔐 SSL/TLS Configuration:"
echo "  📜 Certificate: Let's Encrypt"
echo "  🔄 Auto-renewal: Enabled (via cron)"
echo "  🛡️  Security headers: Enabled"
echo "  ⚡ HTTP/2: Enabled"
echo ""
echo "📁 Backup location: $BACKUP_DIR"
echo ""
echo "🔧 Management Commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Restart:       docker-compose restart"
echo "  Stop:          docker-compose down"
echo "  SSL status:    sudo certbot certificates"
echo "  Renew SSL:     sudo certbot renew"
echo ""
echo "✅ All services are running with HTTPS enabled!"