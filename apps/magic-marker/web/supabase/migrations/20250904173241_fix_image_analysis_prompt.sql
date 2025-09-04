-- Fix image_analysis prompt to match analyzeImage method expectations
UPDATE prompts 
SET content = 'Analyze this image and return ONLY JSON with this exact schema:

{
  "analysis": "2–3 sentences describing what you see."
}

Rules:
- No extra keys. No preamble. No markdown. Only JSON.'
WHERE name = 'image_analysis';
