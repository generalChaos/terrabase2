-- Seed initial question sets for common team types

-- Youth Soccer (U8-U16) question set
INSERT INTO question_sets (name, sport, age_group, questions, is_generated, active, sort_order) VALUES (
  'youth_soccer',
  'soccer',
  'U12',
  '[
    {
      "id": "style",
      "text": "What best fits your team?",
      "type": "multiple_choice",
      "options": ["Fun", "Serious", "Tough", "Friendly"],
      "selected": 0,
      "required": true
    },
    {
      "id": "colors",
      "text": "What colors work for your team?",
      "type": "multiple_choice",
      "options": ["Team colors", "School colors", "Custom colors"],
      "selected": 0,
      "required": true
    },
    {
      "id": "mascot",
      "text": "Should your logo include a mascot?",
      "type": "multiple_choice",
      "options": ["Yes", "No", "Text only"],
      "selected": 0,
      "required": true
    }
  ]'::jsonb,
  false,
  true,
  1
);

-- Adult Recreational question set
INSERT INTO question_sets (name, sport, age_group, questions, is_generated, active, sort_order) VALUES (
  'adult_recreational',
  NULL,
  'adult',
  '[
    {
      "id": "style",
      "text": "What best fits your team?",
      "type": "multiple_choice",
      "options": ["Fun", "Professional", "Tough", "Casual"],
      "selected": 0,
      "required": true
    },
    {
      "id": "colors",
      "text": "What colors work for your team?",
      "type": "multiple_choice",
      "options": ["Team colors", "Custom colors", "Classic colors"],
      "selected": 0,
      "required": true
    },
    {
      "id": "mascot",
      "text": "Should your logo include a mascot?",
      "type": "multiple_choice",
      "options": ["Yes", "No", "Text only"],
      "selected": 0,
      "required": true
    }
  ]'::jsonb,
  false,
  true,
  2
);

-- Generic fallback question set
INSERT INTO question_sets (name, sport, age_group, questions, is_generated, active, sort_order) VALUES (
  'generic_fallback',
  NULL,
  NULL,
  '[
    {
      "id": "style",
      "text": "What best fits your team?",
      "type": "multiple_choice",
      "options": ["Fun", "Professional", "Tough", "Friendly"],
      "selected": 0,
      "required": true
    },
    {
      "id": "colors",
      "text": "What colors work for your team?",
      "type": "multiple_choice",
      "options": ["Team colors", "Custom colors", "Classic colors"],
      "selected": 0,
      "required": true
    },
    {
      "id": "mascot",
      "text": "Should your logo include a mascot?",
      "type": "multiple_choice",
      "options": ["Yes", "No", "Text only"],
      "selected": 0,
      "required": true
    }
  ]'::jsonb,
  false,
  true,
  99
);

-- Seed initial logo prompts
INSERT INTO logo_prompts (name, prompt_text, model, description, active, version) VALUES (
  'team_logo_generation',
  'Create a {style} {sport} team logo for {team} ({age}).

Style: {style}
Colors: {colors}
Mascot: {mascot}

Requirements:
- High contrast for uniforms
- Single color capable
- Scalable design
- Age-appropriate
- Professional quality
- Sport-specific elements

Generate detailed prompt for gpt-image-1.',
  'gpt-image-1',
  'Main prompt for generating team logos',
  true,
  1
);

INSERT INTO logo_prompts (name, prompt_text, model, description, active, version) VALUES (
  'question_generation',
  'Generate 3 team logo questions for {team} ({sport}, {age}).

Format: JSON with id, text, options, selected.
Questions: style, colors, mascot.
Options: 3-4 each, first preselected.
Tone: Simple, parent-friendly.

JSON only.',
  'gpt-4o-mini',
  'Prompt for generating question sets',
  true,
  1
);
