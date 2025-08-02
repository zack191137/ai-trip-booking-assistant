#!/bin/bash

# Deployment script for AI Booking Assistant

DROPLET_IP="24.199.110.244"
USER="root"
APP_DIR="/opt/ai-booking-assistant"

echo "🚀 Starting deployment to DigitalOcean droplet..."

# Create .env file with production values
cat > .env.production << EOF
JWT_SECRET=$(openssl rand -base64 32)
GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}
NODE_ENV=production
EOF

echo "📦 Creating deployment archive..."
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='coverage' \
  --exclude='*.log' \
  .

echo "📤 Uploading to server..."
scp deploy.tar.gz .env.production ${USER}@${DROPLET_IP}:/tmp/

echo "🔧 Setting up application on server..."
ssh ${USER}@${DROPLET_IP} << 'ENDSSH'
# Update system
apt-get update && apt-get upgrade -y

# Install Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
mkdir -p /opt/ai-booking-assistant
cd /opt/ai-booking-assistant

# Extract files
tar -xzf /tmp/deploy.tar.gz
cp /tmp/.env.production .env

# Build and start containers
docker-compose down
docker-compose build
docker-compose up -d

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 3000/tcp
ufw --force enable

# Clean up
rm /tmp/deploy.tar.gz /tmp/.env.production

echo "✅ Deployment complete!"
ENDSSH

# Clean up local files
rm deploy.tar.gz .env.production

echo "🎉 Deployment successful!"
echo "🌐 Frontend: http://${DROPLET_IP}"
echo "🔌 Backend API: http://${DROPLET_IP}:3000"