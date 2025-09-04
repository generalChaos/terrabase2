-- Add initial prompt definitions data
-- Using dollar quoting for clean JSON formatting

INSERT INTO prompt_definitions (name, type, input_schema, output_schema, prompt_text, return_schema, model, response_format) VALUES

-- Image Analysis Prompt
('image_analysis', 'image_analysis',
$${
  "type": "object",
  "properties": {
    "image": {"type": "string"},
    "context": {"type": "string"},
    "analysis_type": {"type": "string", "enum": ["general", "artistic", "technical", "child_drawing"]},
    "focus_areas": {"type": "array", "items": {"type": "string"}},
    "user_instructions": {"type": "string"}
  },
  "required": ["image"]
}$$,
$${
  "type": "object",
  "properties": {
    "analysis": {"type": "string", "minLength": 10},
    "response": {"type": "string"},
    "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
    "identified_elements": {"type": "array", "items": {"type": "string"}},
    "artistic_notes": {"type": "string"},
    "technical_notes": {"type": "string"}
  },
  "required": ["analysis"]
}$$,
'Analyze this image and describe what you see in 2-3 sentences.',
$${
  "type": "object",
  "properties": {
    "analysis": {"type": "string"}
  },
  "required": ["analysis"]
}$$,
'gpt-4o', 'json_object'),

-- Questions Generation Prompt
('questions_generation', 'questions_generation',
$${
  "type": "object",
  "properties": {
    "analysis": {"type": "string"}
  },
  "required": ["analysis"]
}$$,
$${
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string", "minLength": 10},
          "type": {"type": "string", "enum": ["multiple_choice"]},
          "options": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 6},
          "required": {"type": "boolean"}
        },
        "required": ["id", "text", "type", "options", "required"]
      },
      "minItems": 3,
      "maxItems": 15
    },
    "response": {"type": "string"}
  },
  "required": ["questions"]
}$$,
'Based on the image analysis provided, generate exactly 8 creative questions that will help create an artistic image prompt. Return ONLY JSON with this exact schema:

{
  "questions": [
    {
      "id": "unique_id_1",
      "text": "question text",
      "type": "multiple_choice",
      "options": ["option1", "option2", "option3", "option4"],
      "required": true
    }
  ]
}

Rules:
- Generate exactly 8 questions
- Each question must have exactly 4 multiple choice options
- Questions should be about artistic style, mood, composition, colors, etc.
- required is always true
- No extra keys. No preamble. No markdown. Only JSON.',
$${
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string"},
          "type": {"type": "string", "enum": ["multiple_choice"]},
          "options": {"type": "array", "items": {"type": "string"}},
          "required": {"type": "boolean"}
        },
        "required": ["id", "text", "type", "options", "required"]
      }
    }
  },
  "required": ["questions"]
}$$,
'gpt-4o', 'json_object'),

-- Conversational Question Prompt
('conversational_question', 'conversational_question',
$${
  "type": "object",
  "properties": {
    "analysis": {"type": "string"},
    "previousAnswers": {"type": "array", "items": {"type": "string"}},
    "conversationContext": {"type": "object"}
  },
  "required": ["analysis", "previousAnswers", "conversationContext"]
}$$,
$${
  "type": "object",
  "properties": {
    "question": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "text": {"type": "string", "minLength": 10},
        "type": {"type": "string", "enum": ["multiple_choice"]},
        "options": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 6},
        "required": {"type": "boolean"}
      },
      "required": ["id", "text", "type", "options", "required"]
    },
    "context": {
      "type": "object",
      "properties": {
        "reasoning": {"type": "string", "minLength": 10},
        "builds_on": {"type": "string", "minLength": 5},
        "artistic_focus": {"type": "string", "minLength": 5}
      },
      "required": ["reasoning", "builds_on", "artistic_focus"]
    },
    "response": {"type": "string"}
  },
  "required": ["question", "context"]
}$$,
'You are an AI assistant that generates creative questions for artistic image generation. Based on the image analysis and conversation context, generate exactly 1 thoughtful question that builds on previous questions and helps create a more personalized artistic prompt.',
$${
  "type": "object",
  "properties": {
    "question": {
      "type": "object",
      "properties": {
        "text": {"type": "string"},
        "options": {"type": "array", "items": {"type": "string"}},
        "required": {"type": "boolean"}
      },
      "required": ["text", "options", "required"]
    },
    "context": {
      "type": "object",
      "properties": {
        "reasoning": {"type": "string"},
        "builds_on": {"type": "string"},
        "artistic_focus": {"type": "string"}
      },
      "required": ["reasoning", "builds_on", "artistic_focus"]
    }
  },
  "required": ["question", "context"]
}$$,
'gpt-4o', 'json_object'),

-- Image Prompt Creation Prompt
('image_prompt_creation', 'image_prompt_creation',
$${
  "type": "object",
  "properties": {
    "questions": {"type": "array", "items": {"type": "object"}},
    "answers": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["questions", "answers"]
}$$,
$${
  "type": "object",
  "properties": {
    "prompt": {"type": "string", "minLength": 20},
    "response": {"type": "string"}
  },
  "required": ["prompt"]
}$$,
'Based on these questions and answers, create a detailed image generation prompt for DALL-E 3.',
$${
  "type": "object",
  "properties": {
    "prompt": {"type": "string"}
  },
  "required": ["prompt"]
}$$,
'gpt-4o', 'text');
