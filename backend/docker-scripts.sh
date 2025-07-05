#!/bin/bash

# Docker scripts for Loggerhead Backend
# Usage: ./docker-scripts.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build production image
build_production() {
    print_status "Building production Docker image..."
    docker build -t loggerhead-backend:latest .
    print_success "Production image built successfully!"
}

# Function to build development image
build_development() {
    print_status "Building development Docker image..."
    docker build -f Dockerfile.dev -t loggerhead-backend:dev .
    print_success "Development image built successfully!"
}

# Function to run production container
run_production() {
    print_status "Starting production container..."
    docker-compose up -d
    print_success "Production container started!"
    print_status "Backend is running at http://localhost:3000"
}

# Function to run development container
run_development() {
    print_status "Starting development container..."
    docker-compose -f docker-compose.dev.yml up -d
    print_success "Development container started!"
    print_status "Backend is running at http://localhost:3000"
}

# Function to stop containers
stop_containers() {
    print_status "Stopping containers..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    print_success "Containers stopped!"
}

# Function to view logs
view_logs() {
    print_status "Showing logs..."
    docker-compose logs -f backend
}

# Function to view development logs
view_dev_logs() {
    print_status "Showing development logs..."
    docker-compose -f docker-compose.dev.yml logs -f backend-dev
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
    docker system prune -f
    print_success "Cleanup completed!"
}

# Function to check container status
status() {
    print_status "Checking container status..."
    echo "Production containers:"
    docker-compose ps
    echo ""
    echo "Development containers:"
    docker-compose -f docker-compose.dev.yml ps
}

# Function to restart containers
restart() {
    print_status "Restarting containers..."
    docker-compose restart
    print_success "Containers restarted!"
}

# Function to show help
show_help() {
    echo "Loggerhead Backend Docker Scripts"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build-prod     Build production Docker image"
    echo "  build-dev      Build development Docker image"
    echo "  run-prod       Start production container"
    echo "  run-dev        Start development container"
    echo "  stop           Stop all containers"
    echo "  logs           View production logs"
    echo "  logs-dev       View development logs"
    echo "  status         Check container status"
    echo "  restart        Restart containers"
    echo "  cleanup        Clean up Docker resources"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build-prod"
    echo "  $0 run-dev"
    echo "  $0 logs"
}

# Main script logic
case "${1:-help}" in
    "build-prod")
        check_docker
        build_production
        ;;
    "build-dev")
        check_docker
        build_development
        ;;
    "run-prod")
        check_docker
        run_production
        ;;
    "run-dev")
        check_docker
        run_development
        ;;
    "stop")
        check_docker
        stop_containers
        ;;
    "logs")
        check_docker
        view_logs
        ;;
    "logs-dev")
        check_docker
        view_dev_logs
        ;;
    "status")
        check_docker
        status
        ;;
    "restart")
        check_docker
        restart
        ;;
    "cleanup")
        check_docker
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac 