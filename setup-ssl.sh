#!/bin/bash

# SSL Setup Script for ai.zackz.net

DOMAIN="ai.zackz.net"
EMAIL="your-email@example.com"  # Replace with your email
DROPLET_IP="24.199.110.244"
USER="root"

echo "🔐 Setting up SSL certificates for ${DOMAIN}..."

# SSH into the server and set up SSL
ssh ${USER}@${DROPLET_IP} << 'ENDSSH'
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop any running services on port 80
echo "🛑 Stopping services to free up port 80..."
docker-compose -f /opt/ai-booking-assistant/docker-compose.yml down

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    -d ${DOMAIN} \
    -d www.${DOMAIN}

# Create nginx configuration directory if it doesn't exist
mkdir -p /opt/ai-booking-assistant/nginx

# Copy the SSL nginx configuration
cp /opt/ai-booking-assistant/nginx-ssl.conf /opt/ai-booking-assistant/nginx/default.conf

# Update docker-compose to use port 443
cd /opt/ai-booking-assistant

# Create a docker-compose override for SSL
cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: ai-booking-nginx
    ports:
      - "80:80"
      - "443:443"
      - "3000:3000"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - ai-booking-network
EOF

# Start services with SSL
echo "🚀 Starting services with SSL..."
docker-compose up -d

# Set up auto-renewal
echo "⏰ Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --post-hook 'docker restart ai-booking-nginx'") | crontab -

echo "✅ SSL setup complete!"
ENDSSH

echo "🎉 SSL configuration successful!"
echo "🌐 Your site is now accessible at:"
echo "   - https://${DOMAIN}"
echo "   - https://${DOMAIN}:3000 (API)"
echo ""
echo "📝 Note: Make sure to update your email in this script before running!"