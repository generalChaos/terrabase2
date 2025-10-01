"""
Unit tests for upscaling API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import json

from src.main import app

client = TestClient(app)

class TestUpscalingAPI:
    """Test cases for upscaling API endpoints"""
    
    def test_upscale_image_success(self):
        """Test successful image upscaling"""
        with patch('src.api.upscaling.upscaler.upscale_image') as mock_upscale, \
             patch('src.api.upscaling.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "image"})
            
            # Mock upscaling success
            mock_upscale.return_value = {
                "success": True,
                "upscaled_path": "file:///path/to/upscaled.png",
                "file_size_bytes": 1024000
            }
            
            with patch('src.api.upscaling.storage_service.log_request') as mock_log_request, \
                 patch('src.api.upscaling.storage_service.log_success') as mock_log_success:
                
                response = client.post("/api/v1/upscale", json={
                    "image_url": "https://example.com/image.png",
                    "scale_factor": 4,
                    "output_format": "png",
                    "quality": 95
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["original_url"] == "https://example.com/image.png"
                assert data["upscaled_url"] == "file:///path/to/upscaled.png"
                assert data["scale_factor"] == 4
                assert data["file_size_bytes"] == 1024000
                assert "processing_time_ms" in data
    
    def test_upscale_image_validation_error(self):
        """Test upscaling with validation error"""
        response = client.post("/api/v1/upscale", json={
            "image_url": "invalid-url",
            "scale_factor": 10,  # Invalid scale factor
            "output_format": "invalid",
            "quality": 150  # Invalid quality
        })
        
        assert response.status_code == 422  # Pydantic validation error
        data = response.json()
        assert "detail" in data
    
    def test_upscale_image_upscaler_failure(self):
        """Test upscaling when upscaler service fails"""
        with patch('src.api.upscaling.upscaler.upscale_image') as mock_upscale, \
             patch('src.api.upscaling.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "image"})
            
            # Mock upscaling failure
            mock_upscale.return_value = {
                "success": False,
                "error": "Upscaling failed"
            }
            
            with patch('src.api.upscaling.storage_service.log_request'), \
                 patch('src.api.upscaling.storage_service.log_failure'):
                
                response = client.post("/api/v1/upscale", json={
                    "image_url": "https://example.com/image.png",
                    "scale_factor": 4
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert data["error"] == "Upscaling failed"
    
    def test_upscale_image_file_validation_failure(self):
        """Test upscaling when file validation fails"""
        with patch('src.api.upscaling.FileValidator.validate_remote_file_for_processing') as mock_validate:
            mock_validate.return_value = (False, "File too large", {})
            
            with patch('src.api.upscaling.storage_service.log_request'), \
                 patch('src.api.upscaling.storage_service.log_validation_error'):
                
                response = client.post("/api/v1/upscale", json={
                    "image_url": "https://example.com/image.png",
                    "scale_factor": 4
                })
                
                assert response.status_code == 400
                data = response.json()
                assert "Validation failed" in data["error"]["error"]
    
    def test_upscale_image_parameters(self):
        """Test upscaling with different parameters"""
        with patch('src.api.upscaling.upscaler.upscale_image') as mock_upscale, \
             patch('src.api.upscaling.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "image"})
            
            # Mock upscaling success
            mock_upscale.return_value = {
                "success": True,
                "upscaled_path": "file:///path/to/upscaled.jpg",
                "file_size_bytes": 2048000
            }
            
            with patch('src.api.upscaling.storage_service.log_request'), \
                 patch('src.api.upscaling.storage_service.log_success'):
                
                response = client.post("/api/v1/upscale", json={
                    "image_url": "https://example.com/image.png",
                    "scale_factor": 2,
                    "output_format": "jpg",
                    "quality": 80
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["scale_factor"] == 2
    
    def test_upscale_image_missing_required_fields(self):
        """Test upscaling with missing required fields"""
        response = client.post("/api/v1/upscale", json={
            "scale_factor": 4
            # Missing image_url
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_upscale_image_invalid_scale_factor(self):
        """Test upscaling with invalid scale factor"""
        response = client.post("/api/v1/upscale", json={
            "image_url": "https://example.com/image.png",
            "scale_factor": 5  # Invalid scale factor (must be 2, 4, or 8)
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "Validation failed" in data["error"]["error"]
    
    def test_upscale_image_invalid_quality(self):
        """Test upscaling with invalid quality"""
        response = client.post("/api/v1/upscale", json={
            "image_url": "https://example.com/image.png",
            "scale_factor": 4,
            "quality": 101  # Invalid quality (must be 1-100)
        })
        
        assert response.status_code == 422  # Pydantic validation error
        data = response.json()
        assert "detail" in data
    
    def test_upscale_image_invalid_output_format(self):
        """Test upscaling with invalid output format"""
        response = client.post("/api/v1/upscale", json={
            "image_url": "https://example.com/image.png",
            "scale_factor": 4,
            "output_format": "bmp"  # Invalid format
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "Validation failed" in data["error"]["error"]
    
    def test_upscale_image_exception_handling(self):
        """Test upscaling with unexpected exception"""
        with patch('src.api.upscaling.upscaler.upscale_image') as mock_upscale, \
             patch('src.api.upscaling.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "image"})
            
            # Mock upscaling exception
            mock_upscale.side_effect = Exception("Unexpected error")
            
            with patch('src.api.upscaling.storage_service.log_request'), \
                 patch('src.api.upscaling.storage_service.log_failure'):
                
                response = client.post("/api/v1/upscale", json={
                    "image_url": "https://example.com/image.png",
                    "scale_factor": 4
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert "Unexpected error" in data["error"]
