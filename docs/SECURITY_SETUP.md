# Security Configuration Guide

This guide explains the security configurations needed for the Trip Booking Assistant application.

## JWT_SECRET Configuration

### What is JWT_SECRET?
The `JWT_SECRET` is a cryptographic key used to sign and verify JSON Web Tokens (JWTs) for user authentication. It ensures that:
- Only your server can create valid authentication tokens
- Tokens cannot be tampered with
- User sessions are secure

### Security Requirements
- **Minimum length**: 32 characters
- **Character set**: Random alphanumeric and special characters
- **Uniqueness**: Different for each environment (dev, staging, production)
- **Storage**: Never commit to version control

### How to Generate JWT_SECRET

#### Method 1: Using OpenSSL (Recommended)
```bash
# Generate a 32-byte base64-encoded secret
openssl rand -base64 32

# Generate a 64-byte base64-encoded secret (more secure)
openssl rand -base64 64
```

#### Method 2: Using Node.js
```bash
# Run this in your terminal
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Method 3: Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Setting Up JWT_SECRET

#### For Local Development
1. Generate a new secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update `/backend/.env`:
   ```env
   JWT_SECRET=your-generated-secret-here
   JWT_EXPIRES_IN=24h
   ```

#### For Production (Automatic)
The deployment script automatically generates a secure JWT_SECRET:
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

You don't need to do anything - it's handled automatically during deployment.

#### For Manual Production Setup
If setting up manually:
```bash
# Generate production secret
PROD_JWT_SECRET=$(openssl rand -base64 64)

# Set on server
export JWT_SECRET=$PROD_JWT_SECRET
```

## Other Security Configurations

### 1. Session Secret
Used for session management (if using sessions):
```env
SESSION_SECRET=$(openssl rand -base64 32)
```

### 2. Database Passwords
For production databases:
```bash
# Generate strong database password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
```

### 3. API Keys Security
- Store in environment variables
- Use different keys for each environment
- Rotate regularly
- Monitor usage

## Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env files
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Use .env.example for templates
cp .env .env.example
# Then remove actual secrets from .env.example
```

### 2. Secret Rotation
Rotate secrets periodically:
- JWT_SECRET: Every 3-6 months
- Database passwords: Every 6-12 months
- API keys: Based on provider recommendations

### 3. Environment Separation
Use different secrets for each environment:
```bash
# Development
JWT_SECRET=dev-secret-only-for-local-development

# Staging
JWT_SECRET=staging-secret-different-from-dev

# Production
JWT_SECRET=production-secret-highly-secure
```

### 4. Secret Storage for Production
Options for production secret management:
1. **Environment Variables**: Set on server directly
2. **Digital Ocean Secrets**: Use DO's secret management
3. **HashiCorp Vault**: For enterprise deployments
4. **AWS Secrets Manager**: If using AWS

## Verification

### Check JWT Token Generation
```bash
# Test if JWT is working correctly
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

### Verify Token
```bash
# The response should include a token
# You can decode it at https://jwt.io to verify structure
```

## Common Issues

### 1. "Invalid Token" Errors
- Ensure JWT_SECRET is the same across all instances
- Check if token has expired (see JWT_EXPIRES_IN)
- Verify token format in Authorization header: `Bearer <token>`

### 2. "Token Expired" Errors
- Adjust JWT_EXPIRES_IN for longer sessions
- Implement refresh token mechanism (P1 feature)

### 3. Server Restart Issues
- JWT_SECRET must remain constant
- Use environment variables, not hardcoded values

## Security Checklist

- [ ] Generated unique JWT_SECRET for production
- [ ] JWT_SECRET is at least 32 characters
- [ ] JWT_SECRET is stored as environment variable
- [ ] Different secrets for dev/staging/production
- [ ] .env files are in .gitignore
- [ ] Regular secret rotation schedule
- [ ] Monitoring for suspicious authentication attempts
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Rate limiting enabled

## Example .env Configuration

```env
# Authentication
JWT_SECRET=fgiRBWoo6Or5OtxkyZEk7pE9XyeikU3Z4FeD5u+yshM=
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=another-random-secret-here
COOKIE_SECRET=yet-another-random-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Resources
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)