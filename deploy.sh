#!/bin/bash

# Trip Booking Assistant - Deployment Options
# Choose the deployment script that fits your needs

echo "🚀 Trip Booking Assistant - Deployment Options"
echo ""
echo "Available deployment scripts:"
echo ""
echo "1. 📦 Full Deployment (Frontend + Backend + Infrastructure)"
echo "   ./deploy-full.sh"
echo "   • Deploys complete application with SSL/HTTPS"
echo "   • Sets up Nginx, certificates, and all services"
echo "   • Use for initial deployment or complete updates"
echo ""
echo "2. ⚙️  Backend Only Deployment"
echo "   ./deploy-backend.sh"
echo "   • Deploys only the backend API service"
echo "   • Updates backend code and restarts service"
echo "   • Use when only backend code has changed"
echo ""
echo "3. 🎨 Frontend Only Deployment"
echo "   ./deploy-frontend.sh"
echo "   • Deploys only the frontend web application"
echo "   • Updates frontend code and rebuilds static assets"
echo "   • Use when only frontend code has changed"
echo ""
echo "📋 Required Environment Variables:"
echo "   export GOOGLE_GEMINI_API_KEY=your_gemini_api_key"
echo "   export GOOGLE_CLIENT_ID=your_google_client_id"
echo "   export GOOGLE_CLIENT_SECRET=your_google_client_secret"
echo ""
echo "💡 Quick Start:"
echo "   # For first-time deployment:"
echo "   ./deploy-full.sh"
echo ""
echo "   # For backend updates only:"
echo "   ./deploy-backend.sh"
echo ""
echo "   # For frontend updates only:"
echo "   ./deploy-frontend.sh"
echo ""

# Check if user wants to run a deployment
echo "Would you like to run a deployment now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Which deployment would you like to run?"
    echo "1) Full deployment"
    echo "2) Backend only"
    echo "3) Frontend only"
    echo ""
    read -p "Enter your choice (1-3): " choice

    case $choice in
        1)
            echo "🚀 Running full deployment..."
            ./deploy-full.sh
            ;;
        2)
            echo "⚙️ Running backend deployment..."
            ./deploy-backend.sh
            ;;
        3)
            echo "🎨 Running frontend deployment..."
            ./deploy-frontend.sh
            ;;
        *)
            echo "❌ Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
else
    echo "👍 No deployment initiated. Run the individual scripts when ready."
fi