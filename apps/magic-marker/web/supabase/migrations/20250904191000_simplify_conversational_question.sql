-- Simplify conversational question prompt to single question + 4 options + done flag
-- Max 20 questions, AI decides when done, always 4 options with "None" as one option

UPDATE prompt_definitions 
SET 
  input_schema = $${
    "type": "object",
    "properties": {
      "analysis": {"type": "string"},
      "previousAnswers": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["analysis", "previousAnswers"]
  }$$,
  
  output_schema = $${
    "type": "object",
    "properties": {
      "question": {"type": "string", "minLength": 10},
      "options": {
        "type": "array", 
        "items": {"type": "string"}, 
        "minItems": 4, 
        "maxItems": 4
      },
      "done": {"type": "boolean"}
    },
    "required": ["question", "options", "done"]
  }$$,
  
  prompt_text = 'You are an AI assistant that generates creative questions for artistic image generation. Based on the image analysis and previous answers, generate exactly 1 question with 4 options to help create a personalized artistic prompt.

Return ONLY JSON with this exact schema:

{
  "question": "What style would you like for your image?",
  "options": ["Realistic", "Cartoon", "Abstract", "None"],
  "done": false
}

Rules:
- Generate exactly 1 question (not an array)
- Each question must have exactly 4 options
- One option must always be "None" for flexibility
- Questions should be about artistic style, mood, composition, colors, lighting, etc.
- Build on previous answers to create a more personalized experience
- Set done: true when you have enough information (max 20 questions)
- No extra keys. No preamble. No markdown. Only JSON.',
  
  return_schema = $${
    "type": "object",
    "properties": {
      "question": {"type": "string"},
      "options": {
        "type": "array", 
        "items": {"type": "string"}, 
        "minItems": 4, 
        "maxItems": 4
      },
      "done": {"type": "boolean"}
    },
    "required": ["question", "options", "done"]
  }$$,
  
  updated_at = NOW()
WHERE name = 'conversational_question';
