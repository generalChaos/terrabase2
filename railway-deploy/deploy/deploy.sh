#!/bin/bash

# Image Processor API Deployment Script
# This script helps deploy the Python Image API to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="image-processor"
DOCKER_IMAGE="image-processor-api"
VERSION=${1:-"latest"}

echo -e "${BLUE}🚀 Image Processor API Deployment Script${NC}"
echo -e "${BLUE}=======================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Build Docker image
build_image() {
    print_info "Building Docker image: $DOCKER_IMAGE:$VERSION"
    
    cd "$(dirname "$0")/.."
    
    docker build -t $DOCKER_IMAGE:$VERSION .
    
    if [ $? -eq 0 ]; then
        print_status "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    cd "$(dirname "$0")/.."
    
    # Run tests in Docker container
    docker run --rm -v $(pwd):/app -w /app $DOCKER_IMAGE:$VERSION python -m pytest tests/ -v
    
    if [ $? -eq 0 ]; then
        print_status "All tests passed"
    else
        print_warning "Some tests failed, but continuing with deployment"
    fi
}

# Deploy with Docker Compose
deploy_compose() {
    print_info "Deploying with Docker Compose..."
    
    cd "$(dirname "$0")"
    
    # Check if .env file exists
    if [ ! -f "../.env" ]; then
        print_warning ".env file not found, creating from example..."
        cp ../env.example ../.env
        print_warning "Please update .env file with your configuration before continuing"
        read -p "Press Enter to continue after updating .env file..."
    fi
    
    # Deploy
    docker-compose -f docker-compose.prod.yml up -d
    
    if [ $? -eq 0 ]; then
        print_status "Deployed successfully with Docker Compose"
        print_info "API available at: http://localhost:8000"
        print_info "Health check: http://localhost:8000/health"
        print_info "API docs: http://localhost:8000/docs"
    else
        print_error "Failed to deploy with Docker Compose"
        exit 1
    fi
}

# Deploy to Railway
deploy_railway() {
    print_info "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
        print_info "Please log in to Railway first:"
        railway login
    fi
    
    # Deploy
    railway up
    
    if [ $? -eq 0 ]; then
        print_status "Deployed successfully to Railway"
        print_info "Check your Railway dashboard for the deployment URL"
    else
        print_error "Failed to deploy to Railway"
        exit 1
    fi
}

# Health check
health_check() {
    print_info "Performing health check..."
    
    # Wait a bit for the service to start
    sleep 10
    
    # Try to reach the health endpoint
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "Health check passed"
    else
        print_warning "Health check failed - service may still be starting"
    fi
}

# Show logs
show_logs() {
    print_info "Showing service logs..."
    docker-compose -f deploy/docker-compose.prod.yml logs -f image-processor
}

# Stop services
stop_services() {
    print_info "Stopping services..."
    docker-compose -f deploy/docker-compose.prod.yml down
    print_status "Services stopped"
}

# Clean up
cleanup() {
    print_info "Cleaning up..."
    docker system prune -f
    print_status "Cleanup completed"
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment option:"
    echo "1) Build Docker image only"
    echo "2) Run tests"
    echo "3) Deploy with Docker Compose (local)"
    echo "4) Deploy to Railway"
    echo "5) Health check"
    echo "6) Show logs"
    echo "7) Stop services"
    echo "8) Cleanup"
    echo "9) Full deployment (build + test + deploy)"
    echo "0) Exit"
    echo ""
}

# Main execution
main() {
    check_docker
    
    if [ $# -eq 0 ]; then
        show_menu
        read -p "Enter your choice (0-9): " choice
        
        case $choice in
            1) build_image ;;
            2) run_tests ;;
            3) deploy_compose ;;
            4) deploy_railway ;;
            5) health_check ;;
            6) show_logs ;;
            7) stop_services ;;
            8) cleanup ;;
            9) build_image && run_tests && deploy_compose && health_check ;;
            0) exit 0 ;;
            *) print_error "Invalid option" && exit 1 ;;
        esac
    else
        case $1 in
            "build") build_image ;;
            "test") run_tests ;;
            "deploy") deploy_compose ;;
            "railway") deploy_railway ;;
            "health") health_check ;;
            "logs") show_logs ;;
            "stop") stop_services ;;
            "cleanup") cleanup ;;
            "full") build_image && run_tests && deploy_compose && health_check ;;
            *) print_error "Unknown command: $1" && exit 1 ;;
        esac
    fi
}

# Run main function
main "$@"
