# Database Relationship Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    team_design_flows                        │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ team_name (VARCHAR)                                         │
│ sport (VARCHAR)                                             │
│ age_group (VARCHAR)                                         │
│ round1_answers (JSONB)                                      │
│ round2_questions (JSONB)                                    │
│ round2_answers (JSONB)                                      │
│ logo_prompt (TEXT)                                          │
│ logo_image_id (UUID, FK → images.id)                       │
│ logo_generated_at (TIMESTAMP)                               │
│ current_step (VARCHAR)                                      │
│ is_active (BOOLEAN)                                         │
│ created_at (TIMESTAMP)                                      │
│ updated_at (TIMESTAMP)                                      │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ 1:1
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                        images                               │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ file_path (TEXT)                                            │
│ file_size (INTEGER)                                         │
│ mime_type (VARCHAR)                                         │
│ storage_bucket (VARCHAR)                                    │
│ created_at (TIMESTAMP)                                      │
│ updated_at (TIMESTAMP)                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     question_sets                           │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ name (VARCHAR)                                              │
│ sport (VARCHAR, nullable)                                   │
│ age_group (VARCHAR, nullable)                               │
│ questions (JSONB)                                           │
│ active (BOOLEAN)                                            │
│ sort_order (INTEGER)                                        │
│ created_at (TIMESTAMP)                                      │
│ updated_at (TIMESTAMP)                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  prompt_definitions                         │
├─────────────────────────────────────────────────────────────┤
│ (Reused from magic-marker)                                  │
│ Contains AI prompts for logo generation                     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. User starts flow
   ↓
2. Create team_design_flows record
   ↓
3. User completes Round 1
   ↓
4. Select question_set based on sport + age_group
   ↓
5. Update team_design_flows with round2_questions
   ↓
6. User completes Round 2
   ↓
7. Generate logo using prompt_definitions
   ↓
8. Store logo in images table
   ↓
9. Update team_design_flows with logo_image_id
```

## Question Set Selection Logic

```
Input: sport="soccer", age_group="U12"

1. Look for exact match:
   SELECT * FROM question_sets 
   WHERE sport = 'soccer' AND age_group = 'U12'

2. If no match, look for sport match:
   SELECT * FROM question_sets 
   WHERE sport = 'soccer' AND age_group IS NULL

3. If no match, look for age match:
   SELECT * FROM question_sets 
   WHERE sport IS NULL AND age_group = 'U12'

4. If no match, use default:
   SELECT * FROM question_sets 
   WHERE sport IS NULL AND age_group IS NULL
```

## JSONB Structure Examples

### round1_answers
```json
{
  "team_name": "Eagles",
  "sport": "soccer",
  "age_group": "U12"
}
```

### round2_questions
```json
[
  {
    "id": "style_question",
    "text": "What best fits your team?",
    "type": "multiple_choice",
    "options": [
      {"value": "fun", "label": "Fun", "selected": true},
      {"value": "serious", "label": "Serious", "selected": false}
    ],
    "required": true
  }
]
```

### round2_answers
```json
[
  {
    "question_id": "style_question",
    "answer": "fun"
  },
  {
    "question_id": "colors_question", 
    "answer": "team_colors"
  },
  {
    "question_id": "mascot_question",
    "answer": "yes"
  }
]
```
