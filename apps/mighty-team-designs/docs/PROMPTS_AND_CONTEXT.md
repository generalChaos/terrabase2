# Prompts and Context Management

## System Prompts

### Question Generation System Prompt (5-Question System)
```
Generate 5 casual, parent-friendly questions for team logo design.

TEAM: "{team_name}" ({sport}, {age_group})

QUESTIONS TO GENERATE:
1. Style question - "What vibe fits your team best?" (Fun & playful, Serious & tough, Friendly & approachable, Professional)
2. Colors question - "What colors should we use?" (Use team colors, Input custom colors)
3. Custom colors - "What colors do you want? (e.g., 'blue and white')" (text input, optional)
4. Mascot question - "What should your mascot be?" (AI suggests top 3-4 guesses based on team name, plus "No mascot" option)
5. Mascot type - "What type of mascot fits your team?" (Animal, Object, Person, Abstract symbol)

TONE: Casual, parent-friendly, easy to read to kids
AI INFERENCE: 
- Analyze team name for smart mascot suggestions (e.g., "Eagles" → Eagle, "Thunder" → Lightning bolt, "Tigers" → Tiger)
- For mascot question, suggest 3-4 specific mascot options based on team name
- If team name is unclear, suggest generic but fun options (e.g., "Warriors" → Knight, Shield, Sword, "Stars" → Star, Comet, Galaxy)
- Always include "No mascot" as the last option

Return JSON with id, text, type, options, selected, required.
JSON only, no extra text.
```

### Logo Generation System Prompt (Enhanced for 5-Question System with Text Optimization)
```
Create a {style} {sport} team logo for "{team}" that includes both a mascot/icon and the team name text.

STYLE: {style}
COLORS: {colors}
CUSTOM COLORS: {custom_colors}
MASCOT: {mascot}
MASCOT TYPE: {mascot_type}

TEXT REQUIREMENTS (CRITICAL):
- MUST include the team name "{team}" prominently in the logo
- Use bold, readable fonts that work at small sizes (uniforms, jerseys)
- Text should be clearly legible when printed on uniforms
- Use high-contrast colors for text (dark text on light background, light text on dark background)
- Text should complement the mascot/icon, not compete with it
- Consider text placement: above, below, or integrated with the mascot
- Use appropriate font weight: bold or semi-bold for team names
- Ensure text is scalable and readable at 1 inch height

SMART PROCESSING:
- Mascot question asks if user wants to use AI's best guess from team name
- If "Yes, use our guess" is selected, infer mascot from team name (e.g., "Eagles" → Eagle, "Thunder" → Lightning bolt)
- If "No, I'll describe it myself" is selected, use the mascot_description input
- For "Use team colors", infer colors from team name (e.g., "Eagles" → blue/white, "Thunder" → yellow/black)
- For "Input custom colors", use the custom_colors input
- If no custom colors provided, use classic sport colors
- AI automatically determines mascot type based on the mascot description

BACKGROUND GUIDELINES:
- Always include a solid background color for the logo (white, light gray, or team color)
- The logo design should be contained within a solid background shape (circle, square, or rounded rectangle)
- Only the area outside the logo background should be transparent
- Avoid creating logos that are just text or shapes floating on transparent background

PRINT OPTIMIZATION (AUTOMATIC):
- Use print-safe colors that work well on both light and dark backgrounds
- Prefer high-contrast color combinations (dark text on light background, light text on dark background)
- Avoid colors that are too light or too dark for printing
- Use standard print colors: navy blue, royal blue, red, maroon, forest green, gold, silver, black, white
- Ensure colors maintain readability when printed in grayscale
- Avoid neon or fluorescent colors that don't print well
- Text must remain readable when printed in single color (black/white)

REQUIREMENTS:
- High contrast for uniforms and jerseys
- Single color capable (text and mascot must work in black/white)
- Scalable design (readable from 1 inch to 12 inches)
- Professional quality suitable for team uniforms
- Sport-specific elements appropriate for {sport}
- Age-appropriate for {age_group}
- SOLID BACKGROUND: Logo must have a solid color background (white, light gray, or team color)
- NO TRANSPARENT BACKGROUNDS: The logo itself should not be transparent
- TRANSPARENT OUTSIDE: Only the area around the logo should be transparent
- TEXT INTEGRATION: Team name must be clearly visible and integrated with the design

Generate detailed prompt for gpt-image-1.
```

## Text Optimization System

### Key Text Requirements
The logo generation prompt has been optimized specifically for text inclusion and readability:

1. **Mandatory Team Name**: Every logo MUST include the team name prominently
2. **Uniform Readability**: Text must be legible when printed on jerseys and uniforms
3. **Scalability**: Text must work from 1 inch (small patches) to 12 inches (large banners)
4. **High Contrast**: Dark text on light backgrounds, light text on dark backgrounds
5. **Single Color Capability**: Text must remain readable when printed in black/white
6. **Font Weight**: Bold or semi-bold fonts for team names
7. **Integration**: Text should complement the mascot, not compete with it

### Text Placement Options
- Above the mascot/icon
- Below the mascot/icon  
- Integrated within the design
- Wrapped around the mascot

### Print Optimization
- Text remains readable in grayscale
- High contrast for uniform printing
- Scalable from small patches to large banners
- Professional quality suitable for team uniforms

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

### Logo Generation Context (5-Question System)
```json
{
  "team_name": "Eagles",
  "sport": "soccer", 
  "age_group": "U12",
  "style": "Fun & playful",
  "colors": "Our team colors",
  "custom_colors": "",
  "mascot": "Yes, definitely!",
  "mascot_type": "Animal (eagle, tiger, bear, etc.)",
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

## 5-Question System Overview

### Question Structure
The new 5-question system provides comprehensive logo design input while maintaining simplicity:

1. **Style Question** - Determines overall design approach
2. **Colors Question** - Basic color preference selection
3. **Custom Colors** - Text input for specific color requests
4. **Mascot Question** - Whether to include a mascot
5. **Mascot Type** - Specific type of mascot if desired

### AI Inference Features
- **Smart Defaults**: AI analyzes team names to suggest appropriate mascots
- **Conflict Resolution**: Handles edge cases like "Orange Flame Throwers"
- **Color Processing**: Intelligently processes custom color inputs
- **Context Awareness**: Considers sport and age group in recommendations

### Benefits
- **More Comprehensive**: Captures essential logo design elements
- **User-Friendly**: Casual, parent-friendly language
- **Flexible**: Supports both guided and custom inputs
- **AI-Powered**: Reduces user burden through smart inference
- **Print-Optimized**: Automatically converts colors to print-safe versions

## Print Optimization System

### Automatic Color Conversion
The system automatically optimizes colors for printing without user intervention:

#### **Color Mapping Examples:**
- `blue` → `navy blue`
- `light blue` → `royal blue`
- `bright green` → `forest green`
- `yellow` → `gold`
- `orange` → `gold`
- `purple` → `maroon`
- `pink` → `red`
- `gray` → `silver`

#### **Print-Safe Color Palette:**
- **Primary Colors**: Navy blue, royal blue, red, maroon, forest green
- **Accent Colors**: Gold, silver, black, white
- **High Contrast**: Ensures readability on both light and dark backgrounds
- **Grayscale Compatible**: Maintains distinction when printed in black and white

#### **Benefits:**
- **Uniform Ready**: Colors work well on team uniforms and apparel
- **Banner Compatible**: High contrast for outdoor banners and signs
- **Professional Quality**: Standard colors used in professional sports
- **Cost Effective**: Reduces printing issues and reprints

## Error Handling Prompts

### Question Generation Fallback
```
Generate 5 generic team logo design questions for any sports team.

Focus on: style, colors, custom colors, mascot presence, mascot type
Format: Multiple choice with 3-4 options, plus text input for colors
Tone: Parent-friendly, simple language
```

### Logo Generation Retry
```
The previous logo generation failed. Try again with a simpler, more focused prompt:

Create a {style} {sport} team logo for {team_name}.

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
