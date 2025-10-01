"""
Supabase client for the Image Processor Service
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncio
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

logger = logging.getLogger(__name__)

class SupabaseClient:
    """Supabase client wrapper for image processor service"""
    
    def __init__(self):
        # Environment variable configuration
        self.enabled = os.getenv("SUPABASE_ENABLED", "true").lower() == "true"
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        # Table name configuration
        self.requests_table = os.getenv("SUPABASE_REQUESTS_TABLE", "processing_requests")
        self.results_table = os.getenv("SUPABASE_RESULTS_TABLE", "processing_results")
        self.errors_table = os.getenv("SUPABASE_ERRORS_TABLE", "validation_errors")
        self.metrics_table = os.getenv("SUPABASE_METRICS_TABLE", "performance_metrics")
        
        # Cleanup configuration
        self.cleanup_enabled = os.getenv("SUPABASE_CLEANUP_ENABLED", "true").lower() == "true"
        self.cleanup_days = int(os.getenv("SUPABASE_CLEANUP_DAYS", "30"))
        
        if not self.enabled:
            logger.info("Supabase integration disabled via SUPABASE_ENABLED=false")
            self.client = None
            return
        
        if not self.url or not self.key:
            logger.warning("Supabase credentials not found. Database operations will be disabled.")
            self.client = None
            return
        
        # Use service key for server-side operations
        key_to_use = self.service_key or self.key
        
        try:
            self.client = create_client(
                self.url,
                key_to_use,
                options=ClientOptions(
                    auto_refresh_token=True,
                    persist_session=False
                )
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Supabase client is available"""
        return self.client is not None
    
    async def log_processing_request(self, request_data: Dict[str, Any]) -> Optional[str]:
        """Log a processing request to the database"""
        if not self.is_available():
            return None
        
        try:
            data = {
                "request_id": request_data.get("request_id"),
                "endpoint": request_data.get("endpoint"),
                "image_url": request_data.get("image_url"),
                "parameters": request_data.get("parameters", {}),
                "client_ip": request_data.get("client_ip"),
                "user_agent": request_data.get("user_agent"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.requests_table).insert(data).execute()
            
            if result.data:
                logger.info("Processing request logged", request_id=request_data.get("request_id"))
                return result.data[0]["id"]
            
        except Exception as e:
            logger.error(f"Failed to log processing request: {e}")
        
        return None
    
    async def log_processing_result(self, result_data: Dict[str, Any]) -> Optional[str]:
        """Log a processing result to the database"""
        if not self.is_available():
            return None
        
        try:
            data = {
                "request_id": result_data.get("request_id"),
                "success": result_data.get("success"),
                "processing_time_ms": result_data.get("processing_time_ms"),
                "file_size_bytes": result_data.get("file_size_bytes"),
                "output_url": result_data.get("output_url"),
                "error_message": result_data.get("error_message"),
                "processing_steps": result_data.get("processing_steps", []),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.results_table).insert(data).execute()
            
            if result.data:
                logger.info("Processing result logged", request_id=result_data.get("request_id"))
                return result.data[0]["id"]
            
        except Exception as e:
            logger.error(f"Failed to log processing result: {e}")
        
        return None
    
    async def log_validation_error(self, error_data: Dict[str, Any]) -> Optional[str]:
        """Log a validation error to the database"""
        if not self.is_available():
            return None
        
        try:
            data = {
                "request_id": error_data.get("request_id"),
                "field": error_data.get("field"),
                "error_message": error_data.get("error_message"),
                "value": error_data.get("value"),
                "endpoint": error_data.get("endpoint"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table("validation_errors").insert(data).execute()
            
            if result.data:
                logger.info("Validation error logged", request_id=error_data.get("request_id"))
                return result.data[0]["id"]
            
        except Exception as e:
            logger.error(f"Failed to log validation error: {e}")
        
        return None
    
    async def log_performance_metric(self, metric_data: Dict[str, Any]) -> Optional[str]:
        """Log a performance metric to the database"""
        if not self.is_available():
            return None
        
        try:
            data = {
                "request_id": metric_data.get("request_id"),
                "metric_name": metric_data.get("metric_name"),
                "value": metric_data.get("value"),
                "unit": metric_data.get("unit", "ms"),
                "endpoint": metric_data.get("endpoint"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table("performance_metrics").insert(data).execute()
            
            if result.data:
                logger.info("Performance metric logged", 
                           metric_name=metric_data.get("metric_name"),
                           value=metric_data.get("value"))
                return result.data[0]["id"]
            
        except Exception as e:
            logger.error(f"Failed to log performance metric: {e}")
        
        return None
    
    async def get_processing_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get processing statistics for the last N hours"""
        if not self.is_available():
            return {}
        
        try:
            # Get total requests
            requests_result = self.client.table("processing_requests").select("id").execute()
            total_requests = len(requests_result.data) if requests_result.data else 0
            
            # Get successful results
            success_result = self.client.table("processing_results").select("id").eq("success", True).execute()
            successful_requests = len(success_result.data) if success_result.data else 0
            
            # Get failed results
            failed_result = self.client.table("processing_results").select("id").eq("success", False).execute()
            failed_requests = len(failed_result.data) if failed_result.data else 0
            
            # Calculate success rate
            success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
            
            return {
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "failed_requests": failed_requests,
                "success_rate": round(success_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get processing stats: {e}")
            return {}
    
    async def get_endpoint_stats(self, endpoint: str, hours: int = 24) -> Dict[str, Any]:
        """Get statistics for a specific endpoint"""
        if not self.is_available():
            return {}
        
        try:
            # Get requests for this endpoint
            requests_result = self.client.table("processing_requests").select("id").eq("endpoint", endpoint).execute()
            total_requests = len(requests_result.data) if requests_result.data else 0
            
            # Get results for this endpoint
            results_result = self.client.table("processing_results").select("*").eq("endpoint", endpoint).execute()
            
            if not results_result.data:
                return {"total_requests": total_requests, "success_rate": 0, "avg_processing_time": 0}
            
            successful = [r for r in results_result.data if r.get("success")]
            failed = [r for r in results_result.data if not r.get("success")]
            
            success_rate = (len(successful) / len(results_result.data) * 100) if results_result.data else 0
            
            # Calculate average processing time
            processing_times = [r.get("processing_time_ms", 0) for r in results_result.data if r.get("processing_time_ms")]
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
            
            return {
                "total_requests": total_requests,
                "successful_requests": len(successful),
                "failed_requests": len(failed),
                "success_rate": round(success_rate, 2),
                "avg_processing_time_ms": round(avg_processing_time, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get endpoint stats: {e}")
            return {}
    
    async def cleanup_old_records(self, days: int = 30) -> int:
        """Clean up old records to prevent database bloat"""
        if not self.is_available():
            return 0
        
        try:
            cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            cutoff_date = cutoff_date.replace(day=cutoff_date.day - days)
            
            # Delete old processing requests
            requests_result = self.client.table("processing_requests").delete().lt("created_at", cutoff_date.isoformat()).execute()
            deleted_requests = len(requests_result.data) if requests_result.data else 0
            
            # Delete old processing results
            results_result = self.client.table("processing_results").delete().lt("created_at", cutoff_date.isoformat()).execute()
            deleted_results = len(results_result.data) if results_result.data else 0
            
            # Delete old validation errors
            errors_result = self.client.table("validation_errors").delete().lt("created_at", cutoff_date.isoformat()).execute()
            deleted_errors = len(errors_result.data) if errors_result.data else 0
            
            total_deleted = deleted_requests + deleted_results + deleted_errors
            
            logger.info(f"Cleaned up {total_deleted} old records", 
                       deleted_requests=deleted_requests,
                       deleted_results=deleted_results,
                       deleted_errors=deleted_errors)
            
            return total_deleted
            
        except Exception as e:
            logger.error(f"Failed to cleanup old records: {e}")
            return 0

# Global Supabase client instance
supabase_client = SupabaseClient()
