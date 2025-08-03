#!/bin/bash

# Deployment script for AI Booking Assistant

DROPLET_IP="24.199.110.244"
DOMAIN="ai.zackz.net"
USER="root"
APP_DIR="/opt/ai-booking-assistant"
GITHUB_REPO="https://github.com/zack191137/ai-trip-booking-assistant"

echo "🚀 Starting deployment to DigitalOcean droplet..."

# Check if GOOGLE_GEMINI_API_KEY is set
if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
    echo "❌ Error: GOOGLE_GEMINI_API_KEY environment variable is not set"
    echo "Please set it before running: export GOOGLE_GEMINI_API_KEY=your_key_here"
    exit 1
fi

# Check if GOOGLE_CLIENT_ID is set (optional but recommended)
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "⚠️  Warning: GOOGLE_CLIENT_ID environment variable is not set"
    echo "Google OAuth login will not work without it"
    echo "Set it with: export GOOGLE_CLIENT_ID=your_client_id_here"
    echo "Continuing with placeholder value..."
fi

# Check if GOOGLE_CLIENT_SECRET is set (optional but recommended)
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  Warning: GOOGLE_CLIENT_SECRET environment variable is not set"
    echo "Google OAuth login will not work without it"
    echo "Set it with: export GOOGLE_CLIENT_SECRET=your_client_secret_here"
    echo "Continuing with placeholder value..."
fi

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
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-your_google_client_id_here}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-your_google_client_secret_here}
GOOGLE_CALLBACK_URL=https://${DOMAIN}:3000/api/auth/google/callback

# Frontend (for docker-compose)
VITE_API_URL=https://${DOMAIN}:3000
VITE_WEBSOCKET_URL=wss://${DOMAIN}:3000
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-your_google_client_id_here}
EOF

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 3000/tcp
ufw --force enable

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

echo "✅ Deployment complete!"
ENDSSH

echo "🎉 Deployment successful!"
echo "🌐 Frontend: https://${DOMAIN}"
echo "🔌 Backend API: https://${DOMAIN}:3000"
echo ""
echo "📝 To view logs:"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose logs -f'"