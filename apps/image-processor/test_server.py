#!/usr/bin/env python3
"""
Minimal test server to verify Railway deployment
"""
import os
from fastapi import FastAPI

app = FastAPI(title="Image Processor Test", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Image Processor Test Server", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Test server is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
