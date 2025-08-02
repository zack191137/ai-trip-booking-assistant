#!/bin/bash

# Fix deployment issues script

DROPLET_IP="24.199.110.244"
USER="root"
APP_DIR="/opt/ai-booking-assistant"
GITHUB_REPO="https://github.com/zack191137/ai-trip-booking-assistant.git"

# Your Gemini API key
GOOGLE_GEMINI_API_KEY="AIzaSyCcvVh04gJVc2wU_kV8CUqOZGAyZrBXi6o"

echo "🔧 Fixing deployment issues..."

ssh ${USER}@${DROPLET_IP} << ENDSSH
# Ensure system is updated
apt-get update -y

# Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# Install Docker Compose if missing
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Git if missing
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi

# Clone or update repository
if [ ! -d "${APP_DIR}" ]; then
    echo "📥 Cloning repository..."
    git clone ${GITHUB_REPO} ${APP_DIR}
fi

cd ${APP_DIR}

# Pull latest changes
git pull origin main

# Create proper .env file
echo "🔐 Creating environment configuration..."
cat > .env << 'EOF'
# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=\$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://${DROPLET_IP}
GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}

# Frontend (for docker-compose)
VITE_API_URL=http://${DROPLET_IP}:3000
VITE_WEBSOCKET_URL=ws://${DROPLET_IP}:3000
EOF

# Stop any existing containers
docker-compose down

# Remove old containers and images
docker system prune -af

# Build fresh images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services
sleep 15

# Check status
echo "📊 Container status:"
docker-compose ps

# Check logs
echo "📝 Recent logs:"
docker-compose logs --tail=50

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 3000/tcp
ufw --force enable

# Check listening ports
echo "🔌 Listening ports:"
netstat -tlnp | grep -E ':(80|3000)'

echo "✅ Fix deployment complete!"
ENDSSH

echo ""
echo "🎉 Deployment fix attempted!"
echo "🌐 Try accessing:"
echo "   Frontend: http://${DROPLET_IP}"
echo "   Backend API: http://${DROPLET_IP}:3000/api/health"