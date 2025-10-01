-- Remove age group from logo generation prompt
-- Age group should only influence questions and style, not the final image prompt

UPDATE logo_prompts 
SET prompt_text = 'Create a {style} {sport} team logo for "{team}" that includes both a mascot/icon and the team name text.

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
- Mascot question asks if user wants to use AI''s best guess from team name
- If "Yes, use our guess" is selected, infer mascot from team name (e.g., "Eagles" → Eagle, "Thunder" → Lightning bolt)
- If "No, I''ll describe it myself" is selected, use the mascot_description input
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
- Avoid neon or fluorescent colors that don''t print well
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

Generate detailed prompt for gpt-image-1.',
    version = version + 1,
    updated_at = NOW()
WHERE name = 'team_logo_generation' AND active = true;
