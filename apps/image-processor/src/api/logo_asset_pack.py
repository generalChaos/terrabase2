"""
Logo Asset Pack API - Generate complete logo asset packs
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
from utils.filename_utils import generate_processing_filename, slugify_filename
import urllib.parse

logger = logging.getLogger(__name__)
router = APIRouter()

class Player(BaseModel):
    number: int
    name: str

class LogoAssetPackRequest(BaseModel):
    logo_url: str
    front_tshirt_url: str
    back_tshirt_url: str
    logo_position: str = "left_chest"
    logo_scale: float = 0.24
    back_position: str = "back_center"
    back_scale: float = 0.35
    output_format: str = "png"
    quality: int = 95
    include_roster_banner: bool = True
    players: Optional[List[Player]] = None

class LogoAssetPackResponse(BaseModel):
    success: bool
    logo_slug: str
    asset_folder: str
    assets: dict
    processing_time_ms: int
    error: Optional[str] = None

class LogoAssetPackService:
    def __init__(self):
        self.output_dir = "./output/asset-packs"
        self.ai_remover = AIBackgroundRemover()
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def generate_asset_pack(self, request: LogoAssetPackRequest) -> dict:
        """Generate complete logo asset pack"""
        try:
            start_time = time.time()
            
            # Generate logo slug from URL
            logo_slug = self._generate_logo_slug(request.logo_url)
            asset_folder = os.path.join(self.output_dir, logo_slug)
            os.makedirs(asset_folder, exist_ok=True)
            
            # Step 1: Download and process logo
            logo_image = await self._download_image(request.logo_url)
            
            # Check if logo already has transparent background (from gpt-image-1)
            # If it does, skip background removal to avoid artifacts
            if self._has_transparent_background(logo_image):
                logger.info("Logo already has transparent background, skipping background removal")
                clean_logo = logo_image
            else:
                logger.info("Logo has solid background, applying background removal")
                clean_logo = await self._remove_background(logo_image)
            
            # Step 2: Save clean logo asset
            clean_logo_filename = f"{logo_slug}_clean.{request.output_format}"
            clean_logo_path = os.path.join(asset_folder, clean_logo_filename)
            await self._save_image(clean_logo, clean_logo_path, request.output_format, request.quality)
            
            # Step 3: Generate t-shirt mockup (left chest) - using front shirt
            front_tshirt_image = await self._download_image(request.front_tshirt_url)
            left_chest_mockup = await self._place_logo_on_tshirt(
                front_tshirt_image, clean_logo, 
                request.logo_position, request.logo_scale
            )
            
            left_chest_filename = f"{logo_slug}_left_chest.{request.output_format}"
            left_chest_path = os.path.join(asset_folder, left_chest_filename)
            await self._save_image(left_chest_mockup, left_chest_path, request.output_format, request.quality)
            
            # Step 4: Generate t-shirt mockup (back center) - using back shirt
            back_tshirt_image = await self._download_image(request.back_tshirt_url)
            back_center_mockup = await self._place_logo_on_tshirt(
                back_tshirt_image, clean_logo,
                request.back_position, request.back_scale
            )
            
            back_center_filename = f"{logo_slug}_back_center.{request.output_format}"
            back_center_path = os.path.join(asset_folder, back_center_filename)
            await self._save_image(back_center_mockup, back_center_path, request.output_format, request.quality)
            
            # Step 5: Generate roster banner (if requested and players provided)
            banner_result = None
            if request.include_roster_banner and request.players:
                banner_result = await self._generate_roster_banner(
                    logo_slug, clean_logo, request.players, asset_folder, request.output_format
                )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            assets = {
                "clean_logo": {
                    "filename": clean_logo_filename,
                    "path": f"./output/asset-packs/{logo_slug}/{clean_logo_filename}",
                    "file_size_bytes": os.path.getsize(clean_logo_path)
                },
                "left_chest_mockup": {
                    "filename": left_chest_filename,
                    "path": f"./output/asset-packs/{logo_slug}/{left_chest_filename}",
                    "file_size_bytes": os.path.getsize(left_chest_path)
                },
                "back_center_mockup": {
                    "filename": back_center_filename,
                    "path": f"./output/asset-packs/{logo_slug}/{back_center_filename}",
                    "file_size_bytes": os.path.getsize(back_center_path)
                }
            }
            
            # Add banner if generated
            if banner_result:
                assets["roster_banner"] = banner_result
            
            return {
                "success": True,
                "logo_slug": logo_slug,
                "asset_folder": f"./output/asset-packs/{logo_slug}",
                "assets": assets,
                "processing_time_ms": processing_time,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Asset pack generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Asset pack generation failed: {str(e)}")
    
    def _generate_logo_slug(self, logo_url: str) -> str:
        """Generate clean slug from logo URL"""
        try:
            parsed_url = urllib.parse.urlparse(logo_url)
            original_name = os.path.basename(parsed_url.path)
            name_without_ext = os.path.splitext(original_name)[0]
            
            # URL decode first
            try:
                name_without_ext = urllib.parse.unquote(name_without_ext)
            except:
                pass
            
            return slugify_filename(name_without_ext)
        except Exception:
            timestamp = int(time.time() * 1000)
            return f"logo_{timestamp}"
    
    def _has_transparent_background(self, image: Image.Image) -> bool:
        """Check if image already has transparent background"""
        try:
            # Check if image has alpha channel
            if image.mode not in ('RGBA', 'LA'):
                return False
            
            # Convert to RGBA if it's LA
            if image.mode == 'LA':
                image = image.convert('RGBA')
            
            # Get alpha channel
            alpha = image.split()[-1]
            
            # Check if there are any fully transparent pixels (alpha = 0)
            # This indicates the image has transparency
            transparent_pixels = sum(1 for pixel in alpha.getdata() if pixel == 0)
            total_pixels = alpha.size[0] * alpha.size[1]
            
            # If more than 5% of pixels are transparent, consider it to have transparent background
            transparency_ratio = transparent_pixels / total_pixels
            has_transparency = transparency_ratio > 0.05
            
            logger.info(f"Transparency check: {transparent_pixels}/{total_pixels} transparent pixels ({transparency_ratio:.2%})")
            return has_transparency
            
        except Exception as e:
            logger.warning(f"Transparency check failed: {str(e)}")
            return False

    async def _remove_background(self, logo_image: Image.Image) -> Image.Image:
        """Remove background using AI"""
        try:
            session, remove_func = self.ai_remover._get_rembg_session()
            result_image = remove_func(logo_image, session=session)
            return result_image
        except Exception as e:
            logger.warning(f"Background removal failed: {str(e)}")
            return logo_image
    
    async def _place_logo_on_tshirt(self, tshirt_image: Image.Image, logo_image: Image.Image, 
                                  position: str, scale_factor: float) -> Image.Image:
        """Place logo on t-shirt"""
        try:
            # Convert to RGBA if needed
            if tshirt_image.mode != 'RGBA':
                tshirt_image = tshirt_image.convert('RGBA')
            if logo_image.mode != 'RGBA':
                logo_image = logo_image.convert('RGBA')
            
            # Calculate logo size
            tshirt_width, tshirt_height = tshirt_image.size
            logo_width = int(tshirt_width * scale_factor)
            logo_height = int(logo_width * (logo_image.height / logo_image.width))
            
            # Resize logo
            logo_resized = logo_image.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
            
            # Calculate position
            logo_x, logo_y = self._calculate_position(position, tshirt_width, tshirt_height, logo_width, logo_height)
            
            # Create result image
            result_image = tshirt_image.copy()
            
            # Paste logo
            result_image.paste(logo_resized, (logo_x, logo_y), logo_resized)
            
            return result_image
            
        except Exception as e:
            logger.error(f"Logo placement failed: {str(e)}")
            raise Exception(f"Logo placement failed: {str(e)}")
    
    def _calculate_position(self, position: str, tshirt_width: int, tshirt_height: int, 
                          logo_width: int, logo_height: int) -> tuple[int, int]:
        """Calculate logo position"""
        if position == "left_chest":
            x = int(tshirt_width * 0.50)  # Left chest position - fine-tuned
            y = int(tshirt_height * 0.40)
        elif position == "back_center":
            x = int((tshirt_width - logo_width) / 2)
            y = int((tshirt_height - logo_height) / 2)
        else:
            x = int(tshirt_width * 0.50)
            y = int(tshirt_height * 0.40)
        
        return x, y
    
    async def _download_image(self, url: str) -> Image.Image:
        """Download image from URL or local file"""
        try:
            if url.startswith('file://'):
                file_path = url.replace('file://', '')
                return Image.open(file_path)
            else:
                import requests
                import io
                response = requests.get(url)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content))
        except Exception as e:
            raise Exception(f"Failed to download image: {str(e)}")
    
    async def _save_image(self, image: Image.Image, output_path: str, format: str, quality: int):
        """Save image with specified format and quality"""
        try:
            if format.lower() == 'png':
                image.save(output_path, 'PNG', optimize=True)
            elif format.lower() in ['jpg', 'jpeg']:
                if image.mode == 'RGBA':
                    rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                    rgb_image.paste(image, mask=image.split()[-1])
                    image = rgb_image
                image.save(output_path, 'JPEG', quality=quality, optimize=True)
            else:
                image.save(output_path, format.upper(), quality=quality)
        except Exception as e:
            raise Exception(f"Failed to save image: {str(e)}")

# Initialize service
asset_pack_service = LogoAssetPackService()

@router.post("/generate-asset-pack", response_model=LogoAssetPackResponse)
async def generate_asset_pack(request: LogoAssetPackRequest):
    """Generate complete logo asset pack with clean logo and t-shirt mockups"""
    return await asset_pack_service.generate_asset_pack(request)

@router.get("/asset-packs")
async def list_asset_packs():
    """List all generated asset packs"""
    try:
        asset_packs = []
        for folder_name in os.listdir(asset_pack_service.output_dir):
            folder_path = os.path.join(asset_pack_service.output_dir, folder_name)
            if os.path.isdir(folder_path):
                assets = []
                for filename in os.listdir(folder_path):
                    if filename.endswith(('.png', '.jpg', '.jpeg')):
                        file_path = os.path.join(folder_path, filename)
                        assets.append({
                            "filename": filename,
                            "file_size_bytes": os.path.getsize(file_path),
                            "url": f"./output/asset-packs/{folder_name}/{filename}"
                        })
                
                asset_packs.append({
                    "logo_slug": folder_name,
                    "asset_folder": f"./output/asset-packs/{folder_name}",
                    "assets": assets
                })
        
        return {
            "success": True,
            "total_packs": len(asset_packs),
            "asset_packs": asset_packs
        }
    except Exception as e:
        logger.error(f"Failed to list asset packs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list asset packs: {str(e)}")
