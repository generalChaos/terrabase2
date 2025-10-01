# Image Processor Service

A FastAPI-based service for image upscaling and asset pack creation, designed for the party-game project.

## Features

- **AI-Powered Image Upscaling**: High-quality image upscaling using Real-ESRGAN and ESRGAN models
- **Asset Pack Creation**: Complete team asset generation including logos, t-shirts, and banners
- **Asset Cleanup**: AI-powered background removal and image enhancement
- **Logo Overlay**: Automated logo placement on t-shirts and banners
- **Production Ready**: Comprehensive testing, validation, monitoring, and deployment
- **RESTful API**: Clean, well-documented API endpoints

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp env.example .env
   ```
3. Update `.env` with your configuration
4. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

### Local Development

1. Install Python 3.11+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your settings
   ```
4. Run the service:
   ```bash
   python -m uvicorn src.main:app --reload
   ```

## API Endpoints

### Core Endpoints
- `POST /api/v1/upscale` - Upscale images (2x, 4x, 8x)
- `POST /api/v1/asset-pack` - Create complete team asset pack

### Monitoring
- `GET /health` - Service health status
- `GET /api/v1/stats` - Processing statistics
- `GET /api/v1/stats/endpoint/{endpoint}` - Endpoint-specific stats
- `POST /api/v1/cleanup` - Clean up old records

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Asset Pack Creation

The `/api/v1/asset-pack` endpoint creates a complete set of team assets:

1. **Logo Cleanup**: Removes background and enhances the logo
2. **T-Shirt Front**: Places logo on t-shirt front (left chest)
3. **T-Shirt Back**: Adds team roster to t-shirt back
4. **Banner**: Creates banner with logo and roster (optional)

### Example Request

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
  "include_banner": true
}
```

## Configuration

### Environment Variables

See `env.example` for all available configuration options.

### Key Settings

- `STORAGE_TYPE`: Storage backend (local, supabase, none)
- `SUPABASE_URL`: Supabase database URL (if using Supabase)
- `MAX_IMAGE_SIZE_BYTES`: Maximum image file size (10MB default)
- `MAX_LOGO_SIZE_BYTES`: Maximum logo file size (5MB default)
- `CORS_ORIGINS`: Allowed CORS origins

## Production Features

### Security
- Input validation and file size limits
- Non-root Docker user
- Security headers (with nginx)
- Rate limiting (with nginx)

### Monitoring
- Request ID tracking
- Structured logging
- Health checks
- Performance metrics
- Statistics endpoints

### Reliability
- Comprehensive error handling
- File validation
- Graceful failure handling
- Request correlation

## Development

### Project Structure

```
src/
├── api/                 # API endpoints
│   ├── upscaling.py    # Image upscaling endpoint
│   ├── asset_pack.py   # Asset pack creation endpoint
│   └── stats.py        # Statistics endpoints
├── services/            # Core processing services
│   ├── asset_cleanup.py    # Logo cleanup service
│   └── logo_overlay.py     # Logo overlay service
├── validators/          # Input validation
├── storage/             # Storage abstraction
├── middleware/          # Request middleware
├── logging/             # Structured logging
└── main.py             # FastAPI application
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/unit/test_upscaling_api.py
```

## Deployment

### Railway (Recommended)

1. Connect GitHub repository to Railway
2. Set root directory to `apps/image-processor`
3. Configure environment variables
4. Deploy automatically

### Docker

```bash
# Build image
docker build -t image-processor .

# Run container
docker run -p 8000:8000 image-processor
```

### Docker Compose

```bash
# Development
docker-compose up --build

# Production
docker-compose -f deploy/docker-compose.prod.yml up -d
```

## Documentation

- [API Reference](docs/API_REFERENCE.md) - Complete API documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [Storage Configuration](docs/STORAGE_CONFIGURATION.md) - Storage setup
- [Quick Start](QUICK_START.md) - 5-minute setup guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is part of the party-game monorepo.