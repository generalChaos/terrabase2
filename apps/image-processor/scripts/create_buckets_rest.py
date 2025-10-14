#!/usr/bin/env python3
"""
Create required Supabase storage buckets using REST API
This is more reliable than the Python client for bucket creation
"""

import os
import sys
import requests
import json
from pathlib import Path

# Add the src directory to the path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from dotenv import load_dotenv

def create_bucket_via_rest(supabase_url: str, service_key: str, bucket_name: str, public: bool = True, file_size_limit: int = 10485760):
    """Create a bucket using Supabase REST API"""
    
    headers = {
        'Authorization': f'Bearer {service_key}',
        'apikey': service_key,
        'Content-Type': 'application/json'
    }
    
    # Check if bucket exists first
    list_url = f"{supabase_url}/storage/v1/bucket"
    try:
        response = requests.get(list_url, headers=headers)
        if response.status_code == 200:
            existing_buckets = response.json()
            if any(bucket['name'] == bucket_name for bucket in existing_buckets):
                print(f"✅ Bucket '{bucket_name}' already exists")
                return True
    except Exception as e:
        print(f"⚠️  Could not check existing buckets: {e}")
    
    # Create the bucket
    create_url = f"{supabase_url}/storage/v1/bucket"
    payload = {
        'id': bucket_name,
        'name': bucket_name,
        'public': public,
        'file_size_limit': file_size_limit,
        'allowed_mime_types': ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    }
    
    try:
        response = requests.post(create_url, headers=headers, json=payload)
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"✅ Created bucket '{bucket_name}' successfully")
            return True
        else:
            print(f"❌ Failed to create bucket '{bucket_name}': {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating bucket '{bucket_name}': {e}")
        return False

def create_bucket_policies_via_rest(supabase_url: str, service_key: str, bucket_name: str):
    """Create RLS policies using Supabase REST API"""
    
    headers = {
        'Authorization': f'Bearer {service_key}',
        'apikey': service_key,
        'Content-Type': 'application/json'
    }
    
    policies = [
        {
            'name': f'Anyone can upload {bucket_name}',
            'definition': f'bucket_id = \'{bucket_name}\'',
            'check': f'bucket_id = \'{bucket_name}\'',
            'operation': 'INSERT'
        },
        {
            'name': f'Anyone can view {bucket_name}',
            'definition': f'bucket_id = \'{bucket_name}\'',
            'check': f'bucket_id = \'{bucket_name}\'',
            'operation': 'SELECT'
        },
        {
            'name': f'Anyone can update {bucket_name}',
            'definition': f'bucket_id = \'{bucket_name}\'',
            'check': f'bucket_id = \'{bucket_name}\'',
            'operation': 'UPDATE'
        },
        {
            'name': f'Anyone can delete {bucket_name}',
            'definition': f'bucket_id = \'{bucket_name}\'',
            'check': f'bucket_id = \'{bucket_name}\'',
            'operation': 'DELETE'
        }
    ]
    
    success_count = 0
    for policy in policies:
        try:
            # Note: Policy creation via REST API is complex
            # For now, we'll just print the SQL
            print(f"📝 Policy for {policy['operation']} on {bucket_name}: {policy['name']}")
            success_count += 1
        except Exception as e:
            print(f"⚠️  Could not create policy: {e}")
    
    # Print SQL for manual execution
    print(f"\n📝 Run this SQL in your Supabase dashboard for bucket '{bucket_name}':")
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
    
    return success_count > 0

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
    
    print(f"✅ Using Supabase at {supabase_url}")
    
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
        
        if create_bucket_via_rest(
            supabase_url,
            supabase_key,
            bucket_config['name'], 
            bucket_config['public'], 
            bucket_config['file_size_limit']
        ):
            create_bucket_policies_via_rest(supabase_url, supabase_key, bucket_config['name'])
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
