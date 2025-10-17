"""
Supabase Service for Image Processor
Handles direct access to Supabase storage and database
"""

import os
import logging
from typing import Optional, Dict, Any
from supabase import create_client
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)

class SupabaseService:
    """Service for accessing Supabase storage and database"""
    
    def __init__(self):
        # Use environment-aware Supabase URL fallback
        self.supabase_url = os.getenv("SUPABASE_URL") or (
            "https://csjzzhibbavtelupqugc.supabase.co" if os.getenv("NODE_ENV") == "production" 
            else "http://127.0.0.1:54321"
        )
        # Try multiple environment variable names for the service key
        self.supabase_key = (os.getenv("SUPABASE_SERVICE_KEY") or 
                           os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
                           os.getenv("SUPABASE_ANON_KEY"))
        
        if not self.supabase_key:
            logger.warning("SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable not found. Supabase features will be disabled.")
            self.client = None
        else:
            self.client = create_client(self.supabase_url, self.supabase_key)
            logger.info(f"Supabase client initialized for {self.supabase_url}")
    
    async def get_logo_by_id(self, logo_id: str) -> Optional[Dict[str, Any]]:
        """Get logo metadata from database by ID"""
        if not self.client:
            logger.warning("Supabase client not available. Cannot get logo by ID.")
            return None
        try:
            response = self.client.table("team_logos").select("*").eq("id", logo_id).single().execute()
            if response.data:
                logger.info(f"Retrieved logo metadata for ID: {logo_id}")
                return response.data
            else:
                logger.warning(f"No logo found with ID: {logo_id}")
                return None
        except Exception as e:
            logger.error(f"Error retrieving logo {logo_id}: {e}")
            return None
    
    async def download_logo_image(self, logo_data: Dict[str, Any]) -> Optional[Image.Image]:
        """Download logo image from Supabase storage"""
        try:
            bucket_name = logo_data.get("storage_bucket", "team-logos")
            file_path = logo_data.get("file_path")
            
            if not file_path:
                logger.error("No file_path in logo data")
                return None
            
            logger.info(f"Downloading image from {bucket_name}/{file_path}")
            
            # Download image from Supabase storage
            response = self.client.storage.from_(bucket_name).download(file_path)
            
            if response:
                # Convert to PIL Image
                image = Image.open(BytesIO(response))
                logger.info(f"Successfully downloaded image: {image.size} pixels")
                return image
            else:
                logger.error(f"Failed to download image from {bucket_name}/{file_path}")
                return None
                
        except Exception as e:
            logger.error(f"Error downloading logo image: {e}")
            return None
    
    async def store_asset_pack(self, flow_id: str, logo_id: str, asset_pack_data: Dict[str, Any]) -> bool:
        """Store asset pack data in database"""
        try:
            import uuid
            asset_pack_id = f"asset_pack_{uuid.uuid4().hex[:8]}"
            
            data = {
                "flow_id": flow_id,
                "logo_id": logo_id,
                "asset_pack_id": asset_pack_id,
                "clean_logo_url": asset_pack_data.get("clean_logo"),
                "tshirt_front_url": asset_pack_data.get("tshirt_front"),
                "tshirt_back_url": asset_pack_data.get("tshirt_back"),
                "banner_url": asset_pack_data.get("banner"),
                "processing_time_ms": asset_pack_data.get("processing_time_ms", 0)
            }
            
            response = self.client.table("logo_asset_packs").insert(data).execute()
            
            if response.data:
                logger.info(f"Asset pack stored successfully for logo {logo_id}")
                return True
            else:
                logger.error(f"Failed to store asset pack for logo {logo_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing asset pack: {e}")
            return False

# Global instance
supabase_service = SupabaseService()
