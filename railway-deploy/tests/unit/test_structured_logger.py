"""
Unit tests for Structured Logger
"""

import pytest
import json
import logging
import tempfile
import os
import sys
from unittest.mock import patch, MagicMock
from io import StringIO

from src.logging.structured_logger import (
    ImageProcessorLogger, 
    StructuredFormatter, 
    set_request_id, 
    get_request_id, 
    clear_request_id
)


class TestStructuredFormatter:
    """Test cases for StructuredFormatter"""
    
    def test_format_basic_log(self):
        """Test basic log formatting"""
        formatter = StructuredFormatter()
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=10,
            msg="Test message",
            args=(),
            exc_info=None
        )
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert log_data["level"] == "INFO"
        assert log_data["message"] == "Test message"
        assert log_data["logger"] == "test_logger"
        assert "timestamp" in log_data
        assert "module" in log_data
        assert "function" in log_data
        assert "line" in log_data
    
    def test_format_with_extra_fields(self):
        """Test log formatting with extra fields"""
        formatter = StructuredFormatter()
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test.py",
            lineno=10,
            msg="Test message",
            args=(),
            exc_info=None
        )
        record.extra_fields = {"user_id": "123", "action": "login"}
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert log_data["user_id"] == "123"
        assert log_data["action"] == "login"
    
    def test_format_with_exception(self):
        """Test log formatting with exception info"""
        formatter = StructuredFormatter()
        
        try:
            raise ValueError("Test error")
        except ValueError:
            record = logging.LogRecord(
                name="test_logger",
                level=logging.ERROR,
                pathname="test.py",
                lineno=10,
                msg="Test error occurred",
                args=(),
                exc_info=sys.exc_info()
            )
        
        result = formatter.format(record)
        log_data = json.loads(result)
        
        assert "exception" in log_data
        assert log_data["exception"]["type"] == "ValueError"
        assert log_data["exception"]["message"] == "Test error"
        assert "traceback" in log_data["exception"]


class TestImageProcessorLogger:
    """Test cases for ImageProcessorLogger"""
    
    def setup_method(self):
        """Setup for each test method"""
        # Clear any existing request ID
        clear_request_id()
    
    def test_logger_initialization(self):
        """Test logger initialization"""
        logger = ImageProcessorLogger("test_logger")
        assert logger.logger.name == "test_logger"
        assert len(logger.logger.handlers) > 0
    
    def test_basic_logging_methods(self):
        """Test basic logging methods"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.debug("Debug message", extra_field="value")
            logger.info("Info message", extra_field="value")
            logger.warning("Warning message", extra_field="value")
            logger.error("Error message", extra_field="value")
            logger.critical("Critical message", extra_field="value")
            
            assert mock_log.call_count == 5
    
    def test_log_request_start(self):
        """Test request start logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_request_start(
                method="GET",
                url="https://example.com/api",
                client_ip="192.168.1.1",
                user_agent="Mozilla/5.0"
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.INFO
            assert call_args[0][1] == "Request started"
            assert call_args[1]["extra"]["extra_fields"]["method"] == "GET"
            assert call_args[1]["extra"]["extra_fields"]["url"] == "https://example.com/api"
    
    def test_log_request_end(self):
        """Test request end logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_request_end(
                method="GET",
                url="https://example.com/api",
                status_code=200,
                process_time=1.5
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.INFO
            assert call_args[0][1] == "Request completed"
            assert call_args[1]["extra"]["extra_fields"]["status_code"] == 200
            assert call_args[1]["extra"]["extra_fields"]["process_time"] == 1.5
    
    def test_log_request_error(self):
        """Test request error logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_request_error(
                method="GET",
                url="https://example.com/api",
                error="Connection failed",
                error_type="ConnectionError",
                process_time=2.0
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.ERROR
            assert call_args[0][1] == "Request failed"
            assert call_args[1]["extra"]["extra_fields"]["error"] == "Connection failed"
            assert call_args[1]["extra"]["extra_fields"]["error_type"] == "ConnectionError"
    
    def test_log_processing_step(self):
        """Test processing step logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_processing_step(
                step="background_removal",
                duration=0.5,
                input_size=1024,
                output_size=2048
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.INFO
            assert call_args[0][1] == "Processing step: background_removal"
            assert call_args[1]["extra"]["extra_fields"]["step"] == "background_removal"
            assert call_args[1]["extra"]["extra_fields"]["duration_ms"] == 500.0
    
    def test_log_validation_error(self):
        """Test validation error logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_validation_error(
                field="image_url",
                message="Invalid URL format",
                value="not-a-url"
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.WARNING
            assert call_args[0][1] == "Validation error: Invalid URL format"
            assert call_args[1]["extra"]["extra_fields"]["field"] == "image_url"
    
    def test_log_performance_metric(self):
        """Test performance metric logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_performance_metric(
                metric_name="processing_time",
                value=1500.5,
                unit="ms"
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.INFO
            assert call_args[0][1] == "Performance metric: processing_time"
            assert call_args[1]["extra"]["extra_fields"]["metric_name"] == "processing_time"
            assert call_args[1]["extra"]["extra_fields"]["value"] == 1500.5
    
    def test_log_file_operation(self):
        """Test file operation logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_file_operation(
                operation="save",
                file_path="/tmp/test.png",
                file_size=1024
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.INFO
            assert call_args[0][1] == "File operation: save"
            assert call_args[1]["extra"]["extra_fields"]["operation"] == "save"
            assert call_args[1]["extra"]["extra_fields"]["file_path"] == "/tmp/test.png"
            assert call_args[1]["extra"]["extra_fields"]["file_size_bytes"] == 1024
    
    def test_log_api_call(self):
        """Test API call logging"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            logger.log_api_call(
                service="openai",
                endpoint="/v1/images/generations",
                method="POST",
                status_code=200,
                duration=2.5
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.INFO
            assert call_args[0][1] == "API call: openai /v1/images/generations"
            assert call_args[1]["extra"]["extra_fields"]["service"] == "openai"
            assert call_args[1]["extra"]["extra_fields"]["status_code"] == 200
            assert call_args[1]["extra"]["extra_fields"]["duration_ms"] == 2500.0
    
    def test_log_error_with_context(self):
        """Test error logging with context"""
        logger = ImageProcessorLogger("test_logger")
        
        with patch.object(logger.logger, 'log') as mock_log:
            error = ValueError("Test error")
            context = {"user_id": "123", "action": "process_image"}
            
            logger.log_error_with_context(
                error=error,
                context=context,
                additional_field="value"
            )
            
            mock_log.assert_called_once()
            call_args = mock_log.call_args
            assert call_args[0][0] == logging.ERROR
            assert "Error: ValueError: Test error" in call_args[0][1]
            assert call_args[1]["extra"]["extra_fields"]["error_type"] == "ValueError"
            assert call_args[1]["extra"]["extra_fields"]["context"] == context


class TestRequestIDContext:
    """Test cases for request ID context management"""
    
    def setup_method(self):
        """Setup for each test method"""
        clear_request_id()
    
    def test_set_and_get_request_id(self):
        """Test setting and getting request ID"""
        request_id = "test-request-123"
        set_request_id(request_id)
        assert get_request_id() == request_id
    
    def test_clear_request_id(self):
        """Test clearing request ID"""
        set_request_id("test-request-123")
        clear_request_id()
        assert get_request_id() is None
    
    def test_request_id_in_logs(self):
        """Test that request ID appears in logs when set"""
        logger = ImageProcessorLogger("test_logger")
        request_id = "test-request-123"
        set_request_id(request_id)
        
        # Capture log output
        log_capture = StringIO()
        handler = logging.StreamHandler(log_capture)
        handler.setFormatter(StructuredFormatter())
        logger.logger.addHandler(handler)
        
        try:
            logger.info("Test message")
            log_output = log_capture.getvalue()
            log_data = json.loads(log_output)
            assert log_data["request_id"] == request_id
        finally:
            logger.logger.removeHandler(handler)
    
    def test_no_request_id_when_not_set(self):
        """Test that request ID is not in logs when not set"""
        logger = ImageProcessorLogger("test_logger")
        
        # Capture log output
        log_capture = StringIO()
        handler = logging.StreamHandler(log_capture)
        handler.setFormatter(StructuredFormatter())
        logger.logger.addHandler(handler)
        
        try:
            logger.info("Test message")
            log_output = log_capture.getvalue()
            log_data = json.loads(log_output)
            assert "request_id" not in log_data
        finally:
            logger.logger.removeHandler(handler)
