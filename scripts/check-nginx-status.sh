#!/bin/bash

# Check current Nginx status and configuration
echo "🔍 Checking Nginx and port status..."

echo ""
echo "📊 Current port listeners:"
netstat -tlnp | grep -E ':(80|443|3000|5000|8080) ' 2>/dev/null || ss -tlnp | grep -E ':(80|443|3000|5000|8080) '

echo ""
echo "🔧 Nginx configuration test:"
nginx -t

echo ""
echo "📄 Active Nginx sites:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "🔍 Checking if port 443 is configured in Nginx:"
grep -n "listen 443" /etc/nginx/sites-available/backend-ssl 2>/dev/null || echo "Port 443 not found in config"

echo ""
echo "🌐 Testing endpoints:"
echo -n "HTTP (80): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost || echo "Failed"

echo -n "HTTPS (443): "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost || echo "Failed"

echo -n "API HTTPS (3000): "
curl -k -s -o /dev/null -w "%{http_code}\n" https://localhost:3000/api/health || echo "Failed"

echo ""
echo "🔒 Nginx process status:"
ps aux | grep nginx | grep -v grep

echo ""
echo "📝 Nginx error log (last 10 lines):"
tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"