"""
Integration tests for health endpoint
"""
import pytest
import os
from unittest.mock import patch

def test_health_endpoint_basic(client):
    """Test basic health endpoint functionality"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "status" in data
    assert "service" in data
    assert "version" in data
    assert "checks" in data
    
    # Check service info
    assert data["service"] == "image-processor"
    assert data["version"] == "1.0.0"
    assert data["status"] in ["healthy", "unhealthy"]

def test_health_endpoint_with_temp_dirs(client, temp_directories):
    """Test health endpoint with proper temp directories"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    # Should be healthy with proper directories
    assert data["status"] == "healthy"
    assert data["checks"]["temp_directory"] is True
    assert data["checks"]["output_directory"] is True

def test_health_endpoint_missing_dirs(client):
    """Test health endpoint with missing directories"""
    # Temporarily set non-existent directories
    with patch.dict(os.environ, {
        "TEMP_DIR": "/non/existent/temp",
        "OUTPUT_DIR": "/non/existent/output"
    }):
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be unhealthy with missing directories
        assert data["status"] == "unhealthy"
        assert data["checks"]["temp_directory"] is False
        assert data["checks"]["output_directory"] is False

def test_health_endpoint_exception_handling(client):
    """Test health endpoint handles exceptions gracefully"""
    with patch('os.path.exists', side_effect=Exception("Test error")):
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should handle exception and return unhealthy
        assert data["status"] == "unhealthy"
        assert "error" in data["checks"]

def test_root_endpoint(client):
    """Test root endpoint returns service info"""
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert data["service"] == "Image Processor"
    assert data["version"] == "1.0.0"
    assert data["status"] == "running"
    assert "endpoints" in data
    
    # Check endpoints are listed
    endpoints = data["endpoints"]
    assert "health" in endpoints
    assert "docs" in endpoints
    assert "upscaling" in endpoints
