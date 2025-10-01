"""
Request ID Middleware
Adds unique request IDs to all requests for better debugging and tracing
"""

import uuid
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from src.logging import logger, set_request_id, clear_request_id

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add unique request IDs to all requests"""
    
    def __init__(self, app, header_name: str = "X-Request-ID"):
        super().__init__(app)
        self.header_name = header_name
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate or extract request ID
        request_id = request.headers.get(self.header_name)
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Add request ID to request state for use in handlers
        request.state.request_id = request_id
        
        # Set request ID in context for structured logging
        set_request_id(request_id)
        
        # Start timing
        start_time = time.time()
        
        # Log request start
        logger.log_request_start(
            method=request.method,
            url=str(request.url),
            client_ip=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", "unknown")
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Add request ID to response headers
            response.headers[self.header_name] = request_id
            
            # Log request completion
            logger.log_request_end(
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                process_time=process_time
            )
            
            return response
            
        except Exception as e:
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log request error
            logger.log_request_error(
                method=request.method,
                url=str(request.url),
                error=str(e),
                error_type=type(e).__name__,
                process_time=process_time
            )
            
            # Re-raise the exception
            raise
        finally:
            # Clear request ID from context
            clear_request_id()
