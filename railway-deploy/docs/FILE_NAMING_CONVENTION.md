# File Naming Convention

This document outlines the standardized naming convention for all assets in the image processor service.

## Overview

Consistent file naming ensures:
- Easy identification of asset types
- Logical sorting and organization
- URL-safe filenames
- Scalable structure for future assets

## T-Shirt Assets

### Pattern
```
{color}-{gender}-{orientation}.png
```

### Examples
- `black-male-front.png`
- `black-male-back.png`
- `white-male-front.png`
- `white-male-back.png`
- `black-female-front.png`
- `white-female-back.png`

### Guidelines
- **Color**: Use lowercase (black, white, navy, red, etc.)
- **Gender**: Use lowercase (male, female, unisex)
- **Orientation**: Use lowercase (front, back)

## Logo Assets

### Pattern
```
{team-name}-{variant}-{type}.png
```

### Examples
- `king-cobra-youth-soccer-logo.png`
- `king-cobra-logo-variant-3.png`
- `turbo-turtles-logo-variant-3.png`

### Guidelines
- **Team Name**: Use kebab-case (lowercase with hyphens)
- **Variant**: Optional, use descriptive names (variant-1, variant-2, etc.)
- **Type**: Use descriptive terms (logo, icon, mark, etc.)

## Generated Asset Packs

### Pattern
```
{logo-slug}_{asset-type}_{timestamp}.png
```

### Examples
- `king-cobra-youth-soccer-logo_clean_1759209620527.png`
- `king-cobra-youth-soccer-logo_left_chest_1759209620527.png`
- `king-cobra-youth-soccer-logo_back_center_1759209620527.png`

### Guidelines
- **Logo Slug**: Generated from original logo name
- **Asset Type**: Use descriptive terms (clean, left_chest, back_center)
- **Timestamp**: Unix timestamp in milliseconds for uniqueness

## Folder Structure

### Input Assets
```
test-input/
├── logos/
│   ├── king-cobra-youth-soccer-logo.png
│   ├── king-cobra-logo-variant-3.png
│   └── turbo-turtles-logo-variant-3.png
├── tshirts/
│   ├── black-male-front.png
│   ├── black-male-back.png
│   ├── white-male-front.png
│   └── white-male-back.png
└── masks/
    └── black-part-transparent.png
```

### Output Assets
```
output/
├── asset-packs/
│   └── {logo-slug}/
│       ├── {logo-slug}_clean_{timestamp}.png
│       ├── {logo-slug}_left_chest_{timestamp}.png
│       └── {logo-slug}_back_center_{timestamp}.png
├── web-assets/
│   └── {logo-slug}_web_ready_{timestamp}.png
└── tshirt_with_logo_{timestamp}.png
```

## Naming Rules

1. **Use lowercase only** - No uppercase letters
2. **Use hyphens for word separation** - No spaces or underscores in main names
3. **Use underscores for type separation** - Only in generated assets
4. **Be descriptive but concise** - Clear but not overly long
5. **Use kebab-case for multi-word names** - team-name, not teamname or team_name
6. **Include timestamps for generated files** - Ensures uniqueness
7. **Use consistent abbreviations** - front/back, not fwd/back

## Examples by Category

### T-Shirt Assets
- ✅ `black-male-front.png`
- ✅ `white-female-back.png`
- ❌ `Black Male Front.png` (uppercase, spaces)
- ❌ `black_male_front.png` (underscores instead of hyphens)

### Logo Assets
- ✅ `king-cobra-youth-soccer-logo.png`
- ✅ `turbo-turtles-logo-variant-3.png`
- ❌ `King Cobra Youth Soccer Logo.png` (uppercase, spaces)
- ❌ `king_cobra_youth_soccer_logo.png` (underscores instead of hyphens)

### Generated Assets
- ✅ `king-cobra-youth-soccer-logo_clean_1759209620527.png`
- ✅ `turbo-turtles-logo-variant-3_left_chest_1759209620527.png`
- ❌ `king-cobra-youth-soccer-logo-clean-1759209620527.png` (missing underscores)

## Migration Guide

When renaming existing files:

1. **Convert to lowercase**
2. **Replace spaces with hyphens**
3. **Replace underscores with hyphens** (except for type separation)
4. **Add descriptive suffixes** where needed
5. **Update API calls** to use new filenames

## Benefits

- **Consistency**: All files follow the same pattern
- **Sortability**: Files group naturally by type and color
- **Readability**: Easy to understand what each file contains
- **URL Safety**: No special characters that cause issues
- **Scalability**: Easy to add new colors, genders, or variants
