#!/bin/bash
set -e

# SSL/TLS Setup Script for Backend
# This script sets up Let's Encrypt SSL certificates and configures Nginx

echo "🔒 Starting SSL/TLS Setup for Backend..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Variables
DOMAIN="ai.zackz.net"
EMAIL="your-email@example.com"  # Change this to your email

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Stop Nginx temporarily for certificate generation
echo "🛑 Stopping Nginx..."
systemctl stop nginx

# Generate Let's Encrypt certificate
echo "🔐 Generating SSL certificate..."
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    --pre-hook "systemctl stop nginx" \
    --post-hook "systemctl start nginx"

# Copy Nginx configuration
echo "📝 Setting up Nginx configuration..."
cp /opt/ai-booking-assistant/nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/

# Remove default Nginx site if exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "✅ Testing Nginx configuration..."
nginx -t

# Start and enable Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates twice daily
0 0,12 * * * root certbot renew --quiet --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"
EOF

# Update firewall rules
echo "🔥 Updating firewall rules..."
ufw allow 'Nginx Full'
ufw allow 3000/tcp
ufw --force enable

echo "✅ SSL/TLS setup complete!"
echo ""
echo "🔒 Your backend is now accessible via:"
echo "   - HTTPS: https://ai.zackz.net:3000"
echo "   - WSS: wss://ai.zackz.net:3000"
echo ""
echo "📝 Certificate will auto-renew via cron job"
echo ""
echo "⚠️  Make sure to:"
echo "   1. Update your DNS to point to this server"
echo "   2. Update backend to listen on localhost:5000 (not 0.0.0.0:3000)"
echo "   3. Restart your Docker containers"