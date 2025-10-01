"""
Banner Generator API - Create sports banners with team rosters
"""
import os
import time
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO
import urllib.parse

logger = logging.getLogger(__name__)
router = APIRouter()

class Player(BaseModel):
    number: int
    name: str

class BannerStyle(BaseModel):
    background_image_url: Optional[str] = None  # Use custom background image
    background_color: str = "#ffffff"  # Fallback if no image
    text_color: str = "#000000"
    number_color: str = "#000000"
    logo_position: str = "left"  # left, center, right
    player_layout: str = "vertical"  # horizontal, vertical
    banner_width: int = 1200
    banner_height: int = 400
    number_font_size: int = 36
    name_font_size: int = 24
    logo_scale: float = 0.3025  # 10% bigger than previous (0.275 * 1.1)
    use_preprocessed_logo: bool = True  # Use clean logo with background removed

class BannerRequest(BaseModel):
    logo_url: str
    players: List[Player]
    style: Optional[BannerStyle] = None

class BannerResponse(BaseModel):
    success: bool
    banner_url: str
    filename: str
    file_size_bytes: int
    processing_time_ms: int
    error: Optional[str] = None

class BannerGeneratorService:
    def __init__(self):
        self.output_dir = "./output/banners"
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Try to load system fonts, fallback to default
        self.number_font = self._load_font("Arial Bold", 48)
        self.name_font = self._load_font("Arial", 32)
    
    def _load_font(self, font_name: str, size: int):
        """Load font with fallback to default"""
        try:
            # Try to load system font
            return ImageFont.truetype(font_name, size)
        except:
            try:
                # Try common system font paths
                font_paths = [
                    "/System/Library/Fonts/Arial.ttf",
                    "/System/Library/Fonts/Helvetica.ttc",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
                ]
                for path in font_paths:
                    if os.path.exists(path):
                        return ImageFont.truetype(path, size)
            except:
                pass
        
        # Fallback to default font
        try:
            return ImageFont.load_default()
        except:
            return None
    
    async def generate_roster_banner(self, request: BannerRequest) -> dict:
        """Generate team roster banner"""
        try:
            start_time = time.time()
            
            # Use default style if not provided
            style = request.style or BannerStyle()
            
            # Create banner canvas with background image or color
            if style.background_image_url:
                banner = await self._create_banner_with_background(style)
                # Update style dimensions to match the actual banner size
                style.banner_width, style.banner_height = banner.size
            else:
                banner = Image.new('RGB', (style.banner_width, style.banner_height), style.background_color)
            
            draw = ImageDraw.Draw(banner)
            
            # Download and process logo (preprocess if requested)
            logo_image = await self._download_image(request.logo_url)
            if style.use_preprocessed_logo:
                logo_image = await self._preprocess_logo(logo_image)
            logo_image = await self._resize_logo(logo_image, style)
            
            # Calculate layout
            logo_width, logo_height = logo_image.size
            logo_x, logo_y = self._calculate_logo_position(style, logo_width, logo_height)
            
            # Paste logo
            banner.paste(logo_image, (logo_x, logo_y), logo_image if logo_image.mode == 'RGBA' else None)
            
            # Draw player roster
            await self._draw_player_roster(draw, request.players, style, logo_x + logo_width + 30)
            
            # Save banner
            filename = f"roster_banner_{int(time.time() * 1000)}.png"
            output_path = os.path.join(self.output_dir, filename)
            banner.save(output_path, 'PNG')
            
            processing_time = int((time.time() - start_time) * 1000)
            file_size = os.path.getsize(output_path)
            
            return {
                "success": True,
                "banner_url": f"./output/banners/{filename}",
                "filename": filename,
                "file_size_bytes": file_size,
                "processing_time_ms": processing_time,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Banner generation failed: {str(e)}")
            return {
                "success": False,
                "banner_url": None,
                "filename": None,
                "file_size_bytes": 0,
                "processing_time_ms": 0,
                "error": str(e)
            }
    
    async def _download_image(self, url: str) -> Image.Image:
        """Download image from URL or local file"""
        try:
            if url.startswith('file://'):
                file_path = url.replace('file://', '')
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"File not found: {file_path}")
                return Image.open(file_path)
            else:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                return Image.open(BytesIO(response.content))
        except Exception as e:
            logger.error(f"Failed to load image {url}: {str(e)}")
            raise Exception(f"Failed to load image: {str(e)}")
    
    async def _resize_logo(self, logo_image: Image.Image, style: BannerStyle) -> Image.Image:
        """Resize logo to fit banner"""
        try:
            # Calculate logo size based on banner height and scale
            max_height = int(style.banner_height * style.logo_scale)
            max_width = int(style.banner_width * style.logo_scale)
            
            # Maintain aspect ratio
            logo_image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Convert to RGBA if needed
            if logo_image.mode != 'RGBA':
                logo_image = logo_image.convert('RGBA')
            
            return logo_image
        except Exception as e:
            logger.error(f"Logo resize failed: {str(e)}")
            return logo_image
    
    def _calculate_logo_position(self, style: BannerStyle, logo_width: int, logo_height: int) -> tuple[int, int]:
        """Calculate logo position on banner with custom offsets"""
        if style.logo_position == "left":
            x = int(style.banner_width * 0.10)  # 10% from left
        elif style.logo_position == "center":
            x = (style.banner_width - logo_width) // 2
        else:  # right
            x = style.banner_width - logo_width - 20
        
        # Move down 15% from center
        y = int((style.banner_height - logo_height) // 2 + style.banner_height * 0.15)
        return x, y
    
    async def _draw_player_roster(self, draw: ImageDraw.Draw, players: List[Player], style: BannerStyle, start_x: int):
        """Draw player roster on banner in vertical list format"""
        try:
            # Position text right 50% and down 10% from center
            current_x = int(style.banner_width * 0.50)  # 50% from left
            current_y = int(style.banner_height * 0.60)  # 60% from top (down 10% from center)
            
            # Draw title
            title_text = "TEAM ROSTER"
            if self.name_font:
                # Make title bold by drawing twice with slight offset
                draw.text((current_x, current_y), title_text, 
                        font=self.name_font, fill="#000000")  # Black text
                draw.text((current_x + 1, current_y + 1), title_text, 
                        font=self.name_font, fill="#000000")  # Black text
            
            current_y += 50  # More space after title (increased from 40)
            
            # Calculate fixed name alignment position
            # Find the widest number to ensure consistent name alignment
            max_number_width = 0
            if self.number_font:
                for player in players:
                    number_text = f"{player.number:2d}"
                    number_bbox = draw.textbbox((0, 0), number_text, font=self.number_font)
                    number_width = number_bbox[2] - number_bbox[0]
                    max_number_width = max(max_number_width, number_width)
            else:
                max_number_width = 30  # Fallback estimate
            
            # Fixed position for all names
            name_x = current_x + max_number_width + 20  # Consistent spacing after numbers
            
            # Draw players in vertical list
            for i, player in enumerate(players):
                # Draw player number and name on same line
                number_text = f"{player.number:2d}"  # Right-align numbers
                name_text = player.name
                
                # Draw number (bold, larger)
                if self.number_font:
                    draw.text((current_x, current_y), number_text, 
                            font=self.number_font, fill="#000000")  # Black text
                
                # Draw name at fixed position (all names align)
                if self.name_font:
                    draw.text((name_x, current_y + 8), name_text, 
                            font=self.name_font, fill="#000000")  # Black text
                
                # Move to next line with more spacing
                current_y += 45  # Increased line height (from 35)
                
                # If we run out of vertical space, move to next column
                if current_y > style.banner_height - 50:
                    current_x += 200  # Move to next column
                    current_y = int(style.banner_height * 0.60) + 90  # Reset to start of list
                
        except Exception as e:
            logger.error(f"Failed to draw player roster: {str(e)}")
            raise
    
    async def _create_banner_with_background(self, style: BannerStyle) -> Image.Image:
        """Create banner using the template image's natural dimensions"""
        try:
            # Download background image
            bg_image = await self._download_image(style.background_image_url)
            
            # Use the template image's natural dimensions
            # Convert to RGB if needed (in case it's RGBA)
            if bg_image.mode == 'RGBA':
                # Create a white background and paste the image on top
                banner = Image.new('RGB', bg_image.size, (255, 255, 255))
                banner.paste(bg_image, (0, 0), bg_image)
            else:
                banner = bg_image.convert('RGB')
            
            return banner
        except Exception as e:
            logger.error(f"Failed to create banner with background: {str(e)}")
            # Fallback to solid color with requested dimensions
            return Image.new('RGB', (style.banner_width, style.banner_height), style.background_color)
    
    async def _preprocess_logo(self, logo_image: Image.Image) -> Image.Image:
        """Preprocess logo to remove background"""
        try:
            from services.ai_background_remover import AIBackgroundRemover
            
            # Use AI background remover
            ai_remover = AIBackgroundRemover()
            session, remove_func = ai_remover._get_rembg_session()
            
            # Remove background using AI
            result_image = remove_func(logo_image, session=session)
            
            return result_image
            
        except Exception as e:
            logger.warning(f"Logo preprocessing failed: {str(e)}")
            return logo_image

# Initialize service
banner_service = BannerGeneratorService()

@router.post("/generate-roster-banner", response_model=BannerResponse)
async def generate_roster_banner(request: BannerRequest):
    """Generate team roster banner with player names and numbers"""
    return await banner_service.generate_roster_banner(request)

@router.get("/banners")
async def list_banners():
    """List all generated banners"""
    try:
        banners = []
        for filename in os.listdir(banner_service.output_dir):
            file_path = os.path.join(banner_service.output_dir, filename)
            if os.path.isfile(file_path):
                banners.append({
                    "filename": filename,
                    "url": f"./output/banners/{filename}",
                    "size_bytes": os.path.getsize(file_path),
                    "created_at": os.path.getctime(file_path)
                })
        return {"success": True, "banners": banners}
    except Exception as e:
        logger.error(f"Failed to list banners: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list banners: {str(e)}")
