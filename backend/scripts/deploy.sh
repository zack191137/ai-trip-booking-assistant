#!/bin/bash

# Trip Booking Assistant - Deployment Script
# This script handles deployment to staging and production environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed."; exit 1; }
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
        log_error "Environment file .env.$ENVIRONMENT not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker image
    docker build -t "trip-booking-backend:$VERSION" .
    
    log_success "Application built successfully"
}

# Deploy to environment
deploy_to_environment() {
    log_info "Deploying to $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" .env
    
    # Deploy based on environment
    case $ENVIRONMENT in
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
    esac
    
    log_success "Deployment to $ENVIRONMENT completed"
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Use docker-compose for staging
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Run health check
    health_check "http://localhost:3001/api/health"
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production environment..."
    
    # Use docker-compose for production with all services
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    sleep 60
    
    # Run health check
    health_check "http://localhost:3000/api/health"
    
    # Run database migrations if needed
    # docker-compose exec app npm run migrate
}

# Health check
health_check() {
    local url=$1
    local max_attempts=10
    local attempt=1
    
    log_info "Running health check..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_warning "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Backup data (for production)
backup_data() {
    if [[ $ENVIRONMENT == "production" ]]; then
        log_info "Creating backup..."
        
        # Create backup directory
        BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database (if using PostgreSQL)
        # docker-compose exec postgres pg_dump -U postgres tripbooking > "$BACKUP_DIR/database.sql"
        
        # Backup uploaded files
        # docker cp $(docker-compose ps -q app):/app/uploads "$BACKUP_DIR/uploads"
        
        log_success "Backup created at $BACKUP_DIR"
    fi
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current containers
    docker-compose down
    
    # Start previous version (this would need more sophisticated version management)
    log_info "Manual rollback required - check previous container versions"
    
    exit 1
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images "trip-booking-backend" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi
    
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    validate_environment
    check_prerequisites
    
    # Create backup for production
    backup_data
    
    # Build and deploy
    build_application
    deploy_to_environment
    
    # Cleanup
    cleanup
    
    log_success "Deployment completed successfully!"
    
    # Show useful information
    echo ""
    log_info "Deployment Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Version: $VERSION"
    echo "  Health Check: $(curl -s "http://localhost:300$([ "$ENVIRONMENT" = "staging" ] && echo "1" || echo "0")/api/health" | jq -r '.data.status' 2>/dev/null || echo "Unknown")"
    echo ""
    log_info "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Check status: docker-compose ps"
    echo "  Stop services: docker-compose down"
}

# Handle script interruption
trap rollback INT TERM

# Run main function
main "$@"