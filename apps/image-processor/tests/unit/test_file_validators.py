"""
Unit tests for file validation utilities
"""

import pytest
import os
import tempfile
from PIL import Image
from unittest.mock import patch, Mock
from validators.file_validators import FileValidator


class TestFileValidator:
    """Test cases for FileValidator class"""
    
    def test_validate_file_size_success(self):
        """Test successful file size validation"""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b"test content")
            temp_file.flush()
            
            is_valid, error_msg, file_size = FileValidator.validate_file_size(temp_file.name, 100)
            
            assert is_valid is True
            assert error_msg == ""
            assert file_size > 0
            
            os.unlink(temp_file.name)
    
    def test_validate_file_size_too_large(self):
        """Test file size validation with file too large"""
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b"x" * 1000)  # 1000 bytes
            temp_file.flush()
            
            is_valid, error_msg, file_size = FileValidator.validate_file_size(temp_file.name, 500)
            
            assert is_valid is False
            assert "exceeds maximum" in error_msg
            assert file_size == 1000
            
            os.unlink(temp_file.name)
    
    def test_validate_file_size_nonexistent(self):
        """Test file size validation with nonexistent file"""
        is_valid, error_msg, file_size = FileValidator.validate_file_size("/nonexistent/file.jpg")
        
        assert is_valid is False
        assert "does not exist" in error_msg
        assert file_size == 0
    
    def test_validate_image_dimensions_success(self):
        """Test successful image dimensions validation"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            # Create a small test image
            img = Image.new('RGB', (100, 100), color='red')
            img.save(temp_file.name)
            
            is_valid, error_msg, dimensions = FileValidator.validate_image_dimensions(temp_file.name)
            
            assert is_valid is True
            assert error_msg == ""
            assert dimensions == (100, 100)
            
            os.unlink(temp_file.name)
    
    def test_validate_image_dimensions_too_small(self):
        """Test image dimensions validation with image too small"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            # Create a very small test image
            img = Image.new('RGB', (10, 10), color='red')
            img.save(temp_file.name)
            
            is_valid, error_msg, dimensions = FileValidator.validate_image_dimensions(temp_file.name)
            
            assert is_valid is False
            assert "too small" in error_msg
            assert dimensions == (10, 10)
            
            os.unlink(temp_file.name)
    
    def test_validate_image_dimensions_too_large(self):
        """Test image dimensions validation with image too large"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            # Create a large test image
            img = Image.new('RGB', (10000, 10000), color='red')
            img.save(temp_file.name)
            
            is_valid, error_msg, dimensions = FileValidator.validate_image_dimensions(temp_file.name)
            
            assert is_valid is False
            assert "too large" in error_msg
            assert dimensions == (10000, 10000)
            
            os.unlink(temp_file.name)
    
    def test_validate_image_format_success(self):
        """Test successful image format validation"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            img = Image.new('RGB', (100, 100), color='red')
            img.save(temp_file.name)
            
            is_valid, error_msg, format_name = FileValidator.validate_image_format(temp_file.name)
            
            assert is_valid is True
            assert error_msg == ""
            assert format_name == "PNG"
            
            os.unlink(temp_file.name)
    
    def test_validate_image_format_unsupported(self):
        """Test image format validation with unsupported format"""
        with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as temp_file:
            img = Image.new('RGB', (100, 100), color='red')
            img.save(temp_file.name, format='GIF')
            
            is_valid, error_msg, format_name = FileValidator.validate_image_format(temp_file.name)
            
            assert is_valid is False
            assert "Unsupported image format" in error_msg
            assert format_name == "GIF"
            
            os.unlink(temp_file.name)
    
    def test_validate_image_content_success(self):
        """Test successful image content validation"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            img = Image.new('RGB', (100, 100), color='red')
            img.save(temp_file.name)
            
            is_valid, error_msg = FileValidator.validate_image_content(temp_file.name)
            
            assert is_valid is True
            assert error_msg == ""
            
            os.unlink(temp_file.name)
    
    def test_validate_image_content_invalid(self):
        """Test image content validation with invalid content"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            # Write invalid image data
            temp_file.write(b"not an image")
            temp_file.flush()
            
            is_valid, error_msg = FileValidator.validate_image_content(temp_file.name)
            
            assert is_valid is False
            assert "Invalid image content" in error_msg
            
            os.unlink(temp_file.name)
    
    @patch('requests.head')
    def test_validate_remote_file_size_success(self, mock_head):
        """Test successful remote file size validation"""
        mock_response = Mock()
        mock_response.headers = {'content-length': '1000'}
        mock_response.raise_for_status.return_value = None
        mock_head.return_value = mock_response
        
        is_valid, error_msg, file_size = FileValidator.validate_remote_file_size("https://example.com/image.jpg", 2000)
        
        assert is_valid is True
        assert error_msg == ""
        assert file_size == 1000
    
    @patch('requests.head')
    def test_validate_remote_file_size_too_large(self, mock_head):
        """Test remote file size validation with file too large"""
        mock_response = Mock()
        mock_response.headers = {'content-length': '1000'}
        mock_response.raise_for_status.return_value = None
        mock_head.return_value = mock_response
        
        is_valid, error_msg, file_size = FileValidator.validate_remote_file_size("https://example.com/image.jpg", 500)
        
        assert is_valid is False
        assert "exceeds maximum" in error_msg
        assert file_size == 1000
    
    @patch('requests.head')
    def test_validate_remote_file_size_no_content_length(self, mock_head):
        """Test remote file size validation with no content-length header"""
        mock_response = Mock()
        mock_response.headers = {}
        mock_response.raise_for_status.return_value = None
        mock_head.return_value = mock_response
        
        is_valid, error_msg, file_size = FileValidator.validate_remote_file_size("https://example.com/image.jpg")
        
        assert is_valid is False
        assert "Could not determine file size" in error_msg
        assert file_size == 0
    
    def test_validate_file_for_processing_success(self):
        """Test comprehensive file validation for processing - success case"""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            img = Image.new('RGB', (100, 100), color='red')
            img.save(temp_file.name)
            
            is_valid, error_msg, validation_info = FileValidator.validate_file_for_processing(temp_file.name, "image")
            
            assert is_valid is True
            assert error_msg == ""
            assert validation_info["file_size"] > 0
            assert validation_info["dimensions"] == (100, 100)
            assert validation_info["format"] == "PNG"
            assert validation_info["file_type"] == "image"
            
            os.unlink(temp_file.name)
    
    def test_validate_file_for_processing_invalid_format(self):
        """Test comprehensive file validation with invalid format"""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
            temp_file.write(b"not an image")
            temp_file.flush()
            
            is_valid, error_msg, validation_info = FileValidator.validate_file_for_processing(temp_file.name, "image")
            
            assert is_valid is False
            assert "Invalid image content" in error_msg
            assert validation_info["file_type"] == "image"
            
            os.unlink(temp_file.name)
    
    def test_validate_remote_file_for_processing_success(self):
        """Test remote file validation for processing - success case"""
        with patch('requests.head') as mock_head:
            mock_response = Mock()
            mock_response.headers = {'content-length': '1000'}
            mock_response.raise_for_status.return_value = None
            mock_head.return_value = mock_response
            
            is_valid, error_msg, validation_info = FileValidator.validate_remote_file_for_processing("https://example.com/image.jpg", "logo")
            
            assert is_valid is True
            assert error_msg == ""
            assert validation_info["file_size"] == 1000
            assert validation_info["url"] == "https://example.com/image.jpg"
            assert validation_info["file_type"] == "logo"
    
    def test_validate_remote_file_for_processing_unsupported_scheme(self):
        """Test remote file validation with unsupported URL scheme"""
        is_valid, error_msg, validation_info = FileValidator.validate_remote_file_for_processing("ftp://example.com/image.jpg", "image")
        
        assert is_valid is False
        assert "Unsupported URL scheme" in error_msg
        assert validation_info["url"] == "ftp://example.com/image.jpg"
    
    def test_get_file_validation_summary(self):
        """Test file validation summary generation"""
        validation_info = {
            "file_size": 1048576,  # 1MB
            "dimensions": (800, 600),
            "format": "PNG",
            "file_type": "logo"
        }
        
        summary = FileValidator.get_file_validation_summary(validation_info)
        
        assert "Logo file" in summary
        assert "PNG" in summary
        assert "800x600px" in summary
        assert "1.00MB" in summary
    
    def test_file_type_specific_limits(self):
        """Test that different file types have different size limits"""
        # Test logo limit (5MB default)
        assert FileValidator.MAX_LOGO_SIZE == 5242880
        
        # Test image limit (10MB default)
        assert FileValidator.MAX_IMAGE_SIZE == 10485760
        
        # Test banner limit (15MB default)
        assert FileValidator.MAX_BANNER_SIZE == 15728640
    
    def test_supported_formats(self):
        """Test that supported formats are correctly defined"""
        expected_formats = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
        assert FileValidator.SUPPORTED_FORMATS == expected_formats
