"""
Simplified Storage Service - Supabase Only
"""

import os
import uuid
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

@dataclass
class StorageFile:
    file_name: str
    public_url: str
    file_size: int
    mime_type: str
    bucket: Optional[str] = None

class StorageService:
    """Simplified storage service that only uses Supabase"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        self._init_supabase()
    
    def _init_supabase(self):
        """Initialize Supabase client"""
        if not SUPABASE_AVAILABLE:
            raise ImportError("Supabase client not available. Install with: pip install supabase")
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase URL and key must be provided")
        
        self.supabase_client = create_client(supabase_url, supabase_key)
    
    async def upload_file(
        self,
        file_data: bytes,
        file_name: str,
        bucket: str = 'team-logos',
        content_type: str = 'application/octet-stream',
        cache_control: str = '3600'
    ) -> StorageFile:
        """Upload a file to Supabase storage"""
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            timestamp = int(datetime.now().timestamp())
            name, ext = os.path.splitext(file_name)
            unique_name = f"{name}_{timestamp}_{file_id}{ext}"
            
            # Upload to Supabase
            response = self.supabase_client.storage.from_(bucket).upload(
                unique_name,
                file_data,
                file_options={
                    'content-type': content_type,
                    'cache-control': cache_control
                }
            )
            
            # Get public URL from Supabase
            public_url = self.supabase_client.storage.from_(bucket).get_public_url(unique_name)
            
            return StorageFile(
                file_name=unique_name,
                public_url=public_url,
                file_size=len(file_data),
                mime_type=content_type,
                bucket=bucket
            )
            
        except Exception as e:
            raise Exception(f"Failed to upload file: {str(e)}")
    
    async def get_public_url(self, file_path: str, bucket: str = 'team-logos') -> str:
        """Get public URL for a file"""
        try:
            return self.supabase_client.storage.from_(bucket).get_public_url(file_path)
        except Exception as e:
            raise Exception(f"Failed to get public URL: {str(e)}")
    
    async def delete_file(self, file_path: str, bucket: str = 'team-logos') -> bool:
        """Delete a file from storage"""
        try:
            self.supabase_client.storage.from_(bucket).remove([file_path])
            return True
        except Exception:
            return False
    
    async def list_files(self, bucket: str = 'team-logos', prefix: str = '') -> List[StorageFile]:
        """List files in storage"""
        try:
            files = self.supabase_client.storage.from_(bucket).list()
            result = []
            
            for file_info in files:
                if file_info['name'].startswith(prefix):
                    public_url = self.supabase_client.storage.from_(bucket).get_public_url(file_info['name'])
                    result.append(StorageFile(
                        file_name=file_info['name'],
                        public_url=public_url,
                        file_size=file_info.get('metadata', {}).get('size', 0),
                        mime_type=file_info.get('metadata', {}).get('mimetype', 'application/octet-stream'),
                        bucket=bucket
                    ))
            
            return result
        except Exception as e:
            raise Exception(f"Failed to list files: {str(e)}")

# Global storage instance
storage = StorageService()
