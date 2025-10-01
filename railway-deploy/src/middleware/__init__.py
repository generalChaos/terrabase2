"""
Middleware package for the Image Processor Service
"""

from .request_id import RequestIDMiddleware

__all__ = ["RequestIDMiddleware"]
