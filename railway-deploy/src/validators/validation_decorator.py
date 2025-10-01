"""
Validation decorator for API endpoints
"""

import functools
import logging
from typing import Callable, Any, Dict
from fastapi import HTTPException
from .input_validators import ValidationError

logger = logging.getLogger(__name__)

def validate_input(**validation_rules: Callable):
    """
    Decorator to validate input parameters for API endpoints
    
    Args:
        **validation_rules: Mapping of parameter names to validation functions
        
    Example:
        @validate_input(
            image_url=lambda x: InputValidator.validate_image_url(x, "image_url"),
            scale_factor=lambda x: InputValidator.validate_scale_factor(x, "scale_factor")
        )
        async def process_image(image_url: str, scale_factor: float):
            # Function implementation
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # Apply validation rules to kwargs
                for param_name, validator in validation_rules.items():
                    if param_name in kwargs:
                        kwargs[param_name] = validator(kwargs[param_name])
                
                # Call the original function
                return await func(*args, **kwargs)
                
            except ValidationError as e:
                logger.warning(f"Validation error in {func.__name__}: {e.message}")
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Validation failed",
                        "message": e.message,
                        "field": e.field
                    }
                )
            except Exception as e:
                logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "Internal server error",
                        "message": "An unexpected error occurred"
                    }
                )
        
        return wrapper
    return decorator

def validate_request_data(request_data: Any, validation_rules: Dict[str, Callable]) -> Any:
    """
    Validate request data using provided validation rules
    
    Args:
        request_data: The request data to validate
        validation_rules: Mapping of field names to validation functions
        
    Returns:
        Validated request data
        
    Raises:
        ValidationError: If validation fails
    """
    if not isinstance(request_data, dict):
        raise ValidationError("Request data must be a dictionary")
    
    validated_data = {}
    
    for field_name, validator in validation_rules.items():
        if field_name in request_data:
            try:
                validated_data[field_name] = validator(request_data[field_name])
            except ValidationError as e:
                # Re-raise with field context
                raise ValidationError(f"{field_name}: {e.message}", field_name)
    
    # Add any fields that weren't validated but exist in request_data
    for key, value in request_data.items():
        if key not in validated_data:
            validated_data[key] = value
    
    return validated_data
