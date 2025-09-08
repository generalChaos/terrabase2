# Database Schema Documentation

## Overview

Magic Marker uses a comprehensive database schema designed for character drawing analysis and flow tracking. The schema supports the disambiguation strategy with robust data management and AI interaction tracking.

## Core Tables

### `prompt_definitions`

Stores AI prompt configurations with input/output schemas for the disambiguation flow.

```sql
CREATE TABLE prompt_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  prompt_text TEXT NOT NULL,
  model VARCHAR DEFAULT 'gpt-4o' NOT NULL,
  response_format VARCHAR DEFAULT 'json_object' NOT NULL,
  max_tokens INTEGER,
  temperature NUMERIC(2,1),
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Key Fields
- **`name`**: Unique identifier for the prompt (e.g., 'image_analysis')
- **`type`**: Prompt type category (image_analysis, questions_generation, image_generation)
- **`input_schema`**: JSON schema defining required input parameters
- **`output_schema`**: JSON schema for validating AI responses
- **`prompt_text`**: The actual prompt text sent to the AI
- **`model`**: AI model to use (gpt-4o, gpt-5, dall-e-3)
- **`response_format`**: Expected response format (json_object, text)
- **`temperature`**: AI creativity level (0.0-2.0)
- **`active`**: Whether the prompt is currently active
- **`sort_order`**: Order for prompt execution

#### Constraints
- **`response_format_check`**: Must be 'json_object' or 'text'
- **`temperature_check`**: Must be between 0.0 and 2.0
- **`type_check`**: Must be one of the defined prompt types

### `images`

Stores all image data including character drawings and generated illustrations.

```sql
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_result TEXT NOT NULL,
  image_type VARCHAR NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Key Fields
- **`analysis_result`**: AI analysis of the image (conversational text)
- **`image_type`**: Type of image ('original', 'additional', 'final')
- **`file_path`**: Supabase storage path for the image
- **`file_size`**: Image file size in bytes
- **`mime_type`**: MIME type of the image file

#### Constraints
- **`image_type_check`**: Must be 'original', 'additional', or 'final'

### `analysis_flows`

Tracks complete character analysis sessions from upload to final illustration.

```sql
CREATE TABLE analysis_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  original_image_id UUID NOT NULL,
  additional_image_ids UUID[] DEFAULT '{}',
  final_image_id UUID,
  total_questions INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  current_step VARCHAR,
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  context_data JSONB DEFAULT '{}',
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Key Fields
- **`session_id`**: Unique session identifier for the analysis flow
- **`original_image_id`**: Reference to the uploaded character drawing
- **`additional_image_ids`**: Array of additional images (if any)
- **`final_image_id`**: Reference to the generated illustration
- **`total_questions`**: Number of questions generated
- **`total_answers`**: Number of answers provided
- **`current_step`**: Current step in the analysis flow
- **`questions`**: JSON array of generated questions
- **`answers`**: JSON array of user answers
- **`context_data`**: Context information for AI interactions
- **`total_cost_usd`**: Total cost of AI interactions
- **`total_tokens`**: Total tokens used across all interactions
- **`is_active`**: Whether the flow is currently active

### `image_processing_steps`

Detailed step-by-step processing logs for debugging and analytics.

```sql
CREATE TABLE image_processing_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  step_type VARCHAR NOT NULL,
  step_order INTEGER NOT NULL,
  prompt_id VARCHAR,
  prompt_content TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  response_time_ms INTEGER DEFAULT 0,
  tokens_used INTEGER,
  model_used VARCHAR NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Key Fields
- **`flow_id`**: Reference to the analysis flow
- **`step_type`**: Type of processing step (analysis, questions, generation)
- **`step_order`**: Order of execution within the flow
- **`prompt_id`**: Reference to the prompt definition used
- **`prompt_content`**: Actual prompt text sent to AI
- **`input_data`**: Input data sent to the AI
- **`output_data`**: Output data received from the AI
- **`response_time_ms`**: Response time in milliseconds
- **`tokens_used`**: Number of tokens consumed
- **`model_used`**: AI model used for this step
- **`success`**: Whether the step completed successfully
- **`error_message`**: Error message if step failed

## Prompt Definitions

### `image_analysis`

Analyzes character drawings with conversational, enthusiastic tone.

**Input Schema:**
```json
{
  "type": "object",
  "required": ["image", "prompt"],
  "properties": {
    "image": {"type": "string"},
    "prompt": {"type": "string"}
  }
}
```

**Output Schema:**
```json
{
  "type": "object",
  "required": ["analysis"],
  "properties": {
    "analysis": {"type": "string", "minLength": 10}
  }
}
```

**Model:** `gpt-4o`
**Purpose:** Decode the child's creative vision with enthusiastic understanding

### `questions_generation`

Generates simple, fun disambiguation questions.

**Input Schema:**
```json
{
  "type": "object",
  "required": ["analysis", "prompt"],
  "properties": {
    "analysis": {"type": "string"},
    "prompt": {"type": "string"}
  }
}
```

**Output Schema:**
```json
{
  "type": "object",
  "required": ["questions"],
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "type", "options", "required"],
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string", "minLength": 10},
          "type": {"enum": ["multiple_choice"], "type": "string"},
          "options": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 6,
            "minItems": 2
          },
          "required": {"type": "boolean"}
        }
      },
      "maxItems": 15,
      "minItems": 3
    }
  }
}
```

**Model:** `gpt-5`
**Purpose:** Generate simple, fun questions to clarify ambiguous elements

### `image_generation`

Creates professional character illustrations.

**Input Schema:**
```json
{
  "type": "object",
  "required": ["prompt", "flow_summary"],
  "properties": {
    "prompt": {"type": "string", "minLength": 10},
    "flow_summary": {"type": "object"}
  }
}
```

**Output Schema:**
```json
{
  "type": "object",
  "required": ["image_base64"],
  "properties": {
    "image_base64": {"type": "string"}
  }
}
```

**Model:** `dall-e-3`
**Purpose:** Create professional illustration preserving child's vision

## Context Management

### Context Structure

The `context_data` field in `analysis_flows` uses a simplified structure:

```json
{
  "imageAnalysis": "Results from previous analysis step",
  "previousAnswers": ["User responses to questions"],
  "stepResults": {"Output from each processing step"},
  "conversationHistory": ["Context across interactions"],
  "flow_summary": {"Summary of entire analysis flow for image_generation"}
}
```

### Context Flow

1. **Analysis Step**: `imageAnalysis` populated with conversational analysis
2. **Questions Step**: `previousAnswers` populated with user responses
3. **Generation Step**: `flow_summary` used for image generation context

## Schema Enforcement

### Input Validation

All AI interactions validate input against the `input_schema`:
- Required fields must be present
- Field types must match schema
- String length constraints enforced
- Enum values validated

### Output Validation

All AI responses validate against the `output_schema`:
- Required fields must be present
- Field types must match schema
- Array constraints enforced
- String length constraints enforced

### Type Safety

Full TypeScript integration with database schemas:
- Generated types from database schema
- Compile-time type checking
- Runtime validation with Zod schemas

## Storage Integration

### Supabase Storage

Images are stored in Supabase storage buckets:
- **Bucket**: `images`
- **Public Access**: Enabled
- **File Size Limit**: 10MB
- **Allowed Types**: JPEG, PNG, GIF, WebP

### File Paths

- **Original Images**: `original/{uuid}.{ext}`
- **Generated Images**: `generated/{uuid}.{ext}`
- **Additional Images**: `additional/{uuid}.{ext}`

## Indexes and Performance

### Primary Indexes
- `prompt_definitions_pkey` on `id`
- `images_pkey` on `id`
- `analysis_flows_pkey` on `id`
- `image_processing_steps_pkey` on `id`

### Unique Constraints
- `prompt_definitions_name_key` on `name`

### Foreign Key Constraints
- `analysis_flows_original_image_id_fkey` on `original_image_id`
- `analysis_flows_final_image_id_fkey` on `final_image_id`
- `image_processing_steps_flow_id_fkey` on `flow_id`

## Migration Strategy

### Clean Migration

The current schema uses a single clean migration (`20250906060000_clean_database_setup.sql`) that:
- Drops all existing tables
- Creates new schema with proper constraints
- Inserts production prompt definitions
- Sets up storage buckets and policies

### Future Migrations

For future changes:
1. Create new migration files with timestamp prefix
2. Use `ALTER TABLE` statements for schema changes
3. Update prompt definitions as needed
4. Test migrations on local database first

## Security

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Public access for read operations
- Authenticated access for write operations
- Service role access for admin operations

### Data Privacy

- No personal information stored
- Images stored securely in Supabase
- Analysis data anonymized
- Cost tracking for monitoring only

This schema provides a robust foundation for the Magic Marker disambiguation strategy while maintaining data integrity and performance.
