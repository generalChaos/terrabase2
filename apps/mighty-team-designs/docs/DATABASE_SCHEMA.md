# Database Schema Design

## Overview
Database schema for Mighty Team Designs, designed for team logo generation flows with pregenerated questions.

## Core Tables

### `team_design_flows`
Main table tracking each team logo generation session.

```sql
CREATE TABLE team_design_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name VARCHAR NOT NULL,
  sport VARCHAR NOT NULL,
  age_group VARCHAR NOT NULL,
  
  -- Round 1 answers
  round1_answers JSONB NOT NULL DEFAULT '{}',
  
  -- Round 2 questions and answers
  round2_questions JSONB NOT NULL DEFAULT '[]',
  round2_answers JSONB NOT NULL DEFAULT '[]',
  
  -- Generated logo data
  logo_prompt TEXT,
  logo_variants JSONB NOT NULL DEFAULT '[]', -- Array of logo variants
  selected_logo_id UUID REFERENCES team_logos(id),
  logo_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Flow state
  current_step VARCHAR DEFAULT 'round1', -- 'round1', 'round2', 'generating', 'completed', 'failed'
  debug_mode BOOLEAN DEFAULT false, -- Feature flag for detailed state tracking
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `team_logos`
Store generated team logo images and metadata.

```sql
CREATE TABLE team_logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES team_design_flows(id),
  
  -- Image data
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  storage_bucket VARCHAR DEFAULT 'team-logos',
  
  -- Logo metadata
  variant_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  is_selected BOOLEAN DEFAULT false,
  generation_prompt TEXT, -- Specific prompt used for this variant
  
  -- AI generation data
  model_used VARCHAR, -- 'dall-e-3', 'gpt-image-1', etc.
  generation_time_ms INTEGER,
  generation_cost_usd NUMERIC(10,6),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `question_sets`
Store pregenerated question sets for different team types.

```sql
CREATE TABLE question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL, -- 'youth_sports', 'adult_recreational', etc.
  sport VARCHAR, -- 'soccer', 'basketball', etc. (NULL for all sports)
  age_group VARCHAR, -- 'U8', 'U12', 'adult', etc. (NULL for all ages)
  
  -- Question data
  questions JSONB NOT NULL, -- Array of question objects
  
  -- Generation metadata
  is_generated BOOLEAN DEFAULT false, -- True if AI-generated, false if manually created
  generation_prompt TEXT, -- Prompt used to generate questions
  generation_model VARCHAR, -- AI model used for generation
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(sport, age_group, name)
);
```

### `logo_prompts`
Store AI prompts for logo generation, optimized for team logos.

```sql
CREATE TABLE logo_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE, -- 'team_logo_generation', 'logo_variant_generation', etc.
  
  -- Prompt data
  prompt_text TEXT NOT NULL,
  model VARCHAR DEFAULT 'dall-e-3',
  response_format VARCHAR DEFAULT 'b64_json',
  max_tokens INTEGER,
  temperature NUMERIC(2,1) DEFAULT 0.7,
  
  -- Prompt metadata
  description TEXT,
  input_schema JSONB, -- Schema for expected inputs
  output_schema JSONB, -- Schema for expected outputs
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Question Set Data Structure

### Question Object Schema
```json
{
  "id": "style_question",
  "text": "What best fits your team?",
  "type": "multiple_choice",
  "options": [
    {"value": "fun", "label": "Fun", "selected": true},
    {"value": "serious", "label": "Serious", "selected": false},
    {"value": "tough", "label": "Tough", "selected": false},
    {"value": "friendly", "label": "Friendly", "selected": false}
  ],
  "required": true
}
```

### Question Types
- **multiple_choice**: Radio buttons with predefined options
- **text**: Open text input
- **color_picker**: Color selection (future enhancement)

## Sample Question Sets

### Youth Sports (U6-U16)
```json
[
  {
    "id": "style_question",
    "text": "What best fits your team?",
    "type": "multiple_choice",
    "options": [
      {"value": "fun", "label": "Fun", "selected": true},
      {"value": "serious", "label": "Serious", "selected": false},
      {"value": "tough", "label": "Tough", "selected": false},
      {"value": "friendly", "label": "Friendly", "selected": false}
    ],
    "required": true
  },
  {
    "id": "colors_question",
    "text": "What colors work for your team?",
    "type": "multiple_choice",
    "options": [
      {"value": "team_colors", "label": "Team colors", "selected": true},
      {"value": "school_colors", "label": "School colors", "selected": false},
      {"value": "custom", "label": "Custom colors", "selected": false}
    ],
    "required": true
  },
  {
    "id": "mascot_question",
    "text": "Should your logo include a mascot?",
    "type": "multiple_choice",
    "options": [
      {"value": "yes", "label": "Yes", "selected": true},
      {"value": "no", "label": "No", "selected": false},
      {"value": "text_only", "label": "Text only", "selected": false}
    ],
    "required": true
  }
]
```

### Adult Recreational
```json
[
  {
    "id": "style_question",
    "text": "What best fits your team?",
    "type": "multiple_choice",
    "options": [
      {"value": "fun", "label": "Fun", "selected": true},
      {"value": "professional", "label": "Professional", "selected": false},
      {"value": "tough", "label": "Tough", "selected": false},
      {"value": "casual", "label": "Casual", "selected": false}
    ],
    "required": true
  },
  {
    "id": "colors_question",
    "text": "What colors work for your team?",
    "type": "multiple_choice",
    "options": [
      {"value": "team_colors", "label": "Team colors", "selected": true},
      {"value": "custom", "label": "Custom colors", "selected": false},
      {"value": "classic", "label": "Classic colors", "selected": false}
    ],
    "required": true
  },
  {
    "id": "mascot_question",
    "text": "Should your logo include a mascot?",
    "type": "multiple_choice",
    "options": [
      {"value": "yes", "label": "Yes", "selected": true},
      {"value": "no", "label": "No", "selected": false},
      {"value": "text_only", "label": "Text only", "selected": false}
    ],
    "required": true
  }
]
```

## Question Set Selection Logic

### Selection Priority
1. **Exact match**: sport + age_group
2. **Sport match**: sport + NULL age_group
3. **Age match**: NULL sport + age_group
4. **Default**: NULL sport + NULL age_group

### Examples
```
Team: "Eagles", "Soccer", "U12"
→ Look for: sport='soccer' AND age_group='U12'
→ Fallback: sport='soccer' AND age_group IS NULL
→ Fallback: sport IS NULL AND age_group='U12'
→ Default: sport IS NULL AND age_group IS NULL

Team: "Thunder", "Basketball", "Adult"
→ Look for: sport='basketball' AND age_group='adult'
→ Fallback: sport='basketball' AND age_group IS NULL
→ Fallback: sport IS NULL AND age_group='adult'
→ Default: sport IS NULL AND age_group IS NULL
```

## Logo Variants Structure

### logo_variants JSONB Array
```json
[
  {
    "id": "uuid-1",
    "variant_number": 1,
    "is_selected": true,
    "file_path": "team-logos/flow-123/variant-1.png",
    "generation_prompt": "Create a fun soccer logo for Eagles U12 team...",
    "model_used": "dall-e-3",
    "generation_time_ms": 2500,
    "generation_cost_usd": 0.040
  },
  {
    "id": "uuid-2", 
    "variant_number": 2,
    "is_selected": false,
    "file_path": "team-logos/flow-123/variant-2.png",
    "generation_prompt": "Create a serious soccer logo for Eagles U12 team...",
    "model_used": "dall-e-3",
    "generation_time_ms": 2300,
    "generation_cost_usd": 0.040
  }
]
```

## Indexes

```sql
-- Team design flows
CREATE INDEX idx_team_design_flows_current_step ON team_design_flows(current_step);
CREATE INDEX idx_team_design_flows_created_at ON team_design_flows(created_at);
CREATE INDEX idx_team_design_flows_active ON team_design_flows(is_active);
CREATE INDEX idx_team_design_flows_sport_age ON team_design_flows(sport, age_group);

-- Team logos
CREATE INDEX idx_team_logos_flow_id ON team_logos(flow_id);
CREATE INDEX idx_team_logos_selected ON team_logos(is_selected);
CREATE INDEX idx_team_logos_created_at ON team_logos(created_at);

-- Question sets
CREATE INDEX idx_question_sets_sport_age ON question_sets(sport, age_group);
CREATE INDEX idx_question_sets_active ON question_sets(active);
CREATE INDEX idx_question_sets_generated ON question_sets(is_generated);

-- Logo prompts
CREATE INDEX idx_logo_prompts_name ON logo_prompts(name);
CREATE INDEX idx_logo_prompts_active ON logo_prompts(active);
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE team_design_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

-- Public read access for question sets
CREATE POLICY "Question sets are publicly readable" ON question_sets
  FOR SELECT USING (active = true);

-- Public read access for images
CREATE POLICY "Images are publicly readable" ON images
  FOR SELECT USING (true);

-- Public insert access for team design flows
CREATE POLICY "Anyone can create team design flows" ON team_design_flows
  FOR INSERT WITH CHECK (true);

-- Public update access for team design flows
CREATE POLICY "Anyone can update team design flows" ON team_design_flows
  FOR UPDATE USING (true);
```

## Supabase Storage

### Bucket: `team-logos`
- **Public access**: Yes
- **File types**: PNG, JPG, SVG
- **Max file size**: 10MB
- **Path structure**: `{flow_id}/logo.{ext}`

## Migration Strategy

### Phase 1: Core Tables
1. Create `team_design_flows` table
2. Create `images` table
3. Create `question_sets` table
4. Set up RLS policies

### Phase 2: Question Data
1. Insert pregenerated question sets
2. Test question selection logic
3. Validate data structure

### Phase 3: Integration
1. Connect to Supabase Storage
2. Test logo generation flow
3. Add monitoring and logging
