#!/usr/bin/env python3
"""
Script to download required models for image processing
"""

import os
import requests
import zipfile
from pathlib import Path

def download_file(url: str, filepath: str) -> bool:
    """Download a file from URL"""
    try:
        print(f"Downloading {url}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded: {filepath}")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def main():
    """Download all required models"""
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    # Real-ESRGAN models
    realesrgan_models = {
        "RealESRGAN_x4plus.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
        "RealESRGAN_x4plus_anime_6B.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"
    }
    
    # ESRGAN models
    esrgan_models = {
        "RRDB_ESRGAN_x4.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RRDB_ESRGAN_x4.pth"
    }
    
    print("Downloading Real-ESRGAN models...")
    for filename, url in realesrgan_models.items():
        filepath = models_dir / filename
        if not filepath.exists():
            download_file(url, str(filepath))
        else:
            print(f"Already exists: {filepath}")
    
    print("Downloading ESRGAN models...")
    for filename, url in esrgan_models.items():
        filepath = models_dir / filename
        if not filepath.exists():
            download_file(url, str(filepath))
        else:
            print(f"Already exists: {filepath}")
    
    print("Model download complete!")
    print(f"Models saved to: {models_dir.absolute()}")

if __name__ == "__main__":
    main()
