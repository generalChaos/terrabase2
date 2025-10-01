"""
Test configuration and fixtures for image processor service
"""
import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

# Add src to path for imports
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import app

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def sample_image_url():
    """Sample image URL for testing"""
    return "https://example.com/test-logo.png"

@pytest.fixture
def temp_directories():
    """Create temporary directories for testing"""
    temp_dir = tempfile.mkdtemp()
    output_dir = tempfile.mkdtemp()
    
    # Set environment variables
    os.environ["TEMP_DIR"] = temp_dir
    os.environ["OUTPUT_DIR"] = output_dir
    
    yield {
        "temp_dir": temp_dir,
        "output_dir": output_dir
    }
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)
    shutil.rmtree(output_dir, ignore_errors=True)

@pytest.fixture
def mock_ai_remover():
    """Mock AI background remover"""
    with patch('services.ai_background_remover.AIBackgroundRemover') as mock:
        mock_instance = Mock()
        mock_instance.remove_background.return_value = "https://example.com/processed.png"
        mock.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_upscaler():
    """Mock image upscaler"""
    with patch('services.upscaler.ImageUpscaler') as mock:
        mock_instance = Mock()
        mock_instance.upscale_image.return_value = "https://example.com/upscaled.png"
        mock.return_value = mock_instance
        yield mock_instance
