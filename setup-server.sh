#!/bin/bash

# Server setup script for AI Booking Assistant
# Run this on the DigitalOcean droplet

set -e

echo "🚀 Setting up AI Booking Assistant server..."

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx

# Install Node.js 18
echo "📗 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo "🔄 Installing PM2..."
npm install -g pm2

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /opt/ai-booking-assistant

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/ai-booking-assistant"
echo "2. Create .env file with your environment variables"
echo "3. Run docker-compose up -d"
echo ""
echo "Example commands:"
echo "  cd /opt/ai-booking-assistant"
echo "  git clone https://github.com/zack191137/ai-trip-booking-assistant.git ."
echo "  cp .env.example .env"
echo "  # Edit .env with your values"
echo "  docker-compose up -d"