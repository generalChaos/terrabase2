"""
Unit tests for asset pack API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import json

from src.main import app

client = TestClient(app)

class TestAssetPackAPI:
    """Test cases for asset pack API endpoints"""
    
    def test_create_asset_pack_success(self):
        """Test successful asset pack creation"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_on_tshirt') as mock_tshirt_front, \
             patch('src.api.asset_pack.overlay_service.overlay_roster_on_tshirt') as mock_tshirt_back, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_and_roster_on_banner') as mock_banner, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            # Mock successful responses
            mock_cleanup.return_value = {
                "success": True,
                "clean_logo_url": "file:///path/to/clean_logo.png"
            }
            mock_tshirt_front.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_front.png"
            }
            mock_tshirt_back.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_back.png"
            }
            mock_banner.return_value = {
                "success": True,
                "banner_url": "file:///path/to/banner.png"
            }
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_success'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [
                        {"number": 9, "name": "Iggy"},
                        {"number": 11, "name": "Marcelo"}
                    ],
                    "tshirt_color": "black",
                    "include_banner": True
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["team_name"] == "Test Team"
                assert data["clean_logo_url"] == "file:///path/to/clean_logo.png"
                assert data["tshirt_front_url"] == "file:///path/to/tshirt_front.png"
                assert data["tshirt_back_url"] == "file:///path/to/tshirt_back.png"
                assert data["banner_url"] == "file:///path/to/banner.png"
                assert "processing_time_ms" in data
    
    def test_create_asset_pack_without_banner(self):
        """Test asset pack creation without banner"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_on_tshirt') as mock_tshirt_front, \
             patch('src.api.asset_pack.overlay_service.overlay_roster_on_tshirt') as mock_tshirt_back, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            # Mock successful responses
            mock_cleanup.return_value = {
                "success": True,
                "clean_logo_url": "file:///path/to/clean_logo.png"
            }
            mock_tshirt_front.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_front.png"
            }
            mock_tshirt_back.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_back.png"
            }
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_success'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [
                        {"number": 9, "name": "Iggy"}
                    ],
                    "tshirt_color": "white",
                    "include_banner": False
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["banner_url"] is None
    
    def test_create_asset_pack_validation_error(self):
        """Test asset pack creation with validation error"""
        response = client.post("/api/v1/asset-pack", json={
            "logo_url": "invalid-url",
            "team_name": "",  # Empty team name
            "players": [],  # Empty players list
            "tshirt_color": "invalid-color",
            "output_format": "invalid-format",
            "quality": 150  # Invalid quality
        })
        
        assert response.status_code == 422  # Pydantic validation error
        data = response.json()
        assert "detail" in data
    
    def test_create_asset_pack_logo_cleanup_failure(self):
        """Test asset pack creation when logo cleanup fails"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            mock_cleanup.return_value = {
                "success": False,
                "error": "Logo cleanup failed"
            }
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_failure'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [{"number": 9, "name": "Iggy"}]
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert "Logo cleanup failed" in data["error"]
    
    def test_create_asset_pack_tshirt_front_failure(self):
        """Test asset pack creation when t-shirt front creation fails"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_on_tshirt') as mock_tshirt_front, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            mock_cleanup.return_value = {
                "success": True,
                "clean_logo_url": "file:///path/to/clean_logo.png"
            }
            mock_tshirt_front.return_value = {
                "success": False,
                "error": "T-shirt front creation failed"
            }
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_failure'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [{"number": 9, "name": "Iggy"}]
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert "T-shirt front creation failed" in data["error"]
    
    def test_create_asset_pack_tshirt_back_failure(self):
        """Test asset pack creation when t-shirt back creation fails"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_on_tshirt') as mock_tshirt_front, \
             patch('src.api.asset_pack.overlay_service.overlay_roster_on_tshirt') as mock_tshirt_back, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            mock_cleanup.return_value = {
                "success": True,
                "clean_logo_url": "file:///path/to/clean_logo.png"
            }
            mock_tshirt_front.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_front.png"
            }
            mock_tshirt_back.return_value = {
                "success": False,
                "error": "T-shirt back creation failed"
            }
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_failure'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [{"number": 9, "name": "Iggy"}]
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert "T-shirt back creation failed" in data["error"]
    
    def test_create_asset_pack_banner_failure_continues(self):
        """Test asset pack creation when banner creation fails but continues"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_on_tshirt') as mock_tshirt_front, \
             patch('src.api.asset_pack.overlay_service.overlay_roster_on_tshirt') as mock_tshirt_back, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_and_roster_on_banner') as mock_banner, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            mock_cleanup.return_value = {
                "success": True,
                "clean_logo_url": "file:///path/to/clean_logo.png"
            }
            mock_tshirt_front.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_front.png"
            }
            mock_tshirt_back.return_value = {
                "success": True,
                "tshirt_url": "file:///path/to/tshirt_back.png"
            }
            mock_banner.return_value = {
                "success": False,
                "error": "Banner creation failed"
            }
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_success'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [{"number": 9, "name": "Iggy"}],
                    "include_banner": True
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["banner_url"] is None  # Banner failed but process continues
    
    def test_create_asset_pack_invalid_players(self):
        """Test asset pack creation with invalid players"""
        response = client.post("/api/v1/asset-pack", json={
            "logo_url": "https://example.com/logo.png",
            "team_name": "Test Team",
            "players": [
                {"number": 0, "name": ""},  # Invalid number and name
                {"number": 100, "name": "x" * 100}  # Invalid number and name too long
            ]
        })
        
        assert response.status_code == 422  # Pydantic validation error
        data = response.json()
        assert "detail" in data
    
    def test_create_asset_pack_missing_required_fields(self):
        """Test asset pack creation with missing required fields"""
        response = client.post("/api/v1/asset-pack", json={
            "team_name": "Test Team"
            # Missing logo_url and players
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_create_asset_pack_file_validation_failure(self):
        """Test asset pack creation when file validation fails"""
        with patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            mock_validate.return_value = (False, "File too large", {})
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_validation_error'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [{"number": 9, "name": "Iggy"}]
                })
                
                assert response.status_code == 400
                data = response.json()
                assert "Validation failed" in data["error"]["error"]
    
    def test_create_asset_pack_exception_handling(self):
        """Test asset pack creation with unexpected exception"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            mock_cleanup.side_effect = Exception("Unexpected error")
            
            with patch('src.api.asset_pack.storage_service.log_request'), \
                 patch('src.api.asset_pack.storage_service.log_failure'):
                
                response = client.post("/api/v1/asset-pack", json={
                    "logo_url": "https://example.com/logo.png",
                    "team_name": "Test Team",
                    "players": [{"number": 9, "name": "Iggy"}]
                })
                
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert "Unexpected error" in data["error"]
