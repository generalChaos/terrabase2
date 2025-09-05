-- Improve the conversational question prompt to be more strategic and varied
-- This will help the AI ask better questions and know when to stop

UPDATE prompt_definitions 
SET 
  prompt_text = $$You are a creative AI assistant helping users discover their artistic preferences through a fun, kid-friendly conversation. Your goal is to ask 4-10 engaging questions to understand what kind of image they want to create.

CONVERSATION STRATEGY:
- Ask 4-10 questions total (you decide when you have enough information)
- Cover these key areas: mood/feeling, colors, style, lighting, composition, and any specific elements
- Each question should explore a DIFFERENT aspect - don't repeat the same type
- Make it fun, creative, and kid-safe
- Each question should have exactly 4 options, with "None" as one option
- "None" responses mean the user has no preference - continue exploring other aspects

QUESTION TYPES TO COVER:
1. Mood/Feeling (happy, calm, exciting, mysterious, etc.)
2. Color preferences (bright, warm, cool, pastel, vibrant, etc.)
3. Artistic style (realistic, cartoon, abstract, fantasy, etc.)
4. Lighting (bright, soft, dramatic, natural, etc.)
5. Composition (close-up, wide shot, action, peaceful, etc.)
6. Specific elements (animals, nature, people, objects, etc.)

STOPPING CONDITIONS:
- Stop when you've covered 4+ different aspects AND have at least 3 specific preferences
- Stop when you've asked 8+ questions (even if some were "None")
- Stop when you have enough information to create a good image prompt
- Always stop by question 10 (hard limit)

WHEN DONE:
- Set done: true
- Leave question and options empty
- Include a complete conversation_summary with:
  - total_questions: number of questions asked
  - user_preferences: key preferences they expressed (extract from answers)
  - questions_and_answers: complete history of the conversation

Current analysis: {analysis}
Previous answers: {previousAnswers}

Return your response as a JSON object with the following structure:
- question: string (empty when done)
- options: array of exactly 4 strings (empty when done)  
- done: boolean
- response: string (optional)
- conversation_summary: object (only when done)$$,
  
  input_schema = '{
    "type": "object",
    "properties": {
      "analysis": { "type": "string" },
      "previousAnswers": { 
        "type": "array", 
        "items": { "type": "string" } 
      }
    },
    "required": ["analysis", "previousAnswers"]
  }',
  
  output_schema = '{
    "type": "object",
    "properties": {
      "question": { "type": "string" },
      "options": { 
        "type": "array", 
        "items": { "type": "string" },
        "minItems": 4,
        "maxItems": 4
      },
      "done": { "type": "boolean" },
      "response": { "type": "string" },
      "conversation_summary": {
        "type": "object",
        "properties": {
          "total_questions": { "type": "number", "minimum": 1 },
          "user_preferences": { 
            "type": "object",
            "additionalProperties": { "type": "string" }
          },
          "questions_and_answers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "question": { "type": "string" },
                "answer": { "type": "string" }
              },
              "required": ["question", "answer"]
            }
          }
        },
        "required": ["total_questions", "user_preferences", "questions_and_answers"]
      }
    },
    "required": ["question", "options", "done"]
  }',
  
  return_schema = '{
    "type": "object",
    "properties": {
      "question": { "type": "string" },
      "options": { 
        "type": "array", 
        "items": { "type": "string" },
        "minItems": 4,
        "maxItems": 4
      },
      "done": { "type": "boolean" },
      "response": { "type": "string" },
      "conversation_summary": {
        "type": "object",
        "properties": {
          "total_questions": { "type": "number", "minimum": 1 },
          "user_preferences": { 
            "type": "object",
            "additionalProperties": { "type": "string" }
          },
          "questions_and_answers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "question": { "type": "string" },
                "answer": { "type": "string" }
              },
              "required": ["question", "answer"]
            }
          }
        },
        "required": ["total_questions", "user_preferences", "questions_and_answers"]
      }
    },
    "required": ["question", "options", "done"]
  }'
  
WHERE name = 'conversational_question';
