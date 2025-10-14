#!/bin/bash

# Setup logo_asset_packs table in Supabase
# This script creates the required table programmatically

echo "🚀 Setting up logo_asset_packs table in Supabase..."

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

# Run the Python script to create the table
echo "📦 Creating logo_asset_packs table..."
python3 scripts/create_logo_asset_packs_table.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 logo_asset_packs table setup completed!"
    echo ""
    echo "📋 Table includes:"
    echo "   - Basic asset pack data (URLs, processing time)"
    echo "   - Foreign keys to team_design_flows and team_logos"
    echo "   - Colors column for color analysis results"
    echo "   - RLS policies for public read access"
    echo ""
    echo "🧪 Test with:"
    echo "   curl -H 'apikey: YOUR_ANON_KEY' https://your-project.supabase.co/rest/v1/logo_asset_packs"
else
    echo "❌ Table setup failed. Check the errors above."
    echo ""
    echo "💡 Alternative: Run the SQL manually in Supabase dashboard:"
    echo "   Copy and paste the contents of scripts/create_logo_asset_packs.sql"
    exit 1
fi
