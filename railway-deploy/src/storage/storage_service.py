"""
Storage service for easy integration throughout the application
"""

import logging
from typing import Optional, Dict, Any
from .storage_interface import storage_client

logger = logging.getLogger(__name__)

class StorageService:
    """High-level storage service for application integration"""
    
    def __init__(self):
        self.storage = storage_client
    
    async def log_request(self, request_id: str, endpoint: str, image_url: str, 
                         parameters: Dict[str, Any] = None, client_ip: str = None, 
                         user_agent: str = None) -> Optional[str]:
        """Log a processing request"""
        try:
            data = {
                "request_id": request_id,
                "endpoint": endpoint,
                "image_url": image_url,
                "parameters": parameters or {},
                "client_ip": client_ip,
                "user_agent": user_agent
            }
            
            return await self.storage.log_processing_request(data)
        except Exception as e:
            logger.error(f"Failed to log request: {e}")
            return None
    
    async def log_success(self, request_id: str, processing_time_ms: int, 
                         file_size_bytes: int = None, output_url: str = None,
                         processing_steps: list = None, endpoint: str = None) -> Optional[str]:
        """Log a successful processing result"""
        try:
            data = {
                "request_id": request_id,
                "success": True,
                "processing_time_ms": processing_time_ms,
                "file_size_bytes": file_size_bytes,
                "output_url": output_url,
                "processing_steps": processing_steps or [],
                "endpoint": endpoint
            }
            
            return await self.storage.log_processing_result(data)
        except Exception as e:
            logger.error(f"Failed to log success: {e}")
            return None
    
    async def log_failure(self, request_id: str, error_message: str, 
                         processing_time_ms: int = None, processing_steps: list = None,
                         endpoint: str = None) -> Optional[str]:
        """Log a failed processing result"""
        try:
            data = {
                "request_id": request_id,
                "success": False,
                "processing_time_ms": processing_time_ms or 0,
                "error_message": error_message,
                "processing_steps": processing_steps or [],
                "endpoint": endpoint
            }
            
            return await self.storage.log_processing_result(data)
        except Exception as e:
            logger.error(f"Failed to log failure: {e}")
            return None
    
    async def log_validation_error(self, request_id: str, field: str, 
                                  error_message: str, value: Any = None,
                                  endpoint: str = None) -> Optional[str]:
        """Log a validation error"""
        try:
            data = {
                "request_id": request_id,
                "field": field,
                "error_message": error_message,
                "value": str(value) if value is not None else None,
                "endpoint": endpoint
            }
            
            return await self.storage.log_validation_error(data)
        except Exception as e:
            logger.error(f"Failed to log validation error: {e}")
            return None
    
    async def log_performance_metric(self, request_id: str, metric_name: str, 
                                   value: float, unit: str = "ms",
                                   endpoint: str = None) -> Optional[str]:
        """Log a performance metric"""
        try:
            data = {
                "request_id": request_id,
                "metric_name": metric_name,
                "value": value,
                "unit": unit,
                "endpoint": endpoint
            }
            
            return await self.storage.log_performance_metric(data)
        except Exception as e:
            logger.error(f"Failed to log performance metric: {e}")
            return None
    
    async def get_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get overall processing statistics"""
        try:
            return await self.storage.get_processing_stats(hours)
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}
    
    async def get_endpoint_stats(self, endpoint: str, hours: int = 24) -> Dict[str, Any]:
        """Get endpoint-specific statistics"""
        try:
            return await self.storage.get_endpoint_stats(endpoint, hours)
        except Exception as e:
            logger.error(f"Failed to get endpoint stats: {e}")
            return {}
    
    async def cleanup(self, days: int = 30) -> int:
        """Clean up old records"""
        try:
            return await self.storage.cleanup_old_records(days)
        except Exception as e:
            logger.error(f"Failed to cleanup: {e}")
            return 0

# Global storage service instance
storage_service = StorageService()
