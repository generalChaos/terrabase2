# Image Processor API Reference

This document provides comprehensive documentation for the Image Processor API endpoints.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## Authentication

Currently, no authentication is required. Rate limiting and file validation provide basic protection.

## Endpoints

### Health Check

#### `GET /health`

Check the health status of the service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

### Root Information

#### `GET /`

Get basic information about the service and available endpoints.

**Response:**
```json
{
  "service": "Image Processor",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "upscaling": "/api/v1/upscale",
    "asset_pack": "/api/v1/asset-pack",
    "stats": "/api/v1/stats",
    "health": "/health",
    "docs": "/docs"
  }
}
```

## API Endpoints

### Upscaling

#### `POST /api/v1/upscale`

Upscale an image using AI-powered upscaling.

**Request Body:**
```json
{
  "image_url": "https://example.com/image.png",
  "scale_factor": 4,
  "output_format": "png",
  "quality": 95
}
```

**Parameters:**
- `image_url` (string, required): URL of the image to upscale
- `scale_factor` (integer, optional): Upscaling factor (2, 4, or 8). Default: 4
- `output_format` (string, optional): Output format (png, jpg, webp). Default: "png"
- `quality` (integer, optional): Output quality (1-100). Default: 95

**Response:**
```json
{
  "success": true,
  "original_url": "https://example.com/image.png",
  "upscaled_url": "file:///path/to/upscaled.png",
  "scale_factor": 4,
  "processing_time_ms": 1500,
  "file_size_bytes": 1024000
}
```

**Error Response:**
```json
{
  "success": false,
  "original_url": "https://example.com/image.png",
  "scale_factor": 4,
  "processing_time_ms": 500,
  "error": "Error message"
}
```

### Asset Pack Creation

#### `POST /api/v1/asset-pack`

Create a complete asset pack for a team logo, including cleaned logo, t-shirt designs, and optional banner.

**Request Body:**
```json
{
  "logo_url": "https://example.com/logo.png",
  "team_name": "Thunder Hawks",
  "players": [
    {"number": 9, "name": "Iggy"},
    {"number": 11, "name": "Marcelo"},
    {"number": 7, "name": "Val"}
  ],
  "tshirt_color": "black",
  "include_banner": true,
  "output_format": "png",
  "quality": 95
}
```

**Parameters:**
- `logo_url` (string, required): URL of the logo to process
- `team_name` (string, required): Team name (1-100 characters)
- `players` (array, required): Team roster (1-20 players)
  - `number` (integer): Player number (1-99)
  - `name` (string): Player name (1-50 characters)
- `tshirt_color` (string, optional): T-shirt color (black, white). Default: "black"
- `include_banner` (boolean, optional): Include banner generation. Default: true
- `output_format` (string, optional): Output format (png, jpg, webp). Default: "png"
- `quality` (integer, optional): Output quality (1-100). Default: 95

**Response:**
```json
{
  "success": true,
  "team_name": "Thunder Hawks",
  "clean_logo_url": "file:///path/to/clean_logo.png",
  "tshirt_front_url": "file:///path/to/tshirt_front.png",
  "tshirt_back_url": "file:///path/to/tshirt_back.png",
  "banner_url": "file:///path/to/banner.png",
  "processing_time_ms": 5000
}
```

**Error Response:**
```json
{
  "success": false,
  "team_name": "Thunder Hawks",
  "processing_time_ms": 2000,
  "error": "Error message"
}
```

## Statistics Endpoints

### Overall Statistics

#### `GET /api/v1/stats`

Get overall processing statistics.

**Query Parameters:**
- `hours` (integer, optional): Number of hours to look back. Default: 24

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 100,
    "successful_requests": 95,
    "failed_requests": 5,
    "success_rate": 95.0
  },
  "period_hours": 24
}
```

### Endpoint-Specific Statistics

#### `GET /api/v1/stats/endpoint/{endpoint}`

Get statistics for a specific endpoint.

**Path Parameters:**
- `endpoint` (string): Endpoint name (e.g., "upscale", "asset-pack")

**Query Parameters:**
- `hours` (integer, optional): Number of hours to look back. Default: 24

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 25,
    "successful_requests": 24,
    "failed_requests": 1,
    "success_rate": 96.0,
    "avg_processing_time_ms": 1500.0
  },
  "endpoint": "upscale",
  "period_hours": 24
}
```

### Cleanup

#### `POST /api/v1/cleanup`

Clean up old records to free up storage space.

**Query Parameters:**
- `days` (integer, optional): Number of days to keep. Default: 30

**Response:**
```json
{
  "success": true,
  "deleted_records": 15,
  "retention_days": 30
}
```

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Validation error or invalid request
- `422 Unprocessable Entity`: Invalid request body format
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "field": "field_name"  // Only for validation errors
}
```

### Common Error Types

#### Validation Errors (400)
- Invalid image URL format
- File size exceeds limits
- Invalid scale factor (must be 2, 4, or 8)
- Invalid output format
- Invalid quality value (must be 1-100)
- Invalid team name length
- Invalid player data

#### File Validation Errors (400)
- File too large (exceeds size limits)
- Unsupported image format
- Invalid image dimensions
- File download failed

#### Processing Errors (200 with success: false)
- Background removal failed
- Image enhancement failed
- Logo overlay failed
- Banner generation failed

## File Limits

### Size Limits
- **Images**: 10MB maximum
- **Logos**: 5MB maximum
- **Banners**: 15MB maximum

### Dimension Limits
- **Minimum**: 16x16 pixels
- **Maximum**: 8192x8192 pixels

### Supported Formats
- **Input**: JPG, PNG, WebP, BMP, TIFF
- **Output**: PNG, JPG, WebP

## Rate Limiting

When using nginx, the following rate limits apply:
- **General API**: 10 requests per second
- **Heavy Processing** (upscaling, asset packs): 2 requests per second

## Request/Response Headers

### Request Headers
- `Content-Type: application/json` (for POST requests)
- `X-Request-ID: <uuid>` (optional, for request tracking)

### Response Headers
- `X-Request-ID: <uuid>` (for request tracking)
- `Content-Type: application/json`

## Examples

### Upscale an Image

```bash
curl -X POST "https://api.example.com/api/v1/upscale" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/logo.png",
    "scale_factor": 4,
    "output_format": "png",
    "quality": 95
  }'
```

### Create Asset Pack

```bash
curl -X POST "https://api.example.com/api/v1/asset-pack" \
  -H "Content-Type: application/json" \
  -d '{
    "logo_url": "https://example.com/logo.png",
    "team_name": "Thunder Hawks",
    "players": [
      {"number": 9, "name": "Iggy"},
      {"number": 11, "name": "Marcelo"}
    ],
    "tshirt_color": "black",
    "include_banner": true
  }'
```

### Get Statistics

```bash
curl "https://api.example.com/api/v1/stats?hours=24"
```

## Interactive Documentation

- **Swagger UI**: `https://api.example.com/docs`
- **ReDoc**: `https://api.example.com/redoc`

## Support

For issues or questions:
1. Check the error message and status code
2. Verify your request format matches the API specification
3. Check file size and format requirements
4. Review the interactive documentation at `/docs`
