# Roster Shirt Generation Flow

## Overview
This document describes the updated image processing flow for generating team roster shirts, including the new roster-only back shirt functionality.

## Key Features

### 1. Logo Placement on T-Shirts
- **Front Shirt**: Logo placed on left chest area
- **Back Shirt**: Two modes available:
  - **Logo + Roster**: Large logo in center with team roster below
  - **Roster Only**: Just the team roster list (no logo)

### 2. Roster-Only Back Shirt
- **Purpose**: Clean back shirt design with only team roster
- **No Logo Required**: The `logo_url` parameter is optional when `include_roster=true` and `position="back_center"`
- **Text Format**: 
  - Title: "TEAM ROSTER"
  - Format: `[Number] [Name]` (e.g., "9 Iggy", "11 Marcelo")
  - Alignment: Numbers right-aligned, names left-aligned for consistency

## API Endpoints

### Logo Placement API
**Endpoint**: `POST /api/v1/place-logo`

#### Request Body
```json
{
  "tshirt_image_url": "file:///path/to/tshirt.png",
  "logo_url": "file:///path/to/logo.png",  // Optional for roster-only mode
  "position": "back_center",               // left_chest, center_chest, back_center
  "include_roster": true,                  // Enable roster text
  "players": [                             // Required when include_roster=true
    {"number": 9, "name": "Iggy"},
    {"number": 11, "name": "Marcelo"},
    {"number": 7, "name": "Val"},
    {"number": 6, "name": "Cash"},
    {"number": 8, "name": "Wolfie"}
  ],
  "output_format": "png",
  "quality": 95
}
```

#### Roster-Only Mode
When `include_roster=true`, `position="back_center"`, and `players` are provided:
- `logo_url` becomes optional
- Only roster text is added to the shirt
- No logo processing occurs

#### Response
```json
{
  "success": true,
  "processed_url": "./output/tshirt_with_logo_1234567890.png",
  "original_tshirt_url": "file:///path/to/tshirt.png",
  "original_logo_url": "file:///path/to/logo.png",
  "position_used": "back_center",
  "scale_factor_used": 0.15,
  "file_size_bytes": 123456,
  "processing_time_ms": 1500
}
```

## Usage Examples

### 1. Front Shirt with Logo
```bash
curl -X POST "http://localhost:8000/api/v1/place-logo" \
  -H "Content-Type: application/json" \
  -d '{
    "tshirt_image_url": "file:///path/to/front-shirt.png",
    "logo_url": "file:///path/to/logo.png",
    "position": "left_chest",
    "scale_factor": 0.15
  }'
```

### 2. Back Shirt with Logo + Roster
```bash
curl -X POST "http://localhost:8000/api/v1/place-logo" \
  -H "Content-Type: application/json" \
  -d '{
    "tshirt_image_url": "file:///path/to/back-shirt.png",
    "logo_url": "file:///path/to/logo.png",
    "position": "back_center",
    "scale_factor": 0.25,
    "include_roster": true,
    "players": [
      {"number": 9, "name": "Iggy"},
      {"number": 11, "name": "Marcelo"},
      {"number": 7, "name": "Val"},
      {"number": 6, "name": "Cash"},
      {"number": 8, "name": "Wolfie"}
    ]
  }'
```

### 3. Back Shirt Roster Only (No Logo)
```bash
curl -X POST "http://localhost:8000/api/v1/place-logo" \
  -H "Content-Type: application/json" \
  -d '{
    "tshirt_image_url": "file:///path/to/back-shirt.png",
    "position": "back_center",
    "include_roster": true,
    "players": [
      {"number": 9, "name": "Iggy"},
      {"number": 11, "name": "Marcelo"},
      {"number": 7, "name": "Val"},
      {"number": 6, "name": "Cash"},
      {"number": 8, "name": "Wolfie"}
    ]
  }'
```

## Technical Implementation

### Font Handling
- Uses PIL's default font to avoid loading issues
- Consistent text rendering across different systems
- No external font dependencies

### Text Positioning
- **Title**: Centered at 70% from top
- **Roster**: Starts 30px below title
- **Alignment**: Numbers right-aligned, names left-aligned
- **Line Height**: 25px between players
- **Column Overflow**: Automatically moves to next column if space runs out

### Image Processing
- Supports both `file://` URLs and local file paths
- Automatic RGBA conversion for transparency support
- PNG output with optimization
- No AI background removal for roster-only mode (faster processing)

## File Structure
```
apps/image-processor/
├── src/
│   ├── api/
│   │   └── logo_placement.py    # Main logo placement API
│   └── main.py                  # FastAPI app entry point
├── test-input/
│   ├── tshirts/
│   │   ├── front-shirt-black.png
│   │   └── back-shirt-black.png
│   └── logos/
│       └── team-logo.png
└── output/                      # Generated images
    └── tshirt_with_logo_*.png
```

## Error Handling
- **Missing logo_url**: Returns error for normal logo placement mode
- **Missing players**: Returns error when `include_roster=true`
- **Invalid position**: Falls back to left_chest
- **Font loading**: Uses default font if system fonts fail
- **Image loading**: Returns detailed error messages for file issues

## Performance Notes
- **Roster-only mode**: Fast processing (no AI background removal)
- **Logo placement mode**: Slower due to background removal
- **Font loading**: Optimized to use default fonts
- **Memory usage**: Minimal for text-only operations

## Future Enhancements
- Custom font support
- Text styling options (colors, sizes)
- Multiple roster layouts
- Batch processing for multiple shirts
- Integration with asset pack generation
