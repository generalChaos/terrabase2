"""
Logo Overlay Service - Handles logo placement on t-shirts and banners
"""

import os
import logging
from typing import Dict, Any, List
import asyncio
import time
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np
import requests
from urllib.parse import urlparse

from src.utils.filename_utils import generate_pipeline_filename
import logging

logger = logging.getLogger(__name__)

class LogoOverlayService:
    """Service for overlaying logos on t-shirts and banners"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        self.output_dir = os.getenv("OUTPUT_DIR", "./output")
        self.assets_dir = os.getenv("ASSETS_DIR", "./assets")
        
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.assets_dir, exist_ok=True)
    
    async def overlay_logo_on_tshirt(self, logo_url: str, tshirt_color: str = "black",
                                   position: str = "left_chest", output_format: str = "png",
                                   quality: int = 95) -> Dict[str, Any]:
        """
        Overlay logo on t-shirt front
        
        Args:
            logo_url: URL of the cleaned logo
            tshirt_color: T-shirt color (black, white)
            position: Logo position (left_chest, center_chest)
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and t-shirt URL
        """
        start_time = time.time()
        
        try:
            # logger.info("Starting logo overlay on t-shirt",
            #            logo_url=logo_url,
            #            tshirt_color=tshirt_color,
            #            position=position)
            
            # Load t-shirt template
            tshirt_template_path = os.path.join(self.assets_dir, f"{tshirt_color}_tshirt_front.png")
            if not os.path.exists(tshirt_template_path):
                return {
                    "success": False,
                    "error": f"T-shirt template not found: {tshirt_template_path}"
                }
            
            # Download and load logo
            logo_path = await self._download_image(logo_url)
            if not logo_path:
                return {
                    "success": False,
                    "error": "Failed to download logo"
                }
            
            # Load images
            tshirt_img = Image.open(tshirt_template_path).convert("RGBA")
            logo_img = Image.open(logo_path).convert("RGBA")
            
            # Calculate logo position and size
            logo_width, logo_height = self._calculate_logo_size(tshirt_img, logo_img, position)
            logo_x, logo_y = self._calculate_logo_position(tshirt_img, logo_width, logo_height, position)
            
            # Resize logo
            logo_resized = logo_img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
            
            # Create result image
            result_img = tshirt_img.copy()
            
            # Paste logo onto t-shirt
            result_img.paste(logo_resized, (logo_x, logo_y), logo_resized)
            
            # Save result
            filename = generate_pipeline_filename("team", f"tshirt-{tshirt_color}-front", output_format)
            output_path = os.path.join(self.output_dir, filename)
            
            if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                # Convert to RGB for JPEG
                result_img = result_img.convert("RGB")
                result_img.save(output_path, "JPEG", quality=quality, optimize=True)
            else:
                result_img.save(output_path, output_format.upper(), quality=quality, optimize=True)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            file_size_bytes = os.path.getsize(output_path)
            
            # logger.info("Logo overlay on t-shirt completed successfully",
                       processing_time_ms=processing_time_ms,
                       file_size_bytes=file_size_bytes)
            
            return {
                "success": True,
                "tshirt_url": f"file://{os.path.abspath(output_path)}",
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": file_size_bytes
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            # logger.error("Logo overlay on t-shirt failed",
            #             error=str(e),
            #             processing_time_ms=processing_time_ms)
            
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }
    
    async def overlay_roster_on_tshirt(self, players: List[Dict[str, Any]], tshirt_color: str = "black",
                                     output_format: str = "png", quality: int = 95) -> Dict[str, Any]:
        """
        Overlay team roster on t-shirt back
        
        Args:
            players: List of player dictionaries with 'number' and 'name'
            tshirt_color: T-shirt color (black, white)
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and t-shirt URL
        """
        start_time = time.time()
        
        try:
            # logger.info("Starting roster overlay on t-shirt back",
                       tshirt_color=tshirt_color,
                       player_count=len(players))
            
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
            
            # Set up fonts
            try:
                number_font = ImageFont.truetype("arial.ttf", 48)
                name_font = ImageFont.truetype("arial.ttf", 32)
            except:
                number_font = ImageFont.load_default()
                name_font = ImageFont.load_default()
            
            # Calculate text color based on t-shirt color
            text_color = (255, 255, 255) if tshirt_color == "black" else (0, 0, 0)
            
            # Calculate roster position (center of t-shirt back)
            img_width, img_height = result_img.size
            start_x = img_width // 2 - 200  # Center horizontally
            start_y = img_height // 2 - 100  # Center vertically
            
            # Draw roster
            current_y = start_y
            line_height = 60
            
            for player in players:
                # Draw player number
                number_text = str(player["number"])
                draw.text((start_x, current_y), number_text, fill=text_color, font=number_font)
                
                # Draw player name
                name_text = player["name"]
                name_x = start_x + 80  # Offset from number
                draw.text((name_x, current_y + 10), name_text, fill=text_color, font=name_font)
                
                current_y += line_height
            
            # Save result
            filename = generate_pipeline_filename("team", f"tshirt-{tshirt_color}-back", output_format)
            output_path = os.path.join(self.output_dir, filename)
            
            if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                # Convert to RGB for JPEG
                result_img = result_img.convert("RGB")
                result_img.save(output_path, "JPEG", quality=quality, optimize=True)
            else:
                result_img.save(output_path, output_format.upper(), quality=quality, optimize=True)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            file_size_bytes = os.path.getsize(output_path)
            
            # logger.info("Roster overlay on t-shirt back completed successfully",
                       processing_time_ms=processing_time_ms,
                       file_size_bytes=file_size_bytes)
            
            return {
                "success": True,
                "tshirt_url": f"file://{os.path.abspath(output_path)}",
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": file_size_bytes
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            # logger.error("Roster overlay on t-shirt back failed",
            #             error=str(e),
            #             processing_time_ms=processing_time_ms)
            
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }
    
    async def overlay_logo_and_roster_on_banner(self, logo_url: str, team_name: str,
                                              players: List[Dict[str, Any]], output_format: str = "png",
                                              quality: int = 95) -> Dict[str, Any]:
        """
        Overlay logo and roster on banner
        
        Args:
            logo_url: URL of the cleaned logo
            team_name: Team name
            players: List of player dictionaries
            output_format: Output format (png, jpg, webp)
            quality: Output quality (1-100)
            
        Returns:
            Dictionary with success status and banner URL
        """
        start_time = time.time()
        
        try:
            # logger.info("Starting banner creation",
                       team_name=team_name,
                       player_count=len(players))
            
            # Load banner template
            banner_template_path = os.path.join(self.assets_dir, "banner_template.png")
            if not os.path.exists(banner_template_path):
                return {
                    "success": False,
                    "error": f"Banner template not found: {banner_template_path}"
                }
            
            # Download and load logo
            logo_path = await self._download_image(logo_url)
            if not logo_path:
                return {
                    "success": False,
                    "error": "Failed to download logo"
                }
            
            # Load images
            banner_img = Image.open(banner_template_path).convert("RGBA")
            logo_img = Image.open(logo_path).convert("RGBA")
            
            # Calculate logo position and size
            logo_width, logo_height = self._calculate_banner_logo_size(banner_img, logo_img)
            logo_x, logo_y = self._calculate_banner_logo_position(banner_img, logo_width, logo_height)
            
            # Resize logo
            logo_resized = logo_img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
            
            # Create result image
            result_img = banner_img.copy()
            
            # Paste logo onto banner
            result_img.paste(logo_resized, (logo_x, logo_y), logo_resized)
            
            # Add team name and roster
            draw = ImageDraw.Draw(result_img)
            
            # Set up fonts
            try:
                title_font = ImageFont.truetype("arial.ttf", 72)
                roster_font = ImageFont.truetype("arial.ttf", 48)
            except:
                title_font = ImageFont.load_default()
                roster_font = ImageFont.load_default()
            
            # Add team name
            team_x = banner_img.width // 2 + 100
            team_y = banner_img.height // 2 - 200
            draw.text((team_x, team_y), team_name, fill=(0, 0, 0), font=title_font)
            
            # Add roster
            roster_x = team_x
            roster_y = team_y + 100
            line_height = 60
            
            for player in players:
                roster_text = f"{player['number']} {player['name']}"
                draw.text((roster_x, roster_y), roster_text, fill=(0, 0, 0), font=roster_font)
                roster_y += line_height
            
            # Save result
            filename = generate_pipeline_filename(team_name, "banner", output_format)
            output_path = os.path.join(self.output_dir, filename)
            
            if output_format.lower() == "jpg" or output_format.lower() == "jpeg":
                # Convert to RGB for JPEG
                result_img = result_img.convert("RGB")
                result_img.save(output_path, "JPEG", quality=quality, optimize=True)
            else:
                result_img.save(output_path, output_format.upper(), quality=quality, optimize=True)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            file_size_bytes = os.path.getsize(output_path)
            
            # logger.info("Banner creation completed successfully",
                       team_name=team_name,
                       processing_time_ms=processing_time_ms,
                       file_size_bytes=file_size_bytes)
            
            return {
                "success": True,
                "banner_url": f"file://{os.path.abspath(output_path)}",
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": file_size_bytes
            }
            
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            # logger.error("Banner creation failed",
            #             team_name=team_name,
            #             error=str(e),
            #             processing_time_ms=processing_time_ms)
            
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time_ms
            }
    
    def _calculate_logo_size(self, tshirt_img: Image.Image, logo_img: Image.Image, position: str) -> tuple:
        """Calculate appropriate logo size for t-shirt"""
        tshirt_width, tshirt_height = tshirt_img.size
        logo_width, logo_height = logo_img.size
        
        # Logo should be about 15% of t-shirt width
        target_width = int(tshirt_width * 0.15)
        
        # Maintain aspect ratio
        aspect_ratio = logo_width / logo_height
        target_height = int(target_width / aspect_ratio)
        
        return target_width, target_height
    
    def _calculate_logo_position(self, tshirt_img: Image.Image, logo_width: int, logo_height: int, position: str) -> tuple:
        """Calculate logo position on t-shirt"""
        tshirt_width, tshirt_height = tshirt_img.size
        
        if position == "left_chest":
            # Position on left chest area
            x = int(tshirt_width * 0.15)  # 15% from left
            y = int(tshirt_height * 0.25)  # 25% from top
        elif position == "center_chest":
            # Position in center chest
            x = int((tshirt_width - logo_width) / 2)
            y = int(tshirt_height * 0.25)
        else:
            # Default to left chest
            x = int(tshirt_width * 0.15)
            y = int(tshirt_height * 0.25)
        
        return x, y
    
    def _calculate_banner_logo_size(self, banner_img: Image.Image, logo_img: Image.Image) -> tuple:
        """Calculate appropriate logo size for banner"""
        banner_width, banner_height = banner_img.size
        logo_width, logo_height = logo_img.size
        
        # Logo should be about 20% of banner width
        target_width = int(banner_width * 0.20)
        
        # Maintain aspect ratio
        aspect_ratio = logo_width / logo_height
        target_height = int(target_width / aspect_ratio)
        
        return target_width, target_height
    
    def _calculate_banner_logo_position(self, banner_img: Image.Image, logo_width: int, logo_height: int) -> tuple:
        """Calculate logo position on banner"""
        banner_width, banner_height = banner_img.size
        
        # Position logo on left side of banner
        x = int(banner_width * 0.10)  # 10% from left
        y = int((banner_height - logo_height) / 2)  # Center vertically
        
        return x, y
    
    async def _download_image(self, url: str) -> str:
        """Download image from URL and return local path"""
        try:
            if url.startswith("file://"):
                # Local file
                return url.replace("file://", "")
            
            # Download remote image
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Generate temp filename
            filename = f"temp_{hash(url) % 10000}.png"
            temp_path = os.path.join(self.temp_dir, filename)
            
            with open(temp_path, "wb") as f:
                f.write(response.content)
            
            return temp_path
            
        except Exception as e:
            # logger.error("Failed to download image", url=url, error_message=str(e))
            return None
