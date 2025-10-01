"""
Storage interface for the Image Processor Service
Supports both local file storage and Supabase database storage
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

class StorageType(Enum):
    """Supported storage types"""
    LOCAL = "local"
    SUPABASE = "supabase"
    NONE = "none"

class StorageInterface(ABC):
    """Abstract base class for storage implementations"""
    
    @abstractmethod
    async def log_processing_request(self, request_data: Dict[str, Any]) -> Optional[str]:
        """Log a processing request"""
        pass
    
    @abstractmethod
    async def log_processing_result(self, result_data: Dict[str, Any]) -> Optional[str]:
        """Log a processing result"""
        pass
    
    @abstractmethod
    async def log_validation_error(self, error_data: Dict[str, Any]) -> Optional[str]:
        """Log a validation error"""
        pass
    
    @abstractmethod
    async def log_performance_metric(self, metric_data: Dict[str, Any]) -> Optional[str]:
        """Log a performance metric"""
        pass
    
    @abstractmethod
    async def get_processing_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get processing statistics"""
        pass
    
    @abstractmethod
    async def get_endpoint_stats(self, endpoint: str, hours: int = 24) -> Dict[str, Any]:
        """Get endpoint statistics"""
        pass
    
    @abstractmethod
    async def cleanup_old_records(self, days: int = 30) -> int:
        """Clean up old records"""
        pass

class LocalFileStorage(StorageInterface):
    """Local file-based storage implementation"""
    
    def __init__(self, storage_dir: str = None):
        self.storage_dir = storage_dir or os.getenv("LOCAL_STORAGE_DIR", "./storage")
        self.requests_file = os.path.join(self.storage_dir, "requests.jsonl")
        self.results_file = os.path.join(self.storage_dir, "results.jsonl")
        self.errors_file = os.path.join(self.storage_dir, "errors.jsonl")
        self.metrics_file = os.path.join(self.storage_dir, "metrics.jsonl")
        
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize files if they don't exist
        for file_path in [self.requests_file, self.results_file, self.errors_file, self.metrics_file]:
            if not os.path.exists(file_path):
                with open(file_path, 'w') as f:
                    f.write("")
    
    def _append_to_file(self, file_path: str, data: Dict[str, Any]) -> str:
        """Append data to a JSONL file"""
        data["id"] = f"{datetime.utcnow().timestamp()}_{hash(str(data)) % 10000}"
        data["created_at"] = datetime.utcnow().isoformat()
        
        with open(file_path, 'a') as f:
            f.write(json.dumps(data) + '\n')
        
        return data["id"]
    
    def _read_jsonl_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Read all records from a JSONL file"""
        records = []
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            records.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
        return records
    
    async def log_processing_request(self, request_data: Dict[str, Any]) -> Optional[str]:
        """Log a processing request to local file"""
        try:
            record_id = self._append_to_file(self.requests_file, request_data)
            logger.debug("Processing request logged to local storage", request_id=request_data.get("request_id"))
            return record_id
        except Exception as e:
            logger.error(f"Failed to log processing request to local storage: {e}")
            return None
    
    async def log_processing_result(self, result_data: Dict[str, Any]) -> Optional[str]:
        """Log a processing result to local file"""
        try:
            record_id = self._append_to_file(self.results_file, result_data)
            logger.debug("Processing result logged to local storage", request_id=result_data.get("request_id"))
            return record_id
        except Exception as e:
            logger.error(f"Failed to log processing result to local storage: {e}")
            return None
    
    async def log_validation_error(self, error_data: Dict[str, Any]) -> Optional[str]:
        """Log a validation error to local file"""
        try:
            record_id = self._append_to_file(self.errors_file, error_data)
            logger.debug("Validation error logged to local storage", request_id=error_data.get("request_id"))
            return record_id
        except Exception as e:
            logger.error(f"Failed to log validation error to local storage: {e}")
            return None
    
    async def log_performance_metric(self, metric_data: Dict[str, Any]) -> Optional[str]:
        """Log a performance metric to local file"""
        try:
            record_id = self._append_to_file(self.metrics_file, metric_data)
            logger.debug("Performance metric logged to local storage", metric_name=metric_data.get("metric_name"))
            return record_id
        except Exception as e:
            logger.error(f"Failed to log performance metric to local storage: {e}")
            return None
    
    async def get_processing_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get processing statistics from local files"""
        try:
            requests = self._read_jsonl_file(self.requests_file)
            results = self._read_jsonl_file(self.results_file)
            
            total_requests = len(requests)
            successful = len([r for r in results if r.get("success")])
            failed = len([r for r in results if not r.get("success")])
            success_rate = (successful / total_requests * 100) if total_requests > 0 else 0
            
            return {
                "total_requests": total_requests,
                "successful_requests": successful,
                "failed_requests": failed,
                "success_rate": round(success_rate, 2)
            }
        except Exception as e:
            logger.error(f"Failed to get processing stats from local storage: {e}")
            return {}
    
    async def get_endpoint_stats(self, endpoint: str, hours: int = 24) -> Dict[str, Any]:
        """Get endpoint statistics from local files"""
        try:
            requests = [r for r in self._read_jsonl_file(self.requests_file) if r.get("endpoint") == endpoint]
            results = [r for r in self._read_jsonl_file(self.results_file) if r.get("endpoint") == endpoint]
            
            total_requests = len(requests)
            successful = len([r for r in results if r.get("success")])
            failed = len([r for r in results if not r.get("success")])
            success_rate = (successful / len(results) * 100) if results else 0
            
            # Calculate average processing time
            processing_times = [r.get("processing_time_ms", 0) for r in results if r.get("processing_time_ms")]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
            
            return {
                "total_requests": total_requests,
                "successful_requests": successful,
                "failed_requests": failed,
                "success_rate": round(success_rate, 2),
                "avg_processing_time_ms": round(avg_processing_time, 2)
            }
        except Exception as e:
            logger.error(f"Failed to get endpoint stats from local storage: {e}")
            return {}
    
    async def cleanup_old_records(self, days: int = 30) -> int:
        """Clean up old records from local files"""
        try:
            cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            cutoff_date = cutoff_date.replace(day=cutoff_date.day - days)
            cutoff_timestamp = cutoff_date.timestamp()
            
            total_deleted = 0
            
            # Clean up each file
            for file_path in [self.requests_file, self.results_file, self.errors_file, self.metrics_file]:
                if os.path.exists(file_path):
                    records = self._read_jsonl_file(file_path)
                    filtered_records = [r for r in records if r.get("created_at", "").split("T")[0] >= cutoff_date.strftime("%Y-%m-%d")]
                    
                    # Write filtered records back
                    with open(file_path, 'w') as f:
                        for record in filtered_records:
                            f.write(json.dumps(record) + '\n')
                    
                    deleted = len(records) - len(filtered_records)
                    total_deleted += deleted
            
            logger.info(f"Cleaned up {total_deleted} old records from local storage")
            return total_deleted
            
        except Exception as e:
            logger.error(f"Failed to cleanup old records from local storage: {e}")
            return 0

class NoOpStorage(StorageInterface):
    """No-op storage implementation for when storage is disabled"""
    
    async def log_processing_request(self, request_data: Dict[str, Any]) -> Optional[str]:
        logger.debug("Storage disabled - skipping request logging")
        return None
    
    async def log_processing_result(self, result_data: Dict[str, Any]) -> Optional[str]:
        logger.debug("Storage disabled - skipping result logging")
        return None
    
    async def log_validation_error(self, error_data: Dict[str, Any]) -> Optional[str]:
        logger.debug("Storage disabled - skipping error logging")
        return None
    
    async def log_performance_metric(self, metric_data: Dict[str, Any]) -> Optional[str]:
        logger.debug("Storage disabled - skipping metric logging")
        return None
    
    async def get_processing_stats(self, hours: int = 24) -> Dict[str, Any]:
        return {}
    
    async def get_endpoint_stats(self, endpoint: str, hours: int = 24) -> Dict[str, Any]:
        return {}
    
    async def cleanup_old_records(self, days: int = 30) -> int:
        return 0

def create_storage_client() -> StorageInterface:
    """Create storage client based on environment configuration"""
    storage_type = os.getenv("STORAGE_TYPE", "local").lower()
    
    if storage_type == StorageType.LOCAL.value:
        storage_dir = os.getenv("LOCAL_STORAGE_DIR", "./storage")
        logger.info(f"Using local file storage at {storage_dir}")
        return LocalFileStorage(storage_dir)
    
    elif storage_type == StorageType.SUPABASE.value:
        try:
            from database.supabase_client import SupabaseClient
            logger.info("Using Supabase storage")
            return SupabaseClient()
        except ImportError:
            logger.warning("Supabase not available, falling back to local storage")
            return LocalFileStorage()
    
    elif storage_type == StorageType.NONE.value:
        logger.info("Storage disabled")
        return NoOpStorage()
    
    else:
        logger.warning(f"Unknown storage type '{storage_type}', using local storage")
        return LocalFileStorage()

# Global storage client instance
storage_client = create_storage_client()
