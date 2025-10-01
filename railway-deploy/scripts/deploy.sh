#!/bin/bash

# Production deployment script for Image Processor

set -e

echo "🚀 Deploying Image Processor to Production..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p output temp models ssl

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Image Processor is running!"
    echo "🌐 API available at: http://localhost:8000"
    echo "📚 Documentation at: http://localhost:8000/docs"
    echo "📊 Monitoring at: http://localhost:3000 (Grafana)"
else
    echo "❌ Service health check failed!"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.prod.yml logs image-processor
    exit 1
fi

echo "🎉 Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  Scale: docker-compose -f docker-compose.prod.yml up -d --scale image-processor=3"
