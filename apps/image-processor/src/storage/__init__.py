"""
Storage package for the Image Processor Service
Supports configurable storage backends (local files, Supabase, or none)
"""

from .storage_interface import (
    StorageInterface,
    LocalFileStorage,
    NoOpStorage,
    StorageType,
    create_storage_client,
    storage_client
)
from .storage_service import StorageService, storage_service

__all__ = [
    "StorageInterface",
    "LocalFileStorage", 
    "NoOpStorage",
    "StorageType",
    "create_storage_client",
    "storage_client",
    "StorageService",
    "storage_service"
]
