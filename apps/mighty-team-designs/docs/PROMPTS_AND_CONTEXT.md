# Prompts and Context Management

## System Prompts

### Question Generation System Prompt (Optimized)
```
Generate 3 team logo questions for {team_name} ({sport}, {age_group}).

Format: JSON with id, text, type, options, required.
Questions: style, colors, mascot.
Options: 3-4 each, first preselected.
Tone: Simple, parent-friendly.

JSON only, no extra text.
```

### Logo Generation System Prompt (Optimized for gpt-image-1)
```
Create a {style_choice} {sport} team logo for {team_name} ({age_group}).

Style: {style_choice}
Colors: {color_choice}
Mascot: {mascot_choice}

Requirements:
- High contrast for uniforms
- Single color capable
- Scalable design
- Age-appropriate
- Professional quality
- Sport-specific elements

Generate detailed prompt for gpt-image-1.
```

## Context Management

### Question Generation Context
```json
{
  "team_name": "Eagles",
  "sport": "soccer",
  "age_group": "U12",
  "context_type": "question_generation"
}
```

### Logo Generation Context
```json
{
  "team_name": "Eagles",
  "sport": "soccer", 
  "age_group": "U12",
  "style_choice": "fun",
  "color_choice": "team_colors",
  "mascot_choice": "yes",
  "context_type": "logo_generation"
}
```

## Prompt Templates

### Question Generation Template
```
Generate 3 team logo design questions for:
- Team: {team_name}
- Sport: {sport}
- Age: {age_group}

Focus on: style, colors, mascot presence
Format: Multiple choice with 3-4 options
Tone: Parent-friendly, simple language
```

### Logo Generation Template
```
Create a {style_choice} {sport} team logo for {team_name} ({age_group}).

Style: {style_choice}
Colors: {color_choice}
Mascot: {mascot_choice}

Requirements:
- High contrast for uniforms
- Single color capable
- Scalable design
- Age-appropriate
- Professional quality
```

## Error Handling Prompts

### Question Generation Fallback
```
Generate 3 generic team logo design questions for any sports team.

Focus on: style, colors, mascot presence
Format: Multiple choice with 3-4 options
Tone: Parent-friendly, simple language
```

### Logo Generation Retry
```
The previous logo generation failed. Try again with a simpler, more focused prompt:

Create a {style_choice} {sport} team logo for {team_name}.

Keep it simple and professional.
```

## Context Storage

### Database Context Fields
- `question_generation_context` - JSONB for question generation
- `logo_generation_context` - JSONB for logo generation
- `prompt_versions` - Track prompt template versions
- `context_metadata` - Additional context information

### Context Validation
- Validate required fields before prompt generation
- Check context completeness
- Handle missing or invalid context gracefully
- Log context issues for debugging
