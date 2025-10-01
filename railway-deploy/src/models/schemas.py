"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Dict, Any, List
from enum import Enum

class UpscaleModel(str, Enum):
    """Available upscaling models"""
    REALESRGAN = "realesrgan"
    ESRGAN = "esrgan"
    OPENCV = "opencv"

class VectorizeMethod(str, Enum):
    """Available vectorization methods"""
    POTRACE = "potrace"
    AUTOTRACE = "autotrace"
    TEMPLATE = "template"

class UpscaleRequest(BaseModel):
    """Request model for image upscaling"""
    image_url: HttpUrl = Field(..., description="URL of the image to upscale")
    scale_factor: int = Field(2, ge=1, le=8, description="Upscaling factor (1-8)")
    model: UpscaleModel = Field(UpscaleModel.REALESRGAN, description="Upscaling model to use")
    output_format: str = Field("png", description="Output image format")
    quality: int = Field(95, ge=1, le=100, description="Output quality (1-100)")

class UpscaleResponse(BaseModel):
    """Response model for image upscaling"""
    success: bool
    upscaled_url: Optional[str] = None
    original_url: HttpUrl
    scale_factor: int
    model_used: str = Field(alias="model_used")
    processing_time_ms: int
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None
    
    model_config = {"protected_namespaces": ()}

class VectorizeRequest(BaseModel):
    """Request model for SVG vectorization"""
    image_url: HttpUrl = Field(..., description="URL of the image to vectorize")
    method: VectorizeMethod = Field(VectorizeMethod.POTRACE, description="Vectorization method")
    optimize: bool = Field(True, description="Optimize SVG output")
    color_count: int = Field(16, ge=2, le=256, description="Number of colors to use")
    smooth: bool = Field(True, description="Apply smoothing")

class VectorizeResponse(BaseModel):
    """Response model for SVG vectorization"""
    success: bool
    svg_url: Optional[str] = None
    original_url: HttpUrl
    method_used: str
    processing_time_ms: int
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

class BatchUpscaleRequest(BaseModel):
    """Request model for batch upscaling"""
    image_urls: List[HttpUrl] = Field(..., min_length=1, max_length=10, description="List of image URLs")
    scale_factor: int = Field(2, ge=1, le=8)
    model: UpscaleModel = Field(UpscaleModel.REALESRGAN)
    output_format: str = Field("png")
    quality: int = Field(95, ge=1, le=100)

class BatchUpscaleResponse(BaseModel):
    """Response model for batch upscaling"""
    success: bool
    results: List[UpscaleResponse]
    total_processed: int
    total_failed: int
    processing_time_ms: int

class JobStatus(BaseModel):
    """Job status model"""
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int = Field(0, ge=0, le=100)
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    service: str
    version: str
    checks: Dict[str, Any]

class PreprocessRequest(BaseModel):
    """Request model for image preprocessing"""
    image_url: HttpUrl = Field(..., description="URL of the image to preprocess")
    options: Dict[str, Any] = Field(default_factory=dict, description="Preprocessing options")

class PreprocessResponse(BaseModel):
    """Response model for image preprocessing"""
    success: bool
    processed_url: Optional[str] = None
    original_url: HttpUrl
    preprocessing_applied: List[str] = Field(default_factory=list)
    file_size_bytes: Optional[int] = None
    error: Optional[str] = None

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    status_code: int
    path: str
    detail: Optional[str] = None
