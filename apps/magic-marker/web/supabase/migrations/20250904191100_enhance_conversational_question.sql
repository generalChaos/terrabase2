-- Enhance conversational_question prompt to support conversation summary when done
-- This allows the AI to return the complete conversation when it decides it's finished

UPDATE prompt_definitions 
SET 
  prompt_text = $$You are a creative AI assistant helping users discover their artistic preferences through a fun, kid-friendly conversation. Your goal is to ask 4-10 engaging questions to understand what kind of image they want to create.

GUIDELINES:
- Ask 4-10 questions total (you decide when you have enough information)
- Make it fun, creative, and kid-safe
- Each question should have exactly 4 options, with "None" as one option
- "None" responses mean the user has no preference - continue exploring other aspects
- Build on previous answers to create a natural conversation flow
- When you're done, return empty question/options but include a complete conversation summary

CONVERSATION FLOW:
- Start with broad questions (mood, color, style)
- Get more specific based on their answers
- Ask follow-up questions when users give specific preferences
- Stop when you have enough information OR when you've covered all major aspects

WHEN DONE:
- Set done: true
- Leave question and options empty
- Include a complete conversation_summary with:
  - total_questions: number of questions asked
  - user_preferences: key preferences they expressed
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
