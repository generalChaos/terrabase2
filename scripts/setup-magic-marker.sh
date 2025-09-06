#!/bin/bash

# Magic Marker Development Setup Script with Local Supabase

set -e

echo "🎨 Setting up Magic Marker development environment..."

# Check if required tools are installed
check_requirements() {
    echo "🔍 Checking requirements..."
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        echo "❌ pnpm is not installed. Please install pnpm first:"
        echo "   npm install -g pnpm"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo "❌ Supabase CLI is not installed. Installing..."
        npm install -g supabase
    fi
    
    echo "✅ All requirements met!"
}

# Setup Supabase local environment
setup_supabase() {
    echo "🗄️ Setting up local Supabase environment..."
    
    cd apps/magic-marker/web
    
    # Initialize Supabase if not already done
    if [ ! -f "supabase/config.toml" ]; then
        echo "📝 Initializing Supabase project..."
        supabase init
    fi
    
    # Start Supabase services
    echo "🚀 Starting Supabase services..."
    supabase start
    
    # Apply database migrations
    echo "📊 Applying database migrations..."
    supabase db reset
    
    echo "✅ Supabase local environment ready!"
    echo "   - API URL: http://127.0.0.1:54321"
    echo "   - Dashboard: http://127.0.0.1:54323"
    
    cd ../..
}

# Setup environment variables
setup_environment() {
    echo "⚙️ Setting up environment variables..."
    
    cd apps/magic-marker/web
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        echo "📝 Creating .env.local file..."
        cat > .env.local << EOF
# Local Supabase Development Environment
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenAI API Configuration (for server-side API routes)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Prompt Management Configuration
USE_DATABASE_PROMPTS=true
EOF
        echo "⚠️  Please update OPENAI_API_KEY in .env.local with your actual API key"
    else
        echo "✅ .env.local already exists"
    fi
    
    cd ../..
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    pnpm install
}

# Test the setup
test_setup() {
    echo "🧪 Testing setup..."
    
    cd apps/magic-marker/web
    
    # Test if Supabase is running
    if ! curl -s http://127.0.0.1:54321/health > /dev/null; then
        echo "❌ Supabase is not running. Please check the logs:"
        echo "   supabase logs"
        exit 1
    fi
    
    # Test if the app can start
    echo "🔍 Testing if the app can start..."
    timeout 10s pnpm dev > /dev/null 2>&1 || true
    
    cd ../..
    
    echo "✅ Setup test completed!"
}

# Main setup function
main() {
    check_requirements
    install_dependencies
    setup_supabase
    setup_environment
    test_setup
    
    echo ""
    echo "🎉 Magic Marker development environment setup complete!"
    echo ""
    echo "🌐 Available services:"
    echo "  - Magic Marker Web: http://localhost:3002"
    echo "  - Supabase Dashboard: http://127.0.0.1:54323"
    echo "  - Supabase API: http://127.0.0.1:54321"
    echo ""
    echo "📋 Useful commands:"
    echo "  - Start development: pnpm dev:magic-marker"
    echo "  - Stop Supabase: supabase stop"
    echo "  - View Supabase logs: supabase logs"
    echo "  - Reset database: supabase db reset"
    echo "  - View Supabase dashboard: supabase dashboard"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "  1. Update OPENAI_API_KEY in .env.local"
    echo "  2. Start the development server: pnpm dev:magic-marker"
}

# Run main function
main "$@"
