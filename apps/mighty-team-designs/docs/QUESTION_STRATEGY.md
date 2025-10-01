# Question Strategy for Seasonal Teams

## Target Audience: Parent-Run, Seasonal Teams

## Round 1: Basic Info (3 questions)

### 1. Team Name
**Type**: Open text field
**Examples**: "Eagles", "Thunder", "Lightning Bolts", "Wildcats"
**Validation**: Required, 2-20 characters

### 2. Sport/Activity
**Type**: Hybrid dropdown
**Options**:
- Soccer
- Basketball
- Baseball
- Softball
- Football
- Hockey
- Volleyball
- Tennis
- Other: [text field]

### 3. Age Group
**Type**: Dropdown
**Options**:
- U6 (6 and under)
- U8 (8 and under)
- U10 (10 and under)
- U12 (12 and under)
- U14 (14 and under)
- U16 (16 and under)
- U19 (19 and under)
- Adult (18+)
- Mixed Age

## Round 2: Pregenerated Questions (3 questions)

### Question Set Selection Logic
Based on Round 1 answers, select appropriate question set:

```
Youth Sports (U8-U16):
- What best fits your team? (Fun, Serious, Tough, Friendly)
- What colors work for your team? (Team colors, School colors, Custom)
- Should your logo include a mascot? (Yes, No, Text-only)

High School:
- What best fits your team? (Aggressive, Classic, Modern, Energetic)
- What colors work for your team? (School colors, Team colors, Custom)
- Should your logo include a mascot? (Yes, No, Text-only)

Adult Recreational:
- What best fits your team? (Fun, Professional, Tough, Casual)
- What colors work for your team? (Team colors, Custom, Classic)
- Should your logo include a mascot? (Yes, No, Text-only)
```

## Question Design Principles

### 1. Simple Language
- Avoid technical jargon
- Use terms parents/coaches understand
- Clear, direct questions

### 2. Visual Options
- Provide clear visual examples
- Use descriptive words that translate to design
- Avoid abstract concepts

### 3. Quick Decisions
- 3-4 options max per question
- Most likely option preselected
- No "maybe" or "unsure" options

### 4. Practical Focus
- Questions that directly impact logo design
- Avoid unnecessary complexity
- Focus on what matters for uniforms/banners

## Logo Generation Prompts

### Base Prompt Structure
```
Create a professional team logo for [TEAM_NAME] [SPORT] team.
Age group: [AGE_GROUP]
Style: [STYLE_CHOICE]
Colors: [COLOR_CHOICE]
Mascot: [MASCOT_CHOICE]

Requirements:
- High contrast for visibility on uniforms
- Works well in single color (for embroidery)
- Scalable from small to large sizes
- Professional appearance
- Appropriate for [AGE_GROUP] level
```

### Style Translations
- **Fun** → Playful, rounded, bright colors
- **Serious** → Professional, clean lines, traditional
- **Tough** → Bold, angular, strong colors
- **Friendly** → Approachable, soft edges, warm colors
- **Aggressive** → Sharp, dynamic, intense colors
- **Classic** → Traditional, timeless, established look
- **Modern** → Contemporary, sleek, minimalist
- **Energetic** → Dynamic, movement, vibrant colors
- **Professional** → Corporate, clean, sophisticated
- **Casual** → Relaxed, informal, approachable

## Success Metrics
- **Completion Rate**: % of users who complete both rounds
- **Generation Success**: % of successful logo generations
- **User Satisfaction**: Feedback on generated logos
- **Time to Logo**: Average time from start to logo generation
