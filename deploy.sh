#!/bin/bash

# Deployment script for AI Booking Assistant

DROPLET_IP="24.199.110.244"
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
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://${DROPLET_IP}
GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}

# Frontend (for docker-compose)
VITE_API_URL=http://${DROPLET_IP}:3000
VITE_WEBSOCKET_URL=ws://${DROPLET_IP}:3000
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
echo "🌐 Frontend: http://${DROPLET_IP}"
echo "🔌 Backend API: http://${DROPLET_IP}:3000"
echo ""
echo "📝 To view logs:"
echo "  ssh ${USER}@${DROPLET_IP} 'cd ${APP_DIR} && docker-compose logs -f'"