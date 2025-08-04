# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source files (exclude unnecessary files)
COPY src ./src
COPY public ./public
COPY index.html tsconfig*.json vite.config.ts ./

# Build arguments for environment variables
ARG VITE_API_BASE_URL=http://ai.zackz.net:3000/api
ARG VITE_WS_URL=ws://ai.zackz.net:3000
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_ENVIRONMENT=production

# Set environment variables for build
ENV VITE_API_BASE_URL="$VITE_API_BASE_URL"
ENV VITE_WS_URL="$VITE_WS_URL"
ENV VITE_GOOGLE_CLIENT_ID="$VITE_GOOGLE_CLIENT_ID"
ENV VITE_ENVIRONMENT="$VITE_ENVIRONMENT"

# Debug: Show environment variables
RUN echo "=== Environment Variables ===" && \
    echo "VITE_API_BASE_URL='$VITE_API_BASE_URL'" && \
    echo "VITE_WS_URL='$VITE_WS_URL'" && \
    echo "VITE_GOOGLE_CLIENT_ID='$VITE_GOOGLE_CLIENT_ID'" && \
    echo "VITE_ENVIRONMENT='$VITE_ENVIRONMENT'" && \
    echo "Length of VITE_GOOGLE_CLIENT_ID: $(echo -n "$VITE_GOOGLE_CLIENT_ID" | wc -c)"

# Build the application (skip TypeScript check for faster builds)
RUN npm run build:fast

# Production stage - using nginx to serve static files
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]