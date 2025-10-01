# API Paths Reference

This document provides quick reference for API endpoints and file paths after reorganization.

## File Organization

### Input Assets
```
test-input/
├── logos/
│   ├── king-cobra-youth-soccer-logo.png
│   ├── king-cobra-logo-variant-3.png
│   └── turbo-turtles-logo-variant-3.png
├── tshirts/
│   ├── black-male-front.png
│   └── black-male-back.png
└── masks/
    └── black-part-transparent.png
```

## API Endpoints

### Logo Placement
```bash
POST /api/v1/place-logo
```

**Example Request:**
```json
{
  "tshirt_image_url": "file:///path/to/test-input/tshirts/black-male-back.png",
  "logo_url": "file:///path/to/test-input/logos/king-cobra-youth-soccer-logo.png",
  "position": "back_center",
  "scale_factor": 0.35,
  "auto_remove_background": true
}
```

### Asset Pack Generation
```bash
POST /api/v1/generate-asset-pack
```

**Example Request:**
```json
{
  "logo_url": "file:///path/to/test-input/logos/king-cobra-youth-soccer-logo.png",
  "front_tshirt_url": "file:///path/to/test-input/tshirts/black-male-front.png",
  "back_tshirt_url": "file:///path/to/test-input/tshirts/black-male-back.png",
  "logo_position": "left_chest",
  "logo_scale": 0.24,
  "back_position": "back_center",
  "back_scale": 0.35,
  "output_format": "png"
}
```

### Web Asset Preprocessing
```bash
POST /api/v1/preprocess-logo
```

**Example Request:**
```json
{
  "logo_url": "file:///path/to/test-input/logos/king-cobra-youth-soccer-logo.png",
  "output_format": "png",
  "quality": 95,
  "remove_background": true,
  "web_optimize": true
}
```

## File Path Examples

### Logo Assets
- `file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/logos/king-cobra-youth-soccer-logo.png`
- `file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/logos/turbo-turtles-logo-variant-3.png`

### T-Shirt Assets
- `file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/tshirts/black-male-front.png`
- `file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/tshirts/black-male-back.png`

### Mask Assets
- `file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/masks/black-part-transparent.png`

## Output Structure

### Asset Packs
```
output/asset-packs/{logo-slug}/
├── {logo-slug}_clean_{timestamp}.png
├── {logo-slug}_left_chest_{timestamp}.png
└── {logo-slug}_back_center_{timestamp}.png
```

### Individual Placements
```
output/tshirt_with_logo_{timestamp}.png
```

### Web Assets
```
output/web-assets/{logo-slug}_web_ready_{timestamp}.png
```

## Quick Test Commands

### Test Back Placement
```bash
curl -X POST http://localhost:8000/api/v1/place-logo \
  -H "Content-Type: application/json" \
  -d '{
    "tshirt_image_url": "file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/tshirts/black-male-back.png",
    "logo_url": "file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/logos/king-cobra-youth-soccer-logo.png",
    "position": "back_center",
    "scale_factor": 0.35,
    "auto_remove_background": true
  }'
```

### Test Asset Pack
```bash
curl -X POST http://localhost:8000/api/v1/generate-asset-pack \
  -H "Content-Type: application/json" \
  -d '{
    "logo_url": "file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/logos/king-cobra-youth-soccer-logo.png",
    "front_tshirt_url": "file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/tshirts/black-male-front.png",
    "back_tshirt_url": "file:///Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor/test-input/tshirts/black-male-back.png",
    "logo_position": "left_chest",
    "logo_scale": 0.24,
    "back_position": "back_center",
    "back_scale": 0.35,
    "output_format": "png"
  }'
```
