# Manual CORS Fix Commands

Run these commands on your server to fix the CORS issue:

```bash
# SSH into server
ssh root@24.199.110.244

# Navigate to project directory
cd /opt/ai-booking-assistant

# Pull latest changes
git pull origin main

# Stop Nginx
systemctl stop nginx

# Copy updated nginx config
cp nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl

# Test configuration
nginx -t

# Start Nginx
systemctl start nginx

# Test CORS
curl -H 'Origin: http://localhost:3002' -I https://ai.zackz.net:3000/api/health
```

You should see a response with:
```
Access-Control-Allow-Origin: http://localhost:3002
```

After running these commands, try your Google OAuth login again from localhost:3002 - the CORS error should be resolved!