# Use Python 3.9 slim image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY apps/image-processor/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code - copy individual files to avoid directory issues
COPY apps/image-processor/src/main.py ./src/
COPY apps/image-processor/src/api/ ./src/api/
COPY apps/image-processor/src/database/ ./src/database/
COPY apps/image-processor/src/logging/ ./src/logging/
COPY apps/image-processor/src/middleware/ ./src/middleware/
COPY apps/image-processor/src/models/ ./src/models/
COPY apps/image-processor/src/services/ ./src/services/
COPY apps/image-processor/src/storage/ ./src/storage/
COPY apps/image-processor/src/utils/ ./src/utils/
COPY apps/image-processor/src/validators/ ./src/validators/

# Create necessary directories
RUN mkdir -p /app/temp /app/output /app/storage

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
