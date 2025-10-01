"""
Unit tests for Input Validators
"""

import pytest
import os
import tempfile
from validators import InputValidator, ValidationError


class TestInputValidator:
    """Test cases for InputValidator class"""
    
    def test_validate_url_valid_http(self):
        """Test valid HTTP URL validation"""
        url = "https://example.com/image.png"
        result = InputValidator.validate_url(url, "test_url")
        assert result == url
    
    def test_validate_url_valid_file(self):
        """Test valid file URL validation"""
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            url = f"file://{tmp.name}"
            result = InputValidator.validate_url(url, "test_url")
            assert result == url
            os.unlink(tmp.name)
    
    def test_validate_url_invalid_scheme(self):
        """Test invalid URL scheme validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_url("ftp://example.com/image.png", "test_url")
        assert "scheme must be one of" in exc_info.value.message
        assert exc_info.value.field == "test_url"
    
    def test_validate_url_empty(self):
        """Test empty URL validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_url("", "test_url")
        assert "is required and must be a string" in exc_info.value.message
    
    def test_validate_url_too_long(self):
        """Test URL length validation"""
        long_url = "https://example.com/" + "a" * 2100  # Make it longer than 2048
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_url(long_url, "test_url")
        assert "is too long" in exc_info.value.message
    
    def test_validate_image_url_valid(self):
        """Test valid image URL validation"""
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            url = f"file://{tmp.name}"
            result = InputValidator.validate_image_url(url, "test_image_url")
            assert result == url
            os.unlink(tmp.name)
    
    def test_validate_image_url_unsupported_format(self):
        """Test unsupported image format validation"""
        with tempfile.NamedTemporaryFile(suffix=".gif", delete=False) as tmp:
            url = f"file://{tmp.name}"
            with pytest.raises(ValidationError) as exc_info:
                InputValidator.validate_image_url(url, "test_image_url")
            assert "Unsupported image format" in exc_info.value.message
            os.unlink(tmp.name)
    
    def test_validate_image_url_nonexistent_file(self):
        """Test nonexistent file validation"""
        url = "file:///nonexistent/path/image.png"
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_image_url(url, "test_image_url")
        assert "File not found" in exc_info.value.message
    
    def test_validate_scale_factor_valid(self):
        """Test valid scale factor validation"""
        result = InputValidator.validate_scale_factor(2.5, "scale_factor")
        assert result == 2.5
    
    def test_validate_scale_factor_invalid_negative(self):
        """Test negative scale factor validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_scale_factor(-1, "scale_factor")
        assert "must be greater than 0" in exc_info.value.message
    
    def test_validate_scale_factor_invalid_too_large(self):
        """Test too large scale factor validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_scale_factor(15, "scale_factor")
        assert "must be less than or equal to 10" in exc_info.value.message
    
    def test_validate_rotation_valid(self):
        """Test valid rotation validation"""
        result = InputValidator.validate_rotation(45, "rotation")
        assert result == 45.0
    
    def test_validate_rotation_invalid_out_of_range(self):
        """Test out of range rotation validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_rotation(500, "rotation")
        assert "must be between -360 and 360 degrees" in exc_info.value.message
    
    def test_validate_opacity_valid(self):
        """Test valid opacity validation"""
        result = InputValidator.validate_opacity(0.5, "opacity")
        assert result == 0.5
    
    def test_validate_opacity_invalid_out_of_range(self):
        """Test out of range opacity validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_opacity(1.5, "opacity")
        assert "must be between 0 and 1" in exc_info.value.message
    
    def test_validate_position_valid(self):
        """Test valid position validation"""
        result = InputValidator.validate_position("left_chest", "position")
        assert result == "left_chest"
    
    def test_validate_position_invalid(self):
        """Test invalid position validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_position("invalid_position", "position")
        assert "must be one of" in exc_info.value.message
    
    def test_validate_quality_valid(self):
        """Test valid quality validation"""
        result = InputValidator.validate_quality(85, "quality")
        assert result == 85
    
    def test_validate_quality_invalid_out_of_range(self):
        """Test out of range quality validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_quality(150, "quality")
        assert "must be between 1 and 100" in exc_info.value.message
    
    def test_validate_output_format_valid(self):
        """Test valid output format validation"""
        result = InputValidator.validate_output_format("PNG", "output_format")
        assert result == "png"
    
    def test_validate_output_format_invalid(self):
        """Test invalid output format validation"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_output_format("gif", "output_format")
        assert "must be one of" in exc_info.value.message
    
    def test_validate_players_valid(self):
        """Test valid players validation"""
        players = [
            {"number": 1, "name": "John Doe"},
            {"number": 2, "name": "Jane Smith"}
        ]
        result = InputValidator.validate_players(players, "players")
        assert result == players
    
    def test_validate_players_invalid_missing_fields(self):
        """Test invalid players validation - missing fields"""
        players = [{"number": 1}]  # Missing name
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_players(players, "players")
        assert "must have 'number' and 'name' fields" in exc_info.value.message
    
    def test_validate_players_invalid_number_range(self):
        """Test invalid players validation - number out of range"""
        players = [{"number": 1000, "name": "John Doe"}]
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_players(players, "players")
        assert "must be between 0 and 999" in exc_info.value.message
    
    def test_validate_players_too_many(self):
        """Test invalid players validation - too many players"""
        players = [{"number": i, "name": f"Player {i}"} for i in range(51)]
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_players(players, "players")
        assert "cannot have more than 50 players" in exc_info.value.message
    
    def test_validate_team_name_valid(self):
        """Test valid team name validation"""
        result = InputValidator.validate_team_name("Test Team", "team_name")
        assert result == "Test Team"
    
    def test_validate_team_name_invalid_empty(self):
        """Test invalid team name validation - empty"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_team_name("   ", "team_name")
        assert "cannot be empty" in exc_info.value.message
    
    def test_validate_team_name_invalid_characters(self):
        """Test invalid team name validation - invalid characters"""
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_team_name("Team<>", "team_name")
        assert "contains invalid characters" in exc_info.value.message
    
    def test_validate_banner_style_valid(self):
        """Test valid banner style validation"""
        style = {
            "banner_width": 1200,
            "banner_height": 400,
            "text_color": "#FF0000",
            "number_color": "#00FF00"
        }
        result = InputValidator.validate_banner_style(style, "style")
        assert result == style
    
    def test_validate_banner_style_invalid_width(self):
        """Test invalid banner style validation - width out of range"""
        style = {"banner_width": 50}  # Too small
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_banner_style(style, "style")
        assert "must be an integer between 100 and 5000" in exc_info.value.message
    
    def test_validate_banner_style_invalid_color(self):
        """Test invalid banner style validation - invalid color"""
        style = {"text_color": "red"}  # Not hex format
        with pytest.raises(ValidationError) as exc_info:
            InputValidator.validate_banner_style(style, "style")
        assert "must be a valid hex color" in exc_info.value.message
