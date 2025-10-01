"""
Web Assets API - Prepare logos for web use
"""
import os
import time
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image
import numpy as np

from services.ai_background_remover import AIBackgroundRemover
from utils.filename_utils import generate_processing_filename

logger = logging.getLogger(__name__)
router = APIRouter()

class LogoPreprocessRequest(BaseModel):
    logo_url: str
    output_format: str = "png"
    quality: int = 95
    remove_background: bool = True
    optimize_for_web: bool = True

class BatchLogoPreprocessRequest(BaseModel):
    logo_urls: List[str]
    output_format: str = "png"
    quality: int = 95
    remove_background: bool = True
    optimize_for_web: bool = True

class WebAssetsService:
    def __init__(self):
        self.output_dir = "./output/web-assets"
        self.ai_remover = AIBackgroundRemover()
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def preprocess_logo(self, request: LogoPreprocessRequest) -> dict:
        """Preprocess a single logo for web use"""
        try:
            start_time = time.time()
            
            # Download logo
            logo_image = await self._download_image(request.logo_url)
            
            # Remove background if requested
            if request.remove_background:
                logo_image = await self._remove_background(logo_image)
            
            # Optimize for web if requested
            if request.optimize_for_web:
                logo_image = await self._optimize_for_web(logo_image)
            
            # Generate filename
            filename = generate_processing_filename(
                original_url=request.logo_url,
                processing_type="web_ready",
                extension=request.output_format,
                include_timestamp=True
            )
            
            # Save processed logo
            output_path = os.path.join(self.output_dir, filename)
            await self._save_image(logo_image, output_path, request.output_format, request.quality)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "original_url": request.logo_url,
                "processed_url": f"./output/web-assets/{filename}",
                "filename": filename,
                "file_size_bytes": os.path.getsize(output_path),
                "processing_time_ms": processing_time,
                "background_removed": request.remove_background,
                "web_optimized": request.optimize_for_web,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Logo preprocessing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Logo preprocessing failed: {str(e)}")
    
    async def batch_preprocess_logos(self, request: BatchLogoPreprocessRequest) -> dict:
        """Preprocess multiple logos for web use"""
        try:
            results = []
            total_processing_time = 0
            
            for logo_url in request.logo_urls:
                single_request = LogoPreprocessRequest(
                    logo_url=logo_url,
                    output_format=request.output_format,
                    quality=request.quality,
                    remove_background=request.remove_background,
                    optimize_for_web=request.optimize_for_web
                )
                
                result = await self.preprocess_logo(single_request)
                results.append(result)
                total_processing_time += result["processing_time_ms"]
            
            return {
                "success": True,
                "total_logos": len(request.logo_urls),
                "total_processing_time_ms": total_processing_time,
                "results": results,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Batch logo preprocessing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Batch preprocessing failed: {str(e)}")
    
    async def _remove_background(self, logo_image: Image.Image) -> Image.Image:
        """Remove background using AI"""
        try:
            # Convert PIL to numpy array
            logo_array = np.array(logo_image)
            
            # Get rembg session
            session, remove_func = self.ai_remover._get_rembg_session()
            
            # Remove background using AI
            result_image = remove_func(logo_image, session=session)
            
            return result_image
                
        except Exception as e:
            logger.warning(f"Background removal failed: {str(e)}")
            return logo_image
    
    async def _optimize_for_web(self, logo_image: Image.Image) -> Image.Image:
        """Optimize logo for web use"""
        try:
            # Ensure RGBA mode for transparency
            if logo_image.mode != 'RGBA':
                logo_image = logo_image.convert('RGBA')
            
            # Resize if too large (max 1024px on longest side)
            max_size = 1024
            if max(logo_image.size) > max_size:
                ratio = max_size / max(logo_image.size)
                new_size = (int(logo_image.width * ratio), int(logo_image.height * ratio))
                logo_image = logo_image.resize(new_size, Image.Resampling.LANCZOS)
            
            return logo_image
            
        except Exception as e:
            logger.warning(f"Web optimization failed: {str(e)}")
            return logo_image
    
    async def _download_image(self, url: str) -> Image.Image:
        """Download image from URL or local file"""
        try:
            if url.startswith('file://'):
                file_path = url.replace('file://', '')
                return Image.open(file_path)
            else:
                import requests
                response = requests.get(url)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
    
    async def _save_image(self, image: Image.Image, output_path: str, format: str, quality: int):
        """Save image with specified format and quality"""
        try:
            if format.lower() == 'png':
                image.save(output_path, 'PNG', optimize=True)
            elif format.lower() in ['jpg', 'jpeg']:
                # Convert to RGB for JPEG
                if image.mode == 'RGBA':
                    rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                    rgb_image.paste(image, mask=image.split()[-1])
                    image = rgb_image
                image.save(output_path, 'JPEG', quality=quality, optimize=True)
            else:
                image.save(output_path, format.upper(), quality=quality)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

# Initialize service
web_assets_service = WebAssetsService()

@router.post("/preprocess-logo")
async def preprocess_logo(request: LogoPreprocessRequest):
    """Preprocess a single logo for web use"""
    return await web_assets_service.preprocess_logo(request)

@router.post("/batch-preprocess-logos")
async def batch_preprocess_logos(request: BatchLogoPreprocessRequest):
    """Preprocess multiple logos for web use"""
    return await web_assets_service.batch_preprocess_logos(request)

@router.get("/web-assets")
async def list_web_assets():
    """List all prepared web assets"""
    try:
        assets = []
        for filename in os.listdir(web_assets_service.output_dir):
            if filename.endswith(('.png', '.jpg', '.jpeg')):
                file_path = os.path.join(web_assets_service.output_dir, filename)
                assets.append({
                    "filename": filename,
                    "file_size_bytes": os.path.getsize(file_path),
                    "url": f"./output/web-assets/{filename}"
                })
        
        return {
            "success": True,
            "total_assets": len(assets),
            "assets": assets
        }
    except Exception as e:
        logger.error(f"Failed to list web assets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list assets: {str(e)}")
