from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import cv2
import numpy as np
from PIL import Image
import os
import time
import logging
import io

logger = logging.getLogger(__name__)

router = APIRouter()

class Player(BaseModel):
    number: int
    name: str

class LogoPlacementRequest(BaseModel):
    tshirt_image_url: str
    logo_url: Optional[str] = None  # Optional when roster-only mode
    position: str = "left_chest"  # left_chest, center_chest, back_center
    scale_factor: float = 0.15  # Logo size as fraction of t-shirt width
    rotation: float = 0.0  # Logo rotation in degrees
    opacity: float = 1.0  # Logo opacity (0.0 to 1.0)
    output_format: str = "png"
    quality: int = 95
    auto_remove_background: bool = True  # Automatically remove background from logo
    include_roster: bool = False  # Add team roster to back shirt
    players: Optional[List[Player]] = None  # Team roster players

class LogoPlacementResponse(BaseModel):
    success: bool
    processed_url: str
    original_tshirt_url: str
    original_logo_url: str
    position_used: str
    scale_factor_used: float
    file_size_bytes: int
    processing_time_ms: int
    error: Optional[str] = None

class LogoPlacementService:
    def __init__(self):
        self.output_dir = "./output"
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def place_logo_on_tshirt(
        self,
        tshirt_url: str,
        logo_url: Optional[str] = None,
        position: str = "left_chest",
        scale_factor: float = 0.15,
        rotation: float = 0.0,
        opacity: float = 1.0,
        output_format: str = "png",
        quality: int = 95,
        auto_remove_background: bool = True,
        include_roster: bool = False,
        players: Optional[List[Player]] = None
    ) -> str:
        """Place logo on t-shirt at specified position"""
        try:
            start_time = time.time()
            
            # Download t-shirt image
            tshirt_image = await self._download_image(tshirt_url)
            
            # Convert to RGBA if needed
            if tshirt_image.mode != 'RGBA':
                tshirt_image = tshirt_image.convert('RGBA')
            
            # Check if this is roster-only mode (back center with roster, no logo)
            if include_roster and players and position == "back_center":
                # Roster-only mode - just add roster text to t-shirt
                result_image = await self._add_roster_text(tshirt_image, players)
            else:
                # Normal logo placement mode - require logo_url
                if not logo_url:
                    raise ValueError("logo_url is required for logo placement mode")
                
                # Download logo image
                logo_image = await self._download_image(logo_url)
                
                # Remove background from logo if requested
                if auto_remove_background:
                    logo_image = await self._remove_logo_background(logo_image)
                
                if logo_image.mode != 'RGBA':
                    logo_image = logo_image.convert('RGBA')
                
                # Calculate logo size based on t-shirt width
                tshirt_width, tshirt_height = tshirt_image.size
                logo_size = int(tshirt_width * scale_factor)
                
                # Resize logo maintaining aspect ratio
                logo_aspect = logo_image.width / logo_image.height
                if logo_aspect > 1:
                    new_width = logo_size
                    new_height = int(logo_size / logo_aspect)
                else:
                    new_height = logo_size
                    new_width = int(logo_size * logo_aspect)
                
                logo_resized = logo_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Rotate logo if needed
                if rotation != 0:
                    logo_resized = logo_resized.rotate(rotation, expand=True)
                
                # Apply opacity
                if opacity < 1.0:
                    alpha = logo_resized.split()[-1]
                    alpha = alpha.point(lambda p: int(p * opacity))
                    logo_resized.putalpha(alpha)
                
                # Calculate position
                logo_x, logo_y = self._calculate_position(
                    position, tshirt_width, tshirt_height, 
                    logo_resized.width, logo_resized.height
                )
                
                print(f"Final paste coordinates: x={logo_x}, y={logo_y}")
                print(f"Logo size: {logo_resized.width}x{logo_resized.height}")
                print(f"T-shirt size: {tshirt_width}x{tshirt_height}")
                
                # Create a copy of t-shirt for composition
                result_image = tshirt_image.copy()
                
                # Paste logo onto t-shirt
                if logo_resized.mode == 'RGBA':
                    result_image.paste(logo_resized, (logo_x, logo_y), logo_resized)
                else:
                    result_image.paste(logo_resized, (logo_x, logo_y))
            
            # Save result
            output_filename = f"tshirt_with_logo_{int(time.time() * 1000)}.{output_format}"
            output_path = os.path.join(self.output_dir, output_filename)
            
            if output_format.lower() == 'png':
                result_image.save(output_path, 'PNG', optimize=True)
            elif output_format.lower() in ['jpg', 'jpeg']:
                # Convert to RGB for JPEG
                rgb_image = Image.new('RGB', result_image.size, (255, 255, 255))
                rgb_image.paste(result_image, mask=result_image.split()[-1] if result_image.mode == 'RGBA' else None)
                rgb_image.save(output_path, 'JPEG', quality=quality, optimize=True)
            
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"Logo placement completed in {processing_time}ms")
            
            return f"./output/{output_filename}"
            
        except Exception as e:
            logger.error(f"Logo placement failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Logo placement failed: {str(e)}")
    
    def _calculate_position(self, position: str, tshirt_width: int, tshirt_height: int, 
                          logo_width: int, logo_height: int) -> tuple[int, int]:
        """Calculate logo position based on t-shirt dimensions"""
        
        if position == "left_chest":
            # Left chest area - more towards the left edge and lower on chest
            x = int(tshirt_width * 0.50)  # More towards the left edge
            y = int(tshirt_height * 0.40)  # Lower on chest
            
        elif position == "center_chest":
            # Center chest area
            x = int((tshirt_width - logo_width) / 2)
            y = int(tshirt_height * 0.25)  # Same height as left chest
            
        elif position == "back_center":
            # Back center - larger logo, centered
            x = int((tshirt_width - logo_width) / 2.5)
            y = int((tshirt_height - logo_height) / 2)
            
        else:
            # Default to left chest
            x = int(tshirt_width * 0.65)
            y = int(tshirt_height * 0.25)
        
        return x, y
    
    async def _remove_logo_background(self, logo_image: Image.Image) -> Image.Image:
        """Remove background from logo using AI"""
        try:
            # Only import when needed to avoid startup delays
            from services.ai_background_remover import AIBackgroundRemover
            
            # Use AI background remover
            ai_remover = AIBackgroundRemover()
            
            # Get rembg session
            session, remove_func = ai_remover._get_rembg_session()
            
            # Remove background using AI
            result_image = remove_func(logo_image, session=session)
            
            return result_image
            
        except Exception as e:
            logger.warning(f"AI background removal failed, using original logo: {str(e)}")
            return logo_image
    
    async def _download_image(self, url: str) -> Image.Image:
        """Download image from URL or local file"""
        try:
            if url.startswith('file://'):
                # Local file
                file_path = url.replace('file://', '')
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"File not found: {file_path}")
                return Image.open(file_path)
            elif url.startswith(('http://', 'https://')):
                # HTTP URL
                import requests
                response = requests.get(url)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content))
            else:
                # Assume local file path
                if not os.path.exists(url):
                    raise FileNotFoundError(f"File not found: {url}")
                return Image.open(url)
        except Exception as e:
            logger.error(f"Failed to load image {url}: {str(e)}")
            raise Exception(f"Failed to load image: {str(e)}")
    
    async def _add_roster_text(self, tshirt_image: Image.Image, players: List[Player]) -> Image.Image:
        """Add team roster text to t-shirt image"""
        try:
            from PIL import ImageDraw, ImageFont
            
            # Create drawing context
            draw = ImageDraw.Draw(tshirt_image)
            
            # Use default font to avoid loading issues
            number_font = ImageFont.load_default()
            name_font = ImageFont.load_default()
            
            # Calculate text position (center of t-shirt, below logo area)
            tshirt_width, tshirt_height = tshirt_image.size
            text_x = tshirt_width // 2
            text_y = int(tshirt_height * 0.7)  # 70% down from top
            
            # Calculate fixed name alignment
            max_number_width = 0
            for player in players:
                number_text = f"{player.number:2d}"
                if number_font:
                    number_bbox = draw.textbbox((0, 0), number_text, font=number_font)
                    number_width = number_bbox[2] - number_bbox[0]
                    max_number_width = max(max_number_width, number_width)
                else:
                    max_number_width = max(max_number_width, 20)
            
            # Draw title
            title_text = "TEAM ROSTER"
            if name_font:
                title_bbox = draw.textbbox((0, 0), title_text, font=name_font)
                title_width = title_bbox[2] - title_bbox[0]
                title_x = text_x - title_width // 2
                draw.text((title_x, text_y), title_text, font=name_font, fill="#000000")
            
            text_y += 30  # Space after title
            
            # Draw players
            for player in players:
                number_text = f"{player.number:2d}"
                name_text = player.name
                
                # Draw number
                if number_font:
                    number_bbox = draw.textbbox((0, 0), number_text, font=number_font)
                    number_width = number_bbox[2] - number_bbox[0]
                    number_x = text_x - max_number_width - 10  # Right-align numbers
                    draw.text((number_x, text_y), number_text, font=number_font, fill="#000000")
                
                # Draw name at fixed position
                name_x = text_x - max_number_width + 10  # Left-align names
                if name_font:
                    draw.text((name_x, text_y), name_text, font=name_font, fill="#000000")
                
                text_y += 25  # Line height
                
                # If we run out of space, move to next column
                if text_y > tshirt_height - 50:
                    text_x += 150
                    text_y = int(tshirt_height * 0.7) + 30
            
            return tshirt_image
            
        except Exception as e:
            logger.error(f"Failed to add roster text: {str(e)}")
            return tshirt_image

# Initialize service
logo_placement_service = LogoPlacementService()

@router.post("/place-logo", response_model=LogoPlacementResponse)
async def place_logo_on_tshirt(request: LogoPlacementRequest):
    """Place logo on t-shirt at specified position"""
    try:
        start_time = time.time()
        
        processed_url = await logo_placement_service.place_logo_on_tshirt(
            tshirt_url=request.tshirt_image_url,
            logo_url=request.logo_url,
            position=request.position,
            scale_factor=request.scale_factor,
            rotation=request.rotation,
            opacity=request.opacity,
            output_format=request.output_format,
            quality=request.quality,
            auto_remove_background=request.auto_remove_background,
            include_roster=request.include_roster,
            players=request.players
        )
        
        # Get file size
        file_size = os.path.getsize(processed_url) if os.path.exists(processed_url) else 0
        processing_time = int((time.time() - start_time) * 1000)
        
        return LogoPlacementResponse(
            success=True,
            processed_url=processed_url,
            original_tshirt_url=request.tshirt_image_url,
            original_logo_url=request.logo_url,
            position_used=request.position,
            scale_factor_used=request.scale_factor,
            file_size_bytes=file_size,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Logo placement API error: {str(e)}")
        return LogoPlacementResponse(
            success=False,
            processed_url="",
            original_tshirt_url=request.tshirt_image_url,
            original_logo_url=request.logo_url,
            position_used=request.position,
            scale_factor_used=request.scale_factor,
            file_size_bytes=0,
            processing_time_ms=0,
            error=str(e)
        )

class BatchLogoPlacementRequest(BaseModel):
    tshirt_url: str
    logo_urls: list[str]
    positions: list[str] = ["left_chest"]
    scale_factors: list[float] = [0.15]
    output_format: str = "png"

@router.post("/batch-place-logos")
async def batch_place_logos(request: BatchLogoPlacementRequest):
    """Place multiple logos on t-shirt for asset pack generation"""
    try:
        results = []
        
        for i, logo_url in enumerate(request.logo_urls):
            position = request.positions[i % len(request.positions)]
            scale_factor = request.scale_factors[i % len(request.scale_factors)]
            
            processed_url = await logo_placement_service.place_logo_on_tshirt(
                tshirt_url=request.tshirt_url,
                logo_url=logo_url,
                position=position,
                scale_factor=scale_factor,
                output_format=request.output_format
            )
            
            results.append({
                "logo_index": i,
                "logo_url": logo_url,
                "position": position,
                "scale_factor": scale_factor,
                "processed_url": processed_url
            })
        
        return {
            "success": True,
            "tshirt_url": request.tshirt_url,
            "total_logos": len(request.logo_urls),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Batch logo placement failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")
