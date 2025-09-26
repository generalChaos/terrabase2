-- Remove age group from logo generation prompt
-- Age group should only influence questions and style, not the final image prompt

UPDATE logo_prompts 
SET prompt_text = 'Create a {style} {sport} team logo for {team}.

Style: {style}
Colors: {colors}
Mascot: {mascot}

Requirements:
- High contrast for uniforms
- Single color capable
- Scalable design
- Professional quality
- Sport-specific elements

Generate detailed prompt for gpt-image-1.',
    version = version + 1,
    updated_at = NOW()
WHERE name = 'team_logo_generation' AND active = true;
