#!/usr/bin/env python3
"""
Create required Supabase storage buckets for the image processor
"""

import os
import sys
from pathlib import Path

# Add the src directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent.parent / "src"))

from dotenv import load_dotenv
from supabase import create_client, Client

def create_bucket(client: Client, bucket_name: str, public: bool = True, file_size_limit: int = 10485760):
    """Create a Supabase storage bucket with policies"""
    
    # Check if bucket already exists
    try:
        existing_buckets = client.storage.list_buckets()
        bucket_exists = any(bucket.name == bucket_name for bucket in existing_buckets)
        
        if bucket_exists:
            print(f"✅ Bucket '{bucket_name}' already exists")
            return True
    except Exception as e:
        print(f"⚠️  Could not check existing buckets: {e}")
    
    try:
        # Create the bucket
        response = client.storage.create_bucket(
            bucket_name,
            public=public,
            file_size_limit=file_size_limit,
            allowed_mime_types=['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
        )
        
        if hasattr(response, 'error') and response.error:
            print(f"❌ Failed to create bucket '{bucket_name}': {response.error}")
            return False
        
        print(f"✅ Created bucket '{bucket_name}' successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error creating bucket '{bucket_name}': {e}")
        return False

def create_bucket_policies(client: Client, bucket_name: str):
    """Create RLS policies for the bucket"""
    try:
        # Note: Creating policies via the Python client is more complex
        # For now, we'll just print the SQL that needs to be run
        print(f"📝 To create policies for '{bucket_name}', run this SQL in your Supabase dashboard:")
        print(f"""
CREATE POLICY "Anyone can upload {bucket_name}" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = '{bucket_name}');

CREATE POLICY "Anyone can view {bucket_name}" ON storage.objects
  FOR SELECT USING (bucket_id = '{bucket_name}');

CREATE POLICY "Anyone can update {bucket_name}" ON storage.objects
  FOR UPDATE USING (bucket_id = '{bucket_name}');

CREATE POLICY "Anyone can delete {bucket_name}" ON storage.objects
  FOR DELETE USING (bucket_id = '{bucket_name}');
""")
        return True
    except Exception as e:
        print(f"⚠️  Could not create policies for '{bucket_name}': {e}")
        return False

def main():
    """Main function to create all required buckets"""
    
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
    
    # Create Supabase client
    try:
        client = create_client(supabase_url, supabase_key)
        print(f"✅ Connected to Supabase at {supabase_url}")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False
    
    # Define required buckets
    buckets = [
        {
            'name': 'team-assets',
            'public': True,
            'file_size_limit': 10485760,  # 10MB
            'description': 'T-shirts, banners, and other team assets'
        },
        {
            'name': 'team-logos',
            'public': True,
            'file_size_limit': 5242880,   # 5MB
            'description': 'Team logos and small images'
        }
    ]
    
    print(f"\n🚀 Creating {len(buckets)} required buckets...\n")
    
    success_count = 0
    for bucket_config in buckets:
        print(f"Creating bucket: {bucket_config['name']} ({bucket_config['description']})")
        
        if create_bucket(
            client, 
            bucket_config['name'], 
            bucket_config['public'], 
            bucket_config['file_size_limit']
        ):
            create_bucket_policies(client, bucket_config['name'])
            success_count += 1
        print()
    
    print(f"📊 Summary: {success_count}/{len(buckets)} buckets created successfully")
    
    if success_count == len(buckets):
        print("🎉 All buckets created successfully!")
        print("\n📝 Next steps:")
        print("1. Run the SQL policies shown above in your Supabase dashboard")
        print("2. Test your image processor endpoints")
        return True
    else:
        print("⚠️  Some buckets failed to create. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
