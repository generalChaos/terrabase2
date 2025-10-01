"""
Storage Service for Image Processor
Supports both local filesystem and Supabase storage
"""

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import asyncio
from dataclasses import dataclass

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

@dataclass
class StorageFile:
    file_name: str
    file_path: str
    public_url: str
    file_size: int
    mime_type: str
    bucket: Optional[str] = None

class StorageService:
    def __init__(self):
        self.storage_type = self._get_storage_type()
        self.local_path = os.getenv('LOCAL_STORAGE_PATH', './storage')
        self.local_base_url = os.getenv('LOCAL_STORAGE_BASE_URL', 'http://localhost:8000/api/storage')
        self.supabase_client: Optional[Client] = None
        
        if self.storage_type == 'supabase':
            self._init_supabase()
    
    def _get_storage_type(self) -> str:
        """Determine storage type based on environment"""
        storage_type = os.getenv('STORAGE_TYPE')
        if storage_type in ['local', 'supabase']:
            return storage_type
        
        # Default: local for development, supabase for production
        environment = os.getenv('NODE_ENV', 'development')
        return 'local' if environment == 'development' else 'supabase'
    
    def _init_supabase(self):
        """Initialize Supabase client"""
        if not SUPABASE_AVAILABLE:
            raise ImportError("Supabase client not available. Install with: pip install supabase")
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase URL and key must be provided for Supabase storage")
        
        self.supabase_client = create_client(supabase_url, supabase_key)
    
    async def upload_file(
        self,
        file_data: bytes,
        file_name: str,
        bucket: str = 'team-logos',
        content_type: str = 'application/octet-stream',
        cache_control: str = '3600'
    ) -> StorageFile:
        """Upload a file to storage"""
        if self.storage_type == 'local':
            return await self._upload_to_local(file_data, file_name, bucket, content_type)
        else:
            return await self._upload_to_supabase(file_data, file_name, bucket, content_type, cache_control)
    
    async def get_public_url(self, file_path: str, bucket: str = 'team-logos') -> str:
        """Get public URL for a file"""
        if self.storage_type == 'local':
            return self._get_local_public_url(file_path)
        else:
            return self._get_supabase_public_url(file_path, bucket)
    
    async def delete_file(self, file_path: str, bucket: str = 'team-logos') -> bool:
        """Delete a file from storage"""
        if self.storage_type == 'local':
            return await self._delete_local_file(file_path)
        else:
            return await self._delete_supabase_file(file_path, bucket)
    
    async def list_files(self, bucket: str = 'team-logos', prefix: str = '') -> List[StorageFile]:
        """List files in storage"""
        if self.storage_type == 'local':
            return await self._list_local_files(bucket, prefix)
        else:
            return await self._list_supabase_files(bucket, prefix)
    
    # Local storage methods
    async def _upload_to_local(
        self,
        file_data: bytes,
        file_name: str,
        bucket: str,
        content_type: str
    ) -> StorageFile:
        """Upload file to local filesystem"""
        # Generate unique filename
        file_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp())
        name, ext = os.path.splitext(file_name)
        unique_name = f"{name}_{timestamp}_{file_id}{ext}"
        
        # Create file path
        file_path = f"{bucket}/{unique_name}"
        full_path = os.path.join(self.local_path, file_path)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Write file
        with open(full_path, 'wb') as f:
            f.write(file_data)
        
        return StorageFile(
            file_name=unique_name,
            file_path=file_path,
            public_url=self._get_local_public_url(file_path),
            file_size=len(file_data),
            mime_type=content_type,
            bucket=bucket
        )
    
    def _get_local_public_url(self, file_path: str) -> str:
        """Get public URL for local file"""
        return f"{self.local_base_url}/{file_path}"
    
    async def _delete_local_file(self, file_path: str) -> bool:
        """Delete local file"""
        try:
            full_path = os.path.join(self.local_path, file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
            return True
        except Exception as e:
            print(f"Error deleting local file: {e}")
            return False
    
    async def _list_local_files(self, bucket: str, prefix: str = '') -> List[StorageFile]:
        """List local files"""
        try:
            bucket_path = os.path.join(self.local_path, bucket)
            if not os.path.exists(bucket_path):
                return []
            
            files = []
            for filename in os.listdir(bucket_path):
                if prefix and not filename.startswith(prefix):
                    continue
                
                file_path = os.path.join(bucket_path, filename)
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    files.append(StorageFile(
                        file_name=filename,
                        file_path=f"{bucket}/{filename}",
                        public_url=self._get_local_public_url(f"{bucket}/{filename}"),
                        file_size=stat.st_size,
                        mime_type='application/octet-stream',
                        bucket=bucket
                    ))
            
            return files
        except Exception as e:
            print(f"Error listing local files: {e}")
            return []
    
    # Supabase storage methods
    async def _upload_to_supabase(
        self,
        file_data: bytes,
        file_name: str,
        bucket: str,
        content_type: str,
        cache_control: str
    ) -> StorageFile:
        """Upload file to Supabase storage"""
        if not self.supabase_client:
            raise ValueError("Supabase client not initialized")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp())
        name, ext = os.path.splitext(file_name)
        unique_name = f"{name}_{timestamp}_{file_id}{ext}"
        
        file_path = f"{unique_name}"
        
        # Upload to Supabase
        response = self.supabase_client.storage.from_(bucket).upload(
            file_path,
            file_data,
            file_options={
                'content-type': content_type,
                'cache-control': cache_control
            }
        )
        
        if hasattr(response, 'error') and response.error:
            raise Exception(f"Failed to upload to Supabase: {response.error}")
        
        # Get public URL
        public_url = self._get_supabase_public_url(file_path, bucket)
        
        return StorageFile(
            file_name=unique_name,
            file_path=file_path,
            public_url=public_url,
            file_size=len(file_data),
            mime_type=content_type,
            bucket=bucket
        )
    
    def _get_supabase_public_url(self, file_path: str, bucket: str) -> str:
        """Get public URL for Supabase file"""
        if not self.supabase_client:
            raise ValueError("Supabase client not initialized")
        
        response = self.supabase_client.storage.from_(bucket).get_public_url(file_path)
        return response
    
    async def _delete_supabase_file(self, file_path: str, bucket: str) -> bool:
        """Delete Supabase file"""
        if not self.supabase_client:
            return False
        
        try:
            response = self.supabase_client.storage.from_(bucket).remove([file_path])
            if hasattr(response, 'error') and response.error:
                print(f"Error deleting Supabase file: {response.error}")
                return False
            return True
        except Exception as e:
            print(f"Error deleting Supabase file: {e}")
            return False
    
    async def _list_supabase_files(self, bucket: str, prefix: str = '') -> List[StorageFile]:
        """List Supabase files"""
        if not self.supabase_client:
            return []
        
        try:
            response = self.supabase_client.storage.from_(bucket).list(prefix)
            files = []
            
            for item in response:
                if item.get('name'):  # Skip directories
                    file_path = f"{prefix}/{item['name']}" if prefix else item['name']
                    files.append(StorageFile(
                        file_name=item['name'],
                        file_path=file_path,
                        public_url=self._get_supabase_public_url(file_path, bucket),
                        file_size=item.get('metadata', {}).get('size', 0),
                        mime_type=item.get('metadata', {}).get('mimetype', 'application/octet-stream'),
                        bucket=bucket
                    ))
            
            return files
        except Exception as e:
            print(f"Error listing Supabase files: {e}")
            return []
    
    def get_config(self) -> Dict[str, Any]:
        """Get storage configuration"""
        return {
            'type': self.storage_type,
            'local_path': self.local_path,
            'local_base_url': self.local_base_url,
            'supabase_available': SUPABASE_AVAILABLE
        }
    
    async def is_available(self) -> bool:
        """Check if storage is available"""
        try:
            if self.storage_type == 'local':
                # Check if local storage directory exists and is writable
                os.makedirs(self.local_path, exist_ok=True)
                test_file = os.path.join(self.local_path, '.test')
                with open(test_file, 'w') as f:
                    f.write('test')
                os.remove(test_file)
                return True
            else:
                # Check Supabase connection
                if not self.supabase_client:
                    return False
                # Try to list buckets
                self.supabase_client.storage.list_buckets()
                return True
        except Exception as e:
            print(f"Storage availability check failed: {e}")
            return False

# Global storage instance
storage = StorageService()