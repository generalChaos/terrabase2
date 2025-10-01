#!/bin/bash

# Development script for Image Processor service
# Usage: ./scripts/dev-image-processor.sh

set -e

echo "🚀 Starting Image Processor development server..."

# Navigate to the image-processor directory
cd apps/image-processor

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before running again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models temp output

# Download models if they don't exist
if [ ! -f "models/RealESRGAN_x4plus.pth" ]; then
    echo "📥 Downloading models..."
    python scripts/download_models.py
fi

# Start the service
echo "🌟 Starting FastAPI server..."
echo "📖 API docs will be available at: http://localhost:8001/docs"
echo "🔍 Health check: http://localhost:8001/health"
echo ""

python src/main.py
