"""
Safe Image Processor Service for Railway deployment
No external dependencies that could fail on startup
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Create FastAPI app
app = FastAPI(
    title="Image Processor Service",
    description="Image processing service for party-game",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Image Processor",
        "version": "1.0.0",
        "status": "running",
        "environment": {
            "port": os.getenv("PORT", "not_set"),
            "python_path": os.getenv("PYTHONPATH", "not_set"),
            "working_dir": os.getcwd()
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "image-processor",
        "version": "1.0.0",
        "environment": {
            "port": os.getenv("PORT", "not_set"),
            "python_path": os.getenv("PYTHONPATH", "not_set")
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main_safe:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000))
    )
