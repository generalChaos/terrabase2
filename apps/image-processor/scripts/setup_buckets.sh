#!/bin/bash

# Setup Supabase storage buckets for image processor
# This script creates the required buckets programmatically

echo "🚀 Setting up Supabase storage buckets for image processor..."

# Check if we're in the right directory
if [ ! -f "src/main.py" ]; then
    echo "❌ Please run this script from the image-processor directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ] && [ ! -f "local.env" ]; then
    echo "❌ No .env file found. Please create one with your Supabase credentials:"
    echo "   SUPABASE_URL=your_supabase_url"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
elif [ -f "local.env" ]; then
    source local.env
fi

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Found Supabase configuration"

# Run the Python script to create buckets
echo "📦 Creating storage buckets..."
python3 scripts/create_buckets_rest.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Bucket setup completed!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Run the SQL policies shown above in your Supabase dashboard"
    echo "2. Test your image processor endpoints"
    echo ""
    echo "🧪 Test with:"
    echo "   curl https://your-image-processor-url/health"
else
    echo "❌ Bucket setup failed. Check the errors above."
    exit 1
fi
