#!/usr/bin/env python3
"""
Create the logo_asset_packs table in Supabase
This table stores asset pack data for each logo variant
"""

import os
import sys
import requests
import json
from pathlib import Path

# Add the src directory to the path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from dotenv import load_dotenv

def execute_sql(supabase_url: str, service_key: str, sql: str, description: str):
    """Execute SQL using Supabase REST API"""
    
    headers = {
        'Authorization': f'Bearer {service_key}',
        'apikey': service_key,
        'Content-Type': 'application/json'
    }
    
    # Use the RPC endpoint to execute SQL
    url = f"{supabase_url}/rest/v1/rpc/exec_sql"
    payload = {"sql": sql}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            print(f"✅ {description}")
            return True
        else:
            print(f"❌ {description} - {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False

def create_logo_asset_packs_table(supabase_url: str, service_key: str):
    """Create the logo_asset_packs table with all required columns and policies"""
    
    # Check if table already exists
    check_sql = """
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'logo_asset_packs'
    );
    """
    
    print("🔍 Checking if logo_asset_packs table exists...")
    
    # First, let's try to create the table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS logo_asset_packs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        flow_id UUID NOT NULL REFERENCES team_design_flows(id) ON DELETE CASCADE,
        logo_id UUID NOT NULL REFERENCES team_logos(id) ON DELETE CASCADE,
        asset_pack_id VARCHAR NOT NULL,
        clean_logo_url TEXT NOT NULL,
        tshirt_front_url TEXT NOT NULL,
        tshirt_back_url TEXT NOT NULL,
        banner_url TEXT,
        processing_time_ms INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    if not execute_sql(supabase_url, service_key, create_table_sql, "Created logo_asset_packs table"):
        return False
    
    # Add indexes
    indexes = [
        ("CREATE INDEX IF NOT EXISTS idx_logo_asset_packs_flow_id ON logo_asset_packs(flow_id);", "Created flow_id index"),
        ("CREATE INDEX IF NOT EXISTS idx_logo_asset_packs_logo_id ON logo_asset_packs(logo_id);", "Created logo_id index"),
        ("CREATE INDEX IF NOT EXISTS idx_logo_asset_packs_asset_pack_id ON logo_asset_packs(asset_pack_id);", "Created asset_pack_id index")
    ]
    
    for sql, description in indexes:
        execute_sql(supabase_url, service_key, sql, description)
    
    # Enable RLS
    execute_sql(supabase_url, service_key, "ALTER TABLE logo_asset_packs ENABLE ROW LEVEL SECURITY;", "Enabled RLS on logo_asset_packs")
    
    # Drop existing policies first to avoid conflicts
    drop_policies = [
        ("DROP POLICY IF EXISTS \"Allow public read access to logo asset packs\" ON logo_asset_packs;", "Dropped existing public read policy"),
        ("DROP POLICY IF EXISTS \"Allow authenticated users to insert logo asset packs\" ON logo_asset_packs;", "Dropped existing insert policy"),
        ("DROP POLICY IF EXISTS \"Allow authenticated users to update logo asset packs\" ON logo_asset_packs;", "Dropped existing update policy"),
        ("DROP POLICY IF EXISTS \"Allow authenticated users to delete logo asset packs\" ON logo_asset_packs;", "Dropped existing delete policy")
    ]
    
    for sql, description in drop_policies:
        execute_sql(supabase_url, service_key, sql, description)
    
    # Create policies
    policies = [
        ("CREATE POLICY \"Allow public read access to logo asset packs\" ON logo_asset_packs FOR SELECT USING (true);", "Created public read policy"),
        ("CREATE POLICY \"Allow authenticated users to insert logo asset packs\" ON logo_asset_packs FOR INSERT WITH CHECK (true);", "Created insert policy"),
        ("CREATE POLICY \"Allow authenticated users to update logo asset packs\" ON logo_asset_packs FOR UPDATE USING (true);", "Created update policy"),
        ("CREATE POLICY \"Allow authenticated users to delete logo asset packs\" ON logo_asset_packs FOR DELETE USING (true);", "Created delete policy")
    ]
    
    for sql, description in policies:
        execute_sql(supabase_url, service_key, sql, description)
    
    # Add colors column if it doesn't exist
    add_colors_sql = """
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'logo_asset_packs' 
            AND column_name = 'colors'
        ) THEN
            ALTER TABLE logo_asset_packs ADD COLUMN colors JSONB;
            COMMENT ON COLUMN logo_asset_packs.colors IS 'Color analysis results including colors, frequencies, percentages, and total pixels analyzed';
        END IF;
    END $$;
    """
    
    execute_sql(supabase_url, service_key, add_colors_sql, "Added colors column (if not exists)")
    
    return True

def main():
    """Main function to create the logo_asset_packs table"""
    
    # Load environment variables
    load_dotenv()
    
    # Get Supabase configuration
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing required environment variables:")
        print("   - SUPABASE_URL")
        print("   - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY")
        print("\n💡 Make sure to set these in your .env file or environment")
        return False
    
    print(f"✅ Using Supabase at {supabase_url}")
    print("\n🚀 Creating logo_asset_packs table...\n")
    
    if create_logo_asset_packs_table(supabase_url, supabase_key):
        print("\n🎉 logo_asset_packs table created successfully!")
        print("\n📋 Table structure:")
        print("   - id (UUID, Primary Key)")
        print("   - flow_id (UUID, Foreign Key to team_design_flows)")
        print("   - logo_id (UUID, Foreign Key to team_logos)")
        print("   - asset_pack_id (VARCHAR)")
        print("   - clean_logo_url (TEXT)")
        print("   - tshirt_front_url (TEXT)")
        print("   - tshirt_back_url (TEXT)")
        print("   - banner_url (TEXT, nullable)")
        print("   - processing_time_ms (INTEGER)")
        print("   - colors (JSONB, nullable)")
        print("   - created_at (TIMESTAMP)")
        print("   - updated_at (TIMESTAMP)")
        print("\n🔒 RLS policies enabled with public read access")
        print("\n🧪 Test with:")
        print("   curl -H 'apikey: YOUR_ANON_KEY' https://your-project.supabase.co/rest/v1/logo_asset_packs")
        return True
    else:
        print("❌ Failed to create logo_asset_packs table")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
