# SSL/TLS Setup Guide

This guide explains how to set up SSL/TLS for the Trip Booking Assistant backend using Nginx as a reverse proxy.

## Overview

The setup uses:
- **Nginx** as a reverse proxy to handle SSL termination
- **Let's Encrypt** for free SSL certificates
- **Certbot** for automatic certificate management
- Port configuration:
  - Backend internally: `localhost:5000`
  - Nginx HTTPS: `ai.zackz.net:3000`
  - HTTP redirects to HTTPS

## Prerequisites

1. **Domain**: Ensure `ai.zackz.net` points to your server's IP
2. **Ports**: Open ports 80, 443, and 3000 in your firewall
3. **Root access**: Required for certificate generation and Nginx setup

## Quick Setup

Run the automated setup script:

```bash
sudo bash /opt/ai-booking-assistant/scripts/setup-ssl.sh
```

## Manual Setup Steps

### 1. Update Backend Configuration

Update `docker-compose.yml` to make backend listen on port 5000 internally:

```yaml
services:
  backend:
    ports:
      - "5000:3000"  # Map internal 3000 to host 5000
    environment:
      - PORT=3000
      - HOST=0.0.0.0
```

### 2. Install Required Packages

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3. Generate SSL Certificate

```bash
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com \
    -d ai.zackz.net \
    --pre-hook "systemctl stop nginx" \
    --post-hook "systemctl start nginx"
```

### 4. Configure Nginx

Copy the Nginx configuration:

```bash
sudo cp /opt/ai-booking-assistant/nginx/backend-ssl.conf /etc/nginx/sites-available/backend-ssl
sudo ln -sf /etc/nginx/sites-available/backend-ssl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 5. Test and Start Nginx

```bash
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Set Up Auto-Renewal

Add to crontab:

```bash
0 0,12 * * * certbot renew --quiet --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"
```

## Update Application Configuration

### Frontend Environment

Update `.env.local` and production environment:

```env
VITE_API_BASE_URL=https://ai.zackz.net:3000/api
VITE_WS_URL=wss://ai.zackz.net:3000
```

### Backend CORS

Update backend environment to include HTTPS origins:

```env
ALLOWED_ORIGINS=https://ai.zackz.net,https://localhost:3002
FRONTEND_URL=https://ai.zackz.net
```

## Verification

1. **Check certificate**:
   ```bash
   sudo certbot certificates
   ```

2. **Test HTTPS**:
   ```bash
   curl https://ai.zackz.net:3000/api/health
   ```

3. **Check WebSocket**:
   ```bash
   wscat -c wss://ai.zackz.net:3000
   ```

## Troubleshooting

### Certificate Generation Fails
- Ensure port 80 is open and not in use
- Verify DNS is pointing to correct IP
- Check firewall rules

### 502 Bad Gateway
- Ensure backend is running on localhost:5000
- Check Docker container logs
- Verify Nginx upstream configuration

### WebSocket Connection Failed
- Check Nginx WebSocket headers
- Ensure Socket.IO path matches configuration
- Verify CORS allows WebSocket origin

### SSL Certificate Renewal
- Test renewal: `sudo certbot renew --dry-run`
- Check cron logs: `sudo journalctl -u crond`
- Manual renewal: `sudo certbot renew`

## Security Considerations

1. **SSL Configuration**:
   - Only TLS 1.2 and 1.3 enabled
   - Strong cipher suites
   - HSTS enabled with 1-year max-age

2. **Rate Limiting**:
   - API: 10 requests/second
   - Auth endpoints: 5 requests/minute

3. **Headers**:
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection enabled

## Monitoring

1. **Certificate expiry**:
   ```bash
   echo | openssl s_client -servername ai.zackz.net -connect ai.zackz.net:3000 2>/dev/null | openssl x509 -noout -dates
   ```

2. **Nginx logs**:
   - Access: `/var/log/nginx/access.log`
   - Error: `/var/log/nginx/error.log`

3. **Let's Encrypt logs**:
   - `/var/log/letsencrypt/letsencrypt.log`