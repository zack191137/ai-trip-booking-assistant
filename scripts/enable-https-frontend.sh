#!/bin/bash
set -e

# Enable HTTPS frontend on port 443
echo "🔧 Enabling HTTPS frontend..."

cd /opt/ai-booking-assistant

# Stop Nginx temporarily
echo "🛑 Stopping Nginx..."
systemctl stop nginx

# Pull latest configuration
echo "📥 Pulling latest changes..."
git pull origin main

# Ensure the Nginx config has port 443
echo "📝 Checking Nginx configuration..."
if ! grep -q "listen 443" /etc/nginx/sites-available/backend-ssl; then
    echo "⚠️ Port 443 not found in config, updating..."
    
    # Remove old config
    rm -f /etc/nginx/sites-available/backend-ssl
    rm -f /etc/nginx/sites-enabled/backend-ssl
    
    # Copy fresh config
    cp nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
    ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/
fi

# Fix the root redirect on port 3000
echo "🔧 Fixing API root redirect..."
# This is already in the nginx config, but let's ensure it's there
sed -i '/location = \/ {/,/}/d' /etc/nginx/sites-available/backend-ssl || true
sed -i '/location \/health {/a\
\
    # Root location - redirect to /api\
    location = / {\
        return 301 /api;\
    }' /etc/nginx/sites-available/backend-ssl

# Test configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Start Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl reload nginx

# Show current listeners
echo ""
echo "📊 Current port listeners:"
netstat -tlnp | grep -E 'nginx|:(80|443|3000) '

# Test endpoints
echo ""
echo "🔍 Testing endpoints:"
echo -n "HTTP (80): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost

echo -n "HTTPS (443): "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost

echo -n "API Health (3000): "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:3000/api/health

echo -n "API Root redirect (3000): "
curl -k -s -I https://localhost:3000/ | grep -i location || echo "No redirect"

echo ""
echo "✅ HTTPS frontend should now be available at:"
echo "  - https://ai.zackz.net (port 443)"
echo "  - https://ai.zackz.net:3000/api (API)"
echo ""
echo "📝 Note: wss://ai.zackz.net:3000 is for WebSocket connections only"
echo "    It cannot be accessed directly in a browser"