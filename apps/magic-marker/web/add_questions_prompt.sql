INSERT INTO prompts (name, content, active, sort_order) VALUES 
(
  'questions_generation',
  'Based on the image analysis provided, generate exactly 8 creative questions that will help create an artistic image prompt. Return ONLY JSON with this exact schema:

{
  "questions": [
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true}
  ]
}

Rules:
- Generate exactly 8 questions
- Each question must have exactly 4 multiple choice options
- Questions should be about artistic style, mood, composition, colors, etc.
- required is always true
- No extra keys. No preamble. No markdown. Only JSON.',
  true,
  15
);
