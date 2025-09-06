#!/bin/bash

# Magic Marker Development Script with Supabase Integration

set -e

echo "🎨 Starting Magic Marker development environment..."

# Check if Supabase is running
check_supabase() {
    if ! curl -s http://127.0.0.1:54321/health > /dev/null 2>&1; then
        echo "⚠️  Supabase is not running. Starting Supabase..."
        cd apps/magic-marker/web
        supabase start
        cd ../..
        echo "✅ Supabase started!"
    else
        echo "✅ Supabase is already running"
    fi
}

# Check if environment is set up
check_environment() {
    if [ ! -f "apps/magic-marker/web/.env.local" ]; then
        echo "⚠️  Environment file not found. Running setup..."
        ./scripts/setup-magic-marker.sh
    else
        echo "✅ Environment file found"
    fi
}

# Start the development server
start_dev_server() {
    echo "🚀 Starting Magic Marker development server..."
    cd apps/magic-marker/web
    pnpm dev
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down Magic Marker development environment..."
    echo "   To stop Supabase: supabase stop"
    echo "   To view Supabase logs: supabase logs"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    check_environment
    check_supabase
    start_dev_server
}

# Run main function
main "$@"
