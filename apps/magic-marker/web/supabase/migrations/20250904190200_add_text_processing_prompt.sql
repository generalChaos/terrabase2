-- Add text_processing prompt definition
INSERT INTO prompt_definitions (
  name,
  type,
  input_schema,
  output_schema,
  prompt_text,
  return_schema,
  model,
  response_format,
  max_tokens,
  temperature,
  active
) VALUES (
  'text_processing',
  'text_processing',
  $${
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "Input text to process" },
      "context": { "type": "string", "description": "Additional context" },
      "instructions": { "type": "string", "description": "Specific processing instructions" },
      "format": { "type": "string", "description": "Desired output format hints" }
    },
    "required": ["text"]
  }$$,
  $${
    "type": "object",
    "properties": {
      "result": { "type": "string", "minLength": 1, "description": "Processed text result" },
      "response": { "type": "string", "description": "Optional additional response" }
    },
    "required": ["result"]
  }$$,
  $$You are a helpful text processing assistant. Process the given text according to the instructions and context provided.

Text: {text}
Context: {context}
Instructions: {instructions}
Format: {format}

Provide a helpful response that processes the text according to the given instructions.$$,
  $${
    "type": "object",
    "properties": {
      "result": { "type": "string", "minLength": 1 },
      "response": { "type": "string" }
    },
    "required": ["result"]
  }$$,
  'gpt-4o',
  'json_object',
  1000,
  0.7,
  true
);
