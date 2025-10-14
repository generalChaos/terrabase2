"""
Storage API endpoints for serving local files
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
import os
from pathlib import Path
from src.storage import storage_client

router = APIRouter()

@router.get("/storage/{file_path:path}")
async def serve_file(file_path: str):
    """
    Serve local storage files
    Only available in development mode
    """
    # Only allow in development
    if os.getenv('NODE_ENV', 'development') != 'development':
        raise HTTPException(status_code=404, detail="Local storage only available in development")
    
    try:
        # Security: prevent directory traversal
        if '..' in file_path or '~' in file_path:
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        local_path = os.getenv('LOCAL_STORAGE_PATH', './storage')
        full_path = os.path.join(local_path, file_path)
        
        # Check if file exists
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get file extension for content type
        ext = Path(file_path).suffix.lower()
        content_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.json': 'application/json'
        }
        
        content_type = content_types.get(ext, 'application/octet-stream')
        
        return FileResponse(
            full_path,
            media_type=content_type,
            headers={
                'Cache-Control': 'public, max-age=3600'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/storage/info")
async def get_storage_info():
    """
    Get storage configuration and status
    """
    config = storage_client.get_config()
    is_available = await storage_client.is_available()
    
    return {
        "config": config,
        "available": is_available,
        "type": config['type']
    }
