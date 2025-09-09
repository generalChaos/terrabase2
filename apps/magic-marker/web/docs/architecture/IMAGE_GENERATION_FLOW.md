# Image Generation Flow Architecture

## Overview

This document describes the complete flow for Magic Marker's image analysis and generation system, from image upload to final AI-generated illustration.

## Database Structure

### `images` Table (Image File Data Only)
Stores raw image file information without processing data.

```sql
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `analysis_flows` Table (Flow-Specific Data)
Tracks complete analysis and generation flows for each image.

```sql
CREATE TABLE analysis_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_image_id UUID NOT NULL REFERENCES images(id),
  analysis_result TEXT NOT NULL,
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  final_image_id UUID REFERENCES images(id),
  final_image_prompt TEXT,
  current_step VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `prompt_definitions` Table
Stores AI prompt templates for different processing steps.

```sql
CREATE TABLE prompt_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL,
  prompt_text TEXT NOT NULL,
  model VARCHAR DEFAULT 'gpt-4o',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Complete Flow

### Step 1: Image Upload & Analysis
**Endpoint:** `POST /api/upload`

**Process:**
1. Validate file (type, size)
2. Upload image to Supabase Storage
3. Convert to base64
4. Pull 'image_analysis' prompt definition from database
5. Submit image + prompt to OpenAI for analysis
6. **Create analysis_flows record** with `original_image_id` and `analysis_result`
7. Return analysis result (text only)

**Request:**
```typescript
FormData {
  image: File // The uploaded image file
}
```

**Response:**
```typescript
{
  "success": true,
  "imageAnalysisId": "img_1234567890_abc123",
  "originalImagePath": "https://supabase-url/original.png",
  "analysis": "This is a child's drawing of a magical forest with tall trees, a winding path, and what appears to be a small house in the distance. The drawing uses mostly green and brown colors with some blue sky visible at the top. The style is typical of a child's artwork with simple shapes and enthusiastic, energetic lines."
}
```

### Step 2: Generate Questions
**Endpoint:** `POST /api/images/[id]/questions`

**Process:**
1. Get analysis result from analysis_flows table
2. Pull 'questions_generation' prompt definition from database
3. Submit analysis + prompt to OpenAI for questions
4. **Update analysis_flows record** with `questions`
5. Return questions array

**Request:**
```typescript
{
  "imageAnalysisId": "img_1234567890_abc123"
}
```

**Response:**
```typescript
{
  "success": true,
  "imageAnalysisId": "img_1234567890_abc123",
  "questions": [
    {
      "id": "q_1234567890_1_xyz789",
      "text": "What colors would you like to emphasize?",
      "options": ["Blue and purple", "Green and gold", "Rainbow colors"],
      "required": true
    },
    {
      "id": "q_1234567890_2_abc456",
      "text": "What magical elements should we add?",
      "options": ["Unicorns", "Fairies", "Sparkles", "All of the above"],
      "required": true
    }
  ]
}
```

### Step 3: Generate Final Image
**Endpoint:** `POST /api/images/generate`

**Process:**
1. Get analysis result from analysis_flows table
2. Compile clean Q&A string for AI and object for UI
3. Pull 'image_prompt_generation' prompt definition from database
4. Compose prompt with context (analysis + Q&A + prompt definition)
5. Submit to AI for DALL-E prompt generation
6. **Store `final_image_prompt`** in analysis_flows table
7. Submit generated prompt to DALL-E for image generation
8. Upload generated image to Supabase Storage
9. **Store `final_image_id`** in analysis_flows table
10. Return final image path

**Request:**
```typescript
{
  "imageAnalysisId": "img_1234567890_abc123",
  "answers": [
    { questionId: "q_1234567890_1_xyz789", answer: "Blue and purple" },
    { questionId: "q_1234567890_2_abc456", answer: "All of the above" }
  ],
  "prompt": "Optional custom prompt" // Optional
}
```

**Response:**
```typescript
{
  "success": true,
  "finalImagePath": "https://supabase-url/generated-image.png",
  "imageAnalysis": {
    "id": "img_1234567890_abc123",
    "originalImagePath": "https://supabase-url/original.png",
    "analysis": "This is a child's drawing of a magical forest...",
    "questions": [...],
    "answers": [...],
    "finalImagePath": "https://supabase-url/generated-image.png"
  }
}
```

## Key Design Principles

### 1. Separation of Concerns
- **Images table**: Raw file data only
- **Analysis_flows table**: Processing and flow data
- **Prompt_definitions table**: AI prompt templates

### 2. Flow Integrity
- Each step builds on the previous
- No skipping steps allowed
- New flow for each attempt (preserves history)

### 3. Context-Aware Generation
- Final image generation references both analysis and user answers
- Prompts are composed with full context
- Database stores intermediate results for debugging

### 4. Error Handling
- Prompt generation and image generation are separate steps
- Can retry image generation with same prompt
- Failed steps don't lose previous progress

## Data Flow Summary

```
Upload Image
    ↓
Store in images table + Create analysis_flows record
    ↓
Generate Questions (update analysis_flows)
    ↓
User Answers Questions
    ↓
Generate DALL-E Prompt (store final_image_prompt)
    ↓
Generate Image (store final_image_id)
    ↓
Complete Flow
```

## API Endpoints

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/api/upload` | POST | Upload and analyze image | FormData (image) | Analysis result |
| `/api/images/[id]/questions` | POST | Generate questions | imageAnalysisId | Questions array |
| `/api/images/generate` | POST | Generate final image | imageAnalysisId + answers | Final image path |

## Database Relationships

```
images (1) ←→ (1) analysis_flows (original_image_id)
images (1) ←→ (1) analysis_flows (final_image_id)
prompt_definitions (1) ←→ (N) processing steps
```
