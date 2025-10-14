"""
Structured logging utilities for the Image Processor Service
"""

import logging
import json
import traceback
import time
from typing import Any, Dict, Optional, Union
from datetime import datetime
import os
import sys
from contextvars import ContextVar

# Context variable for request ID
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_entry["request_id"] = request_id
        
        # Add extra fields from record
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Add stack info if present
        if record.stack_info:
            log_entry["stack_info"] = record.stack_info
        
        return json.dumps(log_entry, default=str)

class ImageProcessorLogger:
    """Enhanced logger for Image Processor Service"""
    
    def __init__(self, name: str = "image_processor"):
        self.logger = logging.getLogger(name)
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup logger with appropriate handlers and formatters"""
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Set log level from environment
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        self.logger.setLevel(getattr(logging, log_level, logging.INFO))
        
        # Console handler with structured formatting
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(console_handler)
        
        # File handler for errors (if log file is specified)
        log_file = os.getenv("LOG_FILE")
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(StructuredFormatter())
            file_handler.setLevel(logging.ERROR)
            self.logger.addHandler(file_handler)
        
        # Prevent propagation to root logger
        self.logger.propagate = False
    
    def _log_with_context(self, level: int, message: str, extra_fields: Optional[Dict[str, Any]] = None, **kwargs):
        """Log with additional context fields"""
        if extra_fields is None:
            extra_fields = {}
        
        # Add any additional keyword arguments
        extra_fields.update(kwargs)
        
        # Create log record with extra fields
        self.logger.log(level, message, extra={"extra_fields": extra_fields})
    
    def debug(self, message: str, **kwargs):
        """Log debug message with context"""
        self._log_with_context(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message with context"""
        self._log_with_context(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message with context"""
        self._log_with_context(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message with context"""
        self._log_with_context(logging.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log critical message with context"""
        self._log_with_context(logging.CRITICAL, message, **kwargs)
    
    def log_request_start(self, method: str, url: str, client_ip: str = None, user_agent: str = None, **kwargs):
        """Log request start with context"""
        # Truncate long URLs (especially data URLs) to avoid log spam
        truncated_url = url
        if len(url) > 200:
            if url.startswith('data:'):
                # For data URLs, show just the data: part and first 50 chars of data
                truncated_url = url[:100] + "...[truncated data URL]"
            else:
                # For regular URLs, truncate to 200 chars
                truncated_url = url[:200] + "..."
        
        self.info(
            "Request started",
            method=method,
            url=truncated_url,
            client_ip=client_ip,
            user_agent=user_agent,
            **kwargs
        )
    
    def log_request_end(self, method: str, url: str, status_code: int, process_time: float, **kwargs):
        """Log request completion with context"""
        # Truncate long URLs (especially data URLs) to avoid log spam
        truncated_url = url
        if len(url) > 200:
            if url.startswith('data:'):
                # For data URLs, show just the data: part and first 50 chars of data
                truncated_url = url[:100] + "...[truncated data URL]"
            else:
                # For regular URLs, truncate to 200 chars
                truncated_url = url[:200] + "..."
        
        self.info(
            "Request completed",
            method=method,
            url=truncated_url,
            status_code=status_code,
            process_time=round(process_time, 3),
            **kwargs
        )
    
    def log_request_error(self, method: str, url: str, error: str, error_type: str, process_time: float, **kwargs):
        """Log request error with context"""
        # Truncate long URLs (especially data URLs) to avoid log spam
        truncated_url = url
        if len(url) > 200:
            if url.startswith('data:'):
                # For data URLs, show just the data: part and first 50 chars of data
                truncated_url = url[:100] + "...[truncated data URL]"
            else:
                # For regular URLs, truncate to 200 chars
                truncated_url = url[:200] + "..."
        
        self.error(
            "Request failed",
            method=method,
            url=truncated_url,
            error=error,
            error_type=error_type,
            process_time=round(process_time, 3),
            **kwargs
        )
    
    def log_processing_step(self, step: str, duration: float = None, **kwargs):
        """Log processing step with timing"""
        log_data = {
            "step": step,
            **kwargs
        }
        if duration is not None:
            log_data["duration_ms"] = round(duration * 1000, 2)
        
        self.info(f"Processing step: {step}", **log_data)
    
    def log_validation_error(self, field: str, message: str, value: Any = None, **kwargs):
        """Log validation error with context"""
        self.warning(
            f"Validation error: {message}",
            field=field,
            value=str(value) if value is not None else None,
            **kwargs
        )
    
    def log_performance_metric(self, metric_name: str, value: float, unit: str = "ms", **kwargs):
        """Log performance metric"""
        self.info(
            f"Performance metric: {metric_name}",
            metric_name=metric_name,
            value=value,
            unit=unit,
            **kwargs
        )
    
    def log_file_operation(self, operation: str, file_path: str, file_size: int = None, **kwargs):
        """Log file operation with context"""
        log_data = {
            "operation": operation,
            "file_path": file_path,
            **kwargs
        }
        if file_size is not None:
            log_data["file_size_bytes"] = file_size
        
        self.info(f"File operation: {operation}", **log_data)
    
    def log_api_call(self, service: str, endpoint: str, method: str = "POST", status_code: int = None, duration: float = None, **kwargs):
        """Log external API call"""
        log_data = {
            "service": service,
            "endpoint": endpoint,
            "method": method,
            **kwargs
        }
        if status_code is not None:
            log_data["status_code"] = status_code
        if duration is not None:
            log_data["duration_ms"] = round(duration * 1000, 2)
        
        self.info(f"API call: {service} {endpoint}", **log_data)
    
    def log_error_with_context(self, error: Exception, context: Dict[str, Any] = None, **kwargs):
        """Log error with full context and traceback"""
        if context is None:
            context = {}
        
        self.error(
            f"Error: {type(error).__name__}: {str(error)}",
            error_type=type(error).__name__,
            error_message=str(error),
            context=context,
            **kwargs
        )

# Global logger instance
logger = ImageProcessorLogger()

def set_request_id(request_id: str):
    """Set request ID in context for logging"""
    request_id_var.set(request_id)

def get_request_id() -> Optional[str]:
    """Get current request ID from context"""
    return request_id_var.get()

def clear_request_id():
    """Clear request ID from context"""
    request_id_var.set(None)
