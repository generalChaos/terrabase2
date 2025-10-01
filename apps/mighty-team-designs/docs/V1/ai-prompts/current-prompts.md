# Current AI Prompts - V1 Implementation

## 🎯 **Overview**

This document details the current AI prompts being used in the Mighty Team Designs app, based on the actual implementation in the codebase.

## 🤖 **Question Generation Prompt**

### **Model**: GPT-4o-mini
### **Purpose**: Generate 5 personalized questions for team logo design
### **Location**: `src/lib/services/questionService.ts`

```typescript
const prompt = `Generate 5 personalized, casual questions for team logo design based on the specific team.

TEAM: "${teamName}" (${sport}, ${ageGroup})

PERSONALIZE THE QUESTIONS:
- Make questions specific to this team name and sport
- Include mascot suggestions based on the team name
- Suggest colors that would work well for this team
- Make the language feel natural and conversational
- Each question should feel like it was written specifically for this team

QUESTIONS TO GENERATE:
1. Style question - Ask about the team's vibe/personality with options that fit the sport and age group
2. Colors question - Ask about colors with smart suggestions based on team name
3. Custom colors - Text input for specific color preferences
4. Mascot question - Simple yes/no about using AI's best guess (keep it short and casual)
5. Mascot description - Simple text input for custom mascot ideas (keep it short)

TONE: Casual, parent-friendly, easy to read to kids - KEEP QUESTIONS SHORT AND SIMPLE

AGE-APPROPRIATE STYLING (CRITICAL):
- U6-U8: ONLY playful, cute, friendly, fun options (NO fierce, bold, aggressive)
- U10-U12: Mix of playful and slightly competitive (some bold OK, but keep it kid-friendly)
- U14+: Can include more competitive, bold, fierce options
- ALWAYS prioritize kid-friendly over aggressive for younger ages

AI INFERENCE: 
- Analyze team name for smart mascot suggestions (e.g., "Eagles" → Eagle, "Thunder" → Lightning bolt, "Tigers" → Tiger)
- Suggest colors that work well with the team name and sport
- Make style options appropriate for the age group and sport - YOUNGER = MORE PLAYFUL
- Keep mascot questions concise and natural

Return JSON with personalized questions:
{
  "questions": [
    {"id": "style", "text": "PERSONALIZED_STYLE_QUESTION", "type": "multiple_choice", "options": ["PERSONALIZED_OPTION_1", "PERSONALIZED_OPTION_2", "PERSONALIZED_OPTION_3", "PERSONALIZED_OPTION_4"], "selected": 0, "required": true},
    {"id": "colors", "text": "PERSONALIZED_COLORS_QUESTION", "type": "multiple_choice", "options": ["Use team colors", "Input custom colors"], "selected": 0, "required": true},
    {"id": "custom_colors", "text": "PERSONALIZED_CUSTOM_COLORS_QUESTION", "type": "text", "selected": "", "required": false},
    {"id": "mascot", "text": "PERSONALIZED_MASCOT_QUESTION", "type": "multiple_choice", "options": ["Yes", "No, I'll describe it"], "selected": 0, "required": true},
    {"id": "mascot_description", "text": "PERSONALIZED_MASCOT_DESCRIPTION_QUESTION", "type": "text", "selected": "", "required": false}
  ]
}

IMPORTANT: Replace all PERSONALIZED_* placeholders with actual personalized content based on the team name and sport.

Return JSON only.`;
```

### **Key Features**:
- **Personalization**: Questions are tailored to team name and sport
- **Age-Appropriate**: Different styling options based on age group
- **AI Inference**: Smart suggestions based on team name analysis
- **Parent-Friendly**: Casual, conversational tone
- **JSON Response**: Structured format for easy parsing

## 🎨 **Logo Generation Prompt**

### **Model**: gpt-image-1
### **Purpose**: Generate team logos based on collected parameters
### **Location**: Database table `logo_prompts` (name: 'team_logo_generation')

```typescript
// From PROMPTS_AND_CONTEXT.md
const prompt = `Create a {style} {sport} team logo for "{team}" that includes both a mascot/icon and the team name text.

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

Generate detailed prompt for gpt-image-1.`;
```

### **Key Features**:
- **Text Integration**: Mandatory team name inclusion
- **Print Optimization**: Automatic color conversion for print safety
- **Background Guidelines**: Solid background requirements
- **Scalability**: Works from 1 inch to 12 inches
- **Sport-Specific**: Appropriate elements for each sport
- **Age-Appropriate**: Styling based on age group

### **Enhanced Requirements (Based on King Cobra Analysis)**:
- **Professional Quality**: Vector-style illustration, not painterly or sketchy
- **Clean Edges**: Sharp, consistent line weights throughout
- **Flat Design**: Solid color blocks with minimal cell shading
- **High Contrast**: Clean color separation for print readiness
- **No Artifacts**: Crisp, professional output with no noise
- **Style Consistency**: Uniform approach throughout the entire logo

## 🎨 **Color Optimization System**

### **Location**: `src/lib/services/imageGenerationService.ts`

```typescript
// Color mapping for print optimization
const colorMap: Record<string, string> = {
  // Common color variations to print-safe equivalents
  'blue': 'navy blue',
  'light blue': 'royal blue',
  'dark blue': 'navy blue',
  'bright blue': 'royal blue',
  'sky blue': 'royal blue',
  'red': 'red',
  'bright red': 'red',
  'dark red': 'maroon',
  'green': 'forest green',
  'bright green': 'forest green',
  'lime green': 'forest green',
  'yellow': 'gold',
  'bright yellow': 'gold',
  'orange': 'gold',
  'bright orange': 'gold',
  'purple': 'maroon',
  'violet': 'maroon',
  'pink': 'red',
  'gray': 'silver',
  'grey': 'silver',
  'black': 'black',
  'white': 'white'
};
```

### **Print-Safe Color Palette**:
- **Primary Colors**: Navy blue, royal blue, red, maroon, forest green
- **Accent Colors**: Gold, silver, black, white
- **High Contrast**: Ensures readability on both light and dark backgrounds
- **Grayscale Compatible**: Maintains distinction when printed in black and white

## 📊 **Prompt Performance Metrics**

### **Question Generation**:
- **Model**: GPT-4o-mini
- **Temperature**: 0.7
- **Max Tokens**: 500
- **Response Format**: JSON Object
- **Success Rate**: ~95% (with fallback questions)

### **Logo Generation**:
- **Model**: gpt-image-1
- **Size**: 1024x1024
- **Quality**: Low (for cost optimization)
- **Cost**: ~$0.04 per image
- **Generation Time**: ~2-5 seconds per image

## 🔄 **Prompt Refinement Process**

### **Current Implementation**:
1. **Question Generation**: Personalized based on team name and sport
2. **Color Processing**: Automatic print optimization
3. **Logo Generation**: Database-stored prompt with variable substitution
4. **Error Handling**: Fallback questions and mock logos for testing

### **Quality Control**:
- **Age-Appropriate Styling**: Different options for different age groups
- **Print Optimization**: Automatic color conversion
- **Text Requirements**: Mandatory team name inclusion
- **Background Guidelines**: Solid background requirements

## 🚀 **Implementation Notes**

### **Database Storage**:
- **Question Sets**: Stored in `question_sets` table
- **Logo Prompts**: Stored in `logo_prompts` table
- **Logo Variants**: Stored in `team_logos` table

### **Error Handling**:
- **Fallback Questions**: Generic questions when AI fails
- **Mock Logos**: Placeholder logos for testing
- **Retry Logic**: Automatic retry for failed generations

### **Cost Optimization**:
- **Low Quality**: Using low quality for cost savings
- **Single Variants**: Generating one logo at a time
- **Efficient Prompts**: Optimized prompt length

This implementation provides a robust, cost-effective AI generation system that produces high-quality team logos while maintaining print compatibility and age-appropriate styling!
