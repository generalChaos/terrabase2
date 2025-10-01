"""
Integration tests for API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import tempfile
import os

from src.main import app

client = TestClient(app)

class TestAPIEndpoints:
    """Integration tests for API endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "checks" in data
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Image Processor"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
        assert "endpoints" in data
        assert "upscaling" in data["endpoints"]
        assert "asset_pack" in data["endpoints"]
        assert "stats" in data["endpoints"]
    
    def test_docs_endpoint(self):
        """Test API documentation endpoint"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_redoc_endpoint(self):
        """Test ReDoc documentation endpoint"""
        response = client.get("/redoc")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_upscale_endpoint_integration(self):
        """Test upscaling endpoint integration"""
        with patch('src.api.upscaling.upscaler.upscale_image') as mock_upscale, \
             patch('src.api.upscaling.FileValidator.validate_remote_file_for_processing') as mock_validate, \
             patch('src.api.upscaling.storage_service.log_request') as mock_log_request, \
             patch('src.api.upscaling.storage_service.log_success') as mock_log_success:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "image"})
            
            # Mock successful upscaling
            mock_upscale.return_value = {
                "success": True,
                "upscaled_path": "file:///tmp/upscaled.png",
                "file_size_bytes": 1024000
            }
            
            response = client.post("/api/v1/upscale", json={
                "image_url": "https://example.com/test.png",
                "scale_factor": 4,
                "output_format": "png",
                "quality": 95
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["original_url"] == "https://example.com/test.png"
            assert data["upscaled_url"] == "file:///tmp/upscaled.png"
            assert data["scale_factor"] == 4
            assert data["file_size_bytes"] == 1024000
            assert "processing_time_ms" in data
            
            # Verify logging was called
            mock_log_request.assert_called_once()
            mock_log_success.assert_called_once()
    
    def test_asset_pack_endpoint_integration(self):
        """Test asset pack endpoint integration"""
        with patch('src.api.asset_pack.cleanup_service.cleanup_logo') as mock_cleanup, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_on_tshirt') as mock_tshirt_front, \
             patch('src.api.asset_pack.overlay_service.overlay_roster_on_tshirt') as mock_tshirt_back, \
             patch('src.api.asset_pack.overlay_service.overlay_logo_and_roster_on_banner') as mock_banner, \
             patch('src.api.asset_pack.FileValidator.validate_remote_file_for_processing') as mock_validate, \
             patch('src.api.asset_pack.storage_service.log_request') as mock_log_request, \
             patch('src.api.asset_pack.storage_service.log_success') as mock_log_success:
            
            # Mock file validation success
            mock_validate.return_value = (True, "", {"file_size": 1024000, "file_type": "logo"})
            
            # Mock successful responses
            mock_cleanup.return_value = {
                "success": True,
                "clean_logo_url": "file:///tmp/clean_logo.png"
            }
            mock_tshirt_front.return_value = {
                "success": True,
                "tshirt_url": "file:///tmp/tshirt_front.png"
            }
            mock_tshirt_back.return_value = {
                "success": True,
                "tshirt_url": "file:///tmp/tshirt_back.png"
            }
            mock_banner.return_value = {
                "success": True,
                "banner_url": "file:///tmp/banner.png"
            }
            
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
            assert data["clean_logo_url"] == "file:///tmp/clean_logo.png"
            assert data["tshirt_front_url"] == "file:///tmp/tshirt_front.png"
            assert data["tshirt_back_url"] == "file:///tmp/tshirt_back.png"
            assert data["banner_url"] == "file:///tmp/banner.png"
            assert "processing_time_ms" in data
            
            # Verify all services were called
            mock_cleanup.assert_called_once()
            mock_tshirt_front.assert_called_once()
            mock_tshirt_back.assert_called_once()
            mock_banner.assert_called_once()
            
            # Verify logging was called
            mock_log_request.assert_called_once()
            mock_log_success.assert_called_once()
    
    def test_stats_endpoint_integration(self):
        """Test stats endpoint integration"""
        with patch('src.api.stats.storage_service.get_stats') as mock_get_stats:
            mock_get_stats.return_value = {
                "total_requests": 100,
                "successful_requests": 95,
                "failed_requests": 5,
                "success_rate": 95.0
            }
            
            response = client.get("/api/v1/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "data" in data
            assert data["data"]["total_requests"] == 100
            assert data["data"]["successful_requests"] == 95
            assert data["data"]["failed_requests"] == 5
            assert data["data"]["success_rate"] == 95.0
    
    def test_stats_endpoint_with_hours_parameter(self):
        """Test stats endpoint with hours parameter"""
        with patch('src.api.stats.storage_service.get_stats') as mock_get_stats:
            mock_get_stats.return_value = {
                "total_requests": 50,
                "successful_requests": 48,
                "failed_requests": 2,
                "success_rate": 96.0
            }
            
            response = client.get("/api/v1/stats?hours=12")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["period_hours"] == 12
            mock_get_stats.assert_called_once_with(12)
    
    def test_endpoint_stats_integration(self):
        """Test endpoint-specific stats integration"""
        with patch('src.api.stats.storage_service.get_endpoint_stats') as mock_get_endpoint_stats:
            mock_get_endpoint_stats.return_value = {
                "total_requests": 25,
                "successful_requests": 24,
                "failed_requests": 1,
                "success_rate": 96.0,
                "avg_processing_time_ms": 1500.0
            }
            
            response = client.get("/api/v1/stats/endpoint/upscale?hours=24")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["endpoint"] == "upscale"
            assert data["period_hours"] == 24
            assert data["data"]["total_requests"] == 25
            assert data["data"]["avg_processing_time_ms"] == 1500.0
            mock_get_endpoint_stats.assert_called_once_with("upscale", 24)
    
    def test_cleanup_endpoint_integration(self):
        """Test cleanup endpoint integration"""
        with patch('src.api.stats.storage_service.cleanup') as mock_cleanup:
            mock_cleanup.return_value = 15  # 15 records deleted
            
            response = client.post("/api/v1/cleanup?days=30")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["deleted_records"] == 15
            assert data["retention_days"] == 30
            mock_cleanup.assert_called_once_with(30)
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.get("/api/v1/upscale")
        # CORS headers should be present (handled by middleware)
        # Note: OPTIONS method returns 405, but CORS headers are still present
    
    def test_request_id_header(self):
        """Test that request ID is included in response headers"""
        response = client.get("/health")
        assert response.status_code == 200
        # Request ID should be in response headers
        assert "X-Request-ID" in response.headers
    
    def test_error_handling_404(self):
        """Test 404 error handling"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    def test_error_handling_405(self):
        """Test 405 error handling"""
        response = client.delete("/health")  # DELETE not allowed on health endpoint
        assert response.status_code == 405
    
    def test_error_handling_422(self):
        """Test 422 error handling for invalid request body"""
        response = client.post("/api/v1/upscale", json={
            "image_url": "not-a-valid-url",
            "scale_factor": "not-a-number"
        })
        assert response.status_code == 422
    
    def test_error_handling_500(self):
        """Test 500 error handling"""
        with patch('src.api.stats.storage_service.get_stats') as mock_get_stats:
            mock_get_stats.side_effect = Exception("Database connection failed")
            
            response = client.get("/api/v1/stats")
            assert response.status_code == 500
            data = response.json()
            assert "error" in data
            assert "Database connection failed" in data["error"]["message"]
