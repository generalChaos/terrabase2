"""
Logo Overlay Service
Handles logo placement on t-shirts and banner creation
"""

import os
import time
import logging
import requests
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, List, Any, Optional
from src.utils.filename_utils import generate_pipeline_filename
from src.storage import storage

logger = logging.getLogger(__name__)

class LogoOverlayService:
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        self.assets_dir = os.getenv("ASSETS_DIR", "./assets")
        
        # Initialize storage service
        self.storage = storage
        
        # Create directories if they don't exist (only if we have write permissions)
        try:
            os.makedirs(self.temp_dir, exist_ok=True)
            os.makedirs(self.output_dir, exist_ok=True)
            os.makedirs(self.assets_dir, exist_ok=True)
        except OSError:
            # If we can't create directories, continue without them
            pass

    async def _upload_to_storage(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Upload file to storage and return public URL"""
        storage_file = await self.storage.upload_file(
            file_data=file_data,
            file_name=filename,
            bucket="team-assets",
            content_type=content_type
        )
        return storage_file.public_url

    async def overlay_logo_on_tshirt(
        self,
        logo_url: str,
        tshirt_color: str = "black",
        position: str = "left_chest",
        output_format: str = "png",
        quality: int = 95
    ) -> Dict[str, Any]:
        """
        Overlay logo on t-shirt front
        
        Args:
            logo_url: URL of the logo image
            tshirt_color: T-shirt color (black, white)
            position: Logo position (left_chest, center_chest)
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and t-shirt URL
        """
        start_time = time.time()
        
        try:
            # Load t-shirt template
            tshirt_template_path = os.path.join(self.assets_dir, f"{tshirt_color}_tshirt_front.png")
            if not os.path.exists(tshirt_template_path):
                return {
                    "success": False,
                    "error": f"T-shirt template not found: {tshirt_template_path}"
                }
            
            # Load images using unified handler
            from src.utils.image_handler import image_handler
            
            tshirt_img = Image.open(tshirt_template_path).convert("RGBA")
            logo_img = await image_handler.load_image(logo_url)
            
            # Calculate logo size and position
            logo_width, logo_height = self._calculate_logo_size(tshirt_img, logo_img, position)
            logo_x, logo_y = self._calculate_logo_position(tshirt_img, logo_width, logo_height, position)
            
            # Resize logo
            logo_resized = logo_img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
            
            # Remove white/light background from logo
            logo_cleaned = self._remove_logo_background(logo_resized)
            
            # Create result image
            result_img = tshirt_img.copy()
            
            # Paste logo onto t-shirt
            result_img.paste(logo_cleaned, (logo_x, logo_y), logo_cleaned)
            
            # Upload to Supabase storage
            filename = generate_pipeline_filename("team", [f"tshirt-{tshirt_color}-front"], output_format)
            
            # Convert to bytes
            import io
            img_bytes = io.BytesIO()
            if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                result_img = result_img.convert("RGB")
                result_img.save(img_bytes, "JPEG", quality=quality, optimize=True)
                content_type = "image/jpeg"
            else:
                result_img.save(img_bytes, output_format.upper(), quality=quality, optimize=True)
                content_type = f"image/{output_format.lower()}"
            
            img_bytes.seek(0)
            
            storage_file = await self._upload_to_storage(
                file_data=img_bytes.getvalue(),
                filename=filename,
                content_type=content_type
            )
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "output_url": storage_file,
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": len(img_bytes.getvalue())
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }

    async def overlay_roster_on_tshirt_back(
        self,
        players: List[Dict[str, Any]],
        tshirt_color: str = "black",
        output_format: str = "png",
        quality: int = 95,
        logo_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Overlay player roster on t-shirt back
        
        Args:
            players: List of player dictionaries with 'number' and 'name'
            tshirt_color: T-shirt color (black, white)
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            logo_url: Optional URL of logo to display above roster
            
        Returns:
            Dictionary with success status and t-shirt URL
        """
        start_time = time.time()
        
        try:
            # Load t-shirt template
            tshirt_template_path = os.path.join(self.assets_dir, f"{tshirt_color}_tshirt_back.png")
            if not os.path.exists(tshirt_template_path):
                return {
                    "success": False,
                    "error": f"T-shirt back template not found: {tshirt_template_path}"
                }
            
            # Load t-shirt image
            tshirt_img = Image.open(tshirt_template_path).convert("RGBA")
            
            # Create result image
            result_img = tshirt_img.copy()
            draw = ImageDraw.Draw(result_img)
            
            # Try to load fonts, fallback to default if not available
            try:
                # Try Impact first (blocky and thick), then Arial Black, then Arial Bold, then default
                try:
                    number_font = ImageFont.truetype("/System/Library/Fonts/Impact.ttf", 36)  # 10% smaller (40 * 0.9)
                    name_font = ImageFont.truetype("/System/Library/Fonts/Impact.ttf", 24)     # 10% smaller (27 * 0.9)
                except (OSError, IOError):
                    try:
                        number_font = ImageFont.truetype("/System/Library/Fonts/Arial Black.ttf", 36)  # 10% smaller (40 * 0.9)
                        name_font = ImageFont.truetype("/System/Library/Fonts/Arial Black.ttf", 24)    # 10% smaller (27 * 0.9)
                    except (OSError, IOError):
                        try:
                            number_font = ImageFont.truetype("arial.ttf", 36)  # 10% smaller (40 * 0.9)
                            name_font = ImageFont.truetype("arial.ttf", 24)    # 10% smaller (27 * 0.9)
                        except (OSError, IOError):
                            number_font = ImageFont.load_default()
                            name_font = ImageFont.load_default()
            except Exception:
                number_font = ImageFont.load_default()
                name_font = ImageFont.load_default()
            
            # Set text color based on t-shirt color
            text_color = (255, 255, 255) if tshirt_color == "black" else (0, 0, 0)
            
            # Calculate roster position (center of t-shirt back, moved 20% left, then right 10% and up 30%)
            tshirt_width, tshirt_height = tshirt_img.size
            start_x = int(tshirt_width * 0.3) + int(tshirt_width * 0.1)  # Move 20% left from center, then right 10%
            start_y = tshirt_height // 2 - 80 - int(tshirt_height * 0.3)  # Center vertically, then up 30% (20% + 10%)
            line_height = 32  # Adjusted spacing for smaller text (36 * 0.9)
            current_y = start_y
            
            # Add small logo above roster if provided
            if logo_url:
                try:
                    # Download and process logo
                    logo_path = await self._download_image(logo_url)
                    if logo_path:
                        logo_img = Image.open(logo_path)
                        
                        # Resize logo to small size (about 9% of t-shirt width - 10% smaller)
                        logo_size = int(tshirt_width * 0.09)
                        logo_img = logo_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
                        
                        # Convert to RGBA to ensure transparency support
                        if logo_img.mode != 'RGBA':
                            logo_img = logo_img.convert('RGBA')
                        
                        # Simple background removal - make white/light backgrounds transparent
                        data = logo_img.getdata()
                        new_data = []
                        for item in data:
                            # If pixel is white or very light, make it transparent
                            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                                new_data.append((255, 255, 255, 0))  # Transparent
                            else:
                                new_data.append(item)
                        logo_img.putdata(new_data)
                        
                        # Position logo above roster (centered horizontally)
                        logo_x = start_x + 30  # Align with roster text
                        logo_y = start_y - logo_size - 20  # 20px gap above roster
                        
                        # Paste logo onto t-shirt with transparency
                        result_img.paste(logo_img, (logo_x, logo_y), logo_img)
                        
                        # Adjust roster start position to account for logo
                        current_y = start_y
                except Exception as e:
                    logger.warning(f"Failed to add logo above roster: {str(e)}")
                    current_y = start_y
            else:
                current_y = start_y
            
            # Draw roster
            for player in players:
                number_text = str(player["number"])
                # Extract first name or use nickname (single word names)
                full_name = player["name"].strip()
                if ' ' in full_name:
                    name_text = full_name.split()[0].upper()  # Extract first name
                else:
                    name_text = full_name.upper()  # Use nickname/single name as-is
                
                # Get text dimensions for right alignment
                number_bbox = draw.textbbox((0, 0), number_text, font=number_font)
                number_width = number_bbox[2] - number_bbox[0]
                
                # Right-align numbers by calculating position
                number_x = start_x + 60 - number_width  # 60px column width, right-aligned
                
                # Draw number (right-aligned)
                draw.text((number_x, current_y), number_text, fill=text_color, font=number_font)
                
                # Draw name (offset to the right of the number column)
                name_x = start_x + 80  # Start after the number column
                draw.text((name_x, current_y + 8), name_text, fill=text_color, font=name_font)
                
                current_y += line_height
            
            # Save result to storage
            filename = generate_pipeline_filename("team", [f"tshirt-{tshirt_color}-back"], output_format)
            
            # Convert to bytes
            import io
            img_bytes = io.BytesIO()
            if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                result_img = result_img.convert("RGB")
                result_img.save(img_bytes, "JPEG", quality=quality, optimize=True)
                content_type = "image/jpeg"
            else:
                result_img.save(img_bytes, output_format.upper(), quality=quality, optimize=True)
                content_type = f"image/{output_format.lower()}"
            
            img_bytes.seek(0)
            
            storage_file = await self._upload_to_storage(
                file_data=img_bytes.getvalue(),
                filename=filename,
                content_type=content_type
            )
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "output_url": storage_file,
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": len(img_bytes.getvalue())
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }

    async def create_banner(
        self,
        logo_url: str,
        team_name: str,
        players: List[Dict[str, Any]],
        output_format: str = "png",
        quality: int = 95
    ) -> Dict[str, Any]:
        """
        Create team banner with logo and roster
        
        Args:
            logo_url: URL of the logo image
            team_name: Name of the team
            players: List of player dictionaries with 'number' and 'name'
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and banner URL
        """
        start_time = time.time()
        
        try:
            # Load banner template from test-input
            banner_template_path = os.path.join(self.assets_dir, "..", "test-input", "banner", "banner-template.png")
            if not os.path.exists(banner_template_path):
                return {
                    "success": False,
                    "error": f"Banner template not found: {banner_template_path}"
                }
            
            # Download logo
            logo_path = await self._download_image(logo_url)
            if not logo_path:
                return {
                    "success": False,
                    "error": "Failed to download logo"
                }
            
            # Load images
            banner_img = Image.open(banner_template_path).convert("RGBA")
            logo_img = Image.open(logo_path).convert("RGBA")
            
            # Calculate logo size and position
            logo_width, logo_height = self._calculate_banner_logo_size(banner_img, logo_img)
            logo_x, logo_y = self._calculate_banner_logo_position(banner_img, logo_width, logo_height)
            
            # Resize logo
            logo_resized = logo_img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
            
            # Remove white/light background from logo
            logo_cleaned = self._remove_logo_background(logo_resized)
            
            # Create result image
            result_img = banner_img.copy()
            
            # Paste logo onto banner
            result_img.paste(logo_cleaned, (logo_x, logo_y), logo_cleaned)
            
            # Add roster text in single column format
            draw = ImageDraw.Draw(result_img)
            
            # Try to load fonts, fallback to default if not available
            try:
                # Try Impact first (blocky and thick), then Arial Black, then Arial, then default
                try:
                    roster_font = ImageFont.truetype("/System/Library/Fonts/Impact.ttf", 36)
                except (OSError, IOError):
                    try:
                        roster_font = ImageFont.truetype("/System/Library/Fonts/Arial Black.ttf", 36)
                    except (OSError, IOError):
                        try:
                            roster_font = ImageFont.truetype("arial.ttf", 36)
                        except (OSError, IOError):
                            roster_font = ImageFont.load_default()
            except Exception:
                roster_font = ImageFont.load_default()
            
            # Add roster in single column format with right-aligned numbers
            roster_x = int(banner_img.width * 0.6)  # Position on right side
            roster_y = int(banner_img.height * 0.34)  # Move up another 3% (0.37 - 0.03 = 0.34)
            line_height = 40  # Spacing between lines
            number_column_width = 60  # Fixed width for number column
            name_spacing = 20  # Space between number and name
            
            # Extract first names or use nicknames (single word names) and draw in column
            for i, p in enumerate(players):
                full_name = p['name'].strip()
                if ' ' in full_name:
                    first_name = full_name.split()[0]  # Extract first name
                else:
                    first_name = full_name  # Use nickname/single name as-is
                
                # Get text dimensions for right alignment
                number_text = str(p['number'])
                name_text = first_name.upper()
                
                # Calculate number position (right-aligned in column)
                number_bbox = draw.textbbox((0, 0), number_text, font=roster_font)
                number_width = number_bbox[2] - number_bbox[0]
                number_x = roster_x + number_column_width - number_width  # Right-aligned
                
                # Calculate name position (fixed spacing after number column)
                name_x = roster_x + number_column_width + name_spacing
                
                current_y = roster_y + (i * line_height)
                
                # Draw number (right-aligned)
                draw.text((number_x, current_y), number_text, fill=(0, 0, 0), font=roster_font)
                # Draw name (fixed position)
                draw.text((name_x, current_y), name_text, fill=(0, 0, 0), font=roster_font)
            
            # Save result to storage
            filename = generate_pipeline_filename(team_name, ["banner"], output_format)
            
            # Convert to bytes
            import io
            img_bytes = io.BytesIO()
            if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                result_img = result_img.convert("RGB")
                result_img.save(img_bytes, "JPEG", quality=quality, optimize=True)
                content_type = "image/jpeg"
            else:
                result_img.save(img_bytes, output_format.upper(), quality=quality, optimize=True)
                content_type = f"image/{output_format.lower()}"
            
            # Upload to Supabase storage
            storage_file = await self._upload_to_storage(
                file_data=img_bytes.getvalue(),
                filename=filename,
                content_type=content_type
            )
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "output_url": storage_file,
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": len(img_bytes.getvalue())
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }

    def _calculate_logo_size(self, tshirt_img: Image.Image, logo_img: Image.Image, position: str) -> tuple:
        """Calculate appropriate logo size for t-shirt"""
        tshirt_width, tshirt_height = tshirt_img.size
        logo_width, logo_height = logo_img.size
        
        # Calculate target size (15% of t-shirt width)
        target_width = int(tshirt_width * 0.15)
        aspect_ratio = logo_width / logo_height
        target_height = int(target_width / aspect_ratio)
        
        return target_width, target_height

    def _calculate_logo_position(self, tshirt_img: Image.Image, logo_width: int, logo_height: int, position: str) -> tuple:
        """Calculate logo position on t-shirt"""
        tshirt_width, tshirt_height = tshirt_img.size
        
        if position == "center_chest":
            x = int((tshirt_width - logo_width) / 2)
            y = int(tshirt_height * 0.35)  # Lower on chest
        else:  # left_chest (from wearer's perspective, left side of image)
            x = int(tshirt_width * 0.55)  # Move more to the left to align with blue dot
            y = int(tshirt_height * 0.45)  # Move slightly higher to align with blue dot
        
        print(f"DEBUG: Position calculation - tshirt: {tshirt_width}x{tshirt_height}, logo: {logo_width}x{logo_height}, position: {position}")
        print(f"DEBUG: Calculated position - x: {x}, y: {y}")
        
        return x, y

    def _calculate_banner_logo_size(self, banner_img: Image.Image, logo_img: Image.Image) -> tuple:
        """Calculate appropriate logo size for banner"""
        banner_width, banner_height = banner_img.size
        logo_width, logo_height = logo_img.size
        
        # Calculate target size (20% of banner width, then make 40% bigger)
        base_width = int(banner_width * 0.20)
        target_width = int(base_width * 1.4)  # 40% bigger
        aspect_ratio = logo_width / logo_height
        target_height = int(target_width / aspect_ratio)
        
        return target_width, target_height

    def _calculate_banner_logo_position(self, banner_img: Image.Image, logo_width: int, logo_height: int) -> tuple:
        """Calculate logo position on banner"""
        banner_width, banner_height = banner_img.size
        
        # Position logo: 20% right, 40% down, then up 10% from previous position
        x = int(banner_width * 0.25)  # 5% + 20% = 25% from left
        y = int(banner_height * 0.4)  # 50% - 10% = 40% from top
        
        return x, y

    def _remove_logo_background(self, logo_img: Image.Image) -> Image.Image:
        """Remove white/light background from logo image"""
        try:
            # Convert to RGBA if not already
            if logo_img.mode != 'RGBA':
                logo_img = logo_img.convert('RGBA')
            
            # Get image data
            data = logo_img.getdata()
            new_data = []
            
            for item in data:
                # If pixel is white or very light, make it transparent
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))  # Transparent
                else:
                    new_data.append(item)
            
            # Create new image with transparent background
            logo_img.putdata(new_data)
            return logo_img
            
        except Exception as e:
            print(f"DEBUG: Background removal failed: {e}")
            return logo_img  # Return original if removal fails

    async def _download_image(self, url: str) -> Optional[str]:
        """Download image from URL and return local path"""
        try:
            # Handle file:// URLs
            if url.startswith("file://"):
                return url.replace("file://", "")
            
            # Handle direct file paths
            if os.path.exists(url):
                return url
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Generate filename
            filename = f"temp_logo_{int(time.time())}.png"
            temp_path = os.path.join(self.temp_dir, filename)
            
            # Save to temp directory
            with open(temp_path, "wb") as f:
                f.write(response.content)
            
            return temp_path
            
        except Exception as e:
            print(f"DEBUG: Failed to download image {url}: {e}")
            return None