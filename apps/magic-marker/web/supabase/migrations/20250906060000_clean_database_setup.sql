-- Clean Database Setup Migration
-- This replaces all previous migrations with a single, clean setup
-- Run this after dropping all existing migrations
--
-- Context Structure:
-- - imageAnalysis: Results from previous analysis step
-- - previousAnswers: User responses to questions
-- - stepResults: Output from each processing step
-- - conversationHistory: Context across interactions
-- - flow_summary: Summary of entire analysis flow (for image_generation)
-- (Removed unused artistic preference fields for cleaner image analysis flow)

-- Drop existing tables if they exist (for clean reset)
DROP TABLE IF EXISTS "public"."image_processing_steps" CASCADE;
DROP TABLE IF EXISTS "public"."analysis_flows" CASCADE;
DROP TABLE IF EXISTS "public"."images" CASCADE;
DROP TABLE IF EXISTS "public"."prompt_definitions" CASCADE;

-- Create prompt_definitions table with correct schema
CREATE TABLE "public"."prompt_definitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "type" character varying NOT NULL,
    "input_schema" "jsonb" NOT NULL,
    "output_schema" "jsonb" NOT NULL,
    "prompt_text" "text" NOT NULL,
    "model" character varying DEFAULT 'gpt-4o'::character varying NOT NULL,
    "response_format" character varying DEFAULT 'json_object'::character varying NOT NULL,
    "max_tokens" integer,
    "temperature" numeric(2,1),
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sort_order" integer DEFAULT 0,
    CONSTRAINT "prompt_definitions_response_format_check" CHECK ((("response_format")::"text" = ANY ((ARRAY['json_object'::character varying, 'text'::character varying])::"text"[]))),
    CONSTRAINT "prompt_definitions_temperature_check" CHECK ((("temperature" >= (0)::numeric) AND ("temperature" <= (2)::numeric))),
    CONSTRAINT "prompt_definitions_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['image_analysis'::character varying, 'questions_generation'::character varying, 'image_prompt_creation'::character varying, 'answer_analysis'::character varying, 'image_generation'::character varying, 'conversation_summary'::character varying, 'artistic_style_analysis'::character varying, 'mood_analysis'::character varying, 'composition_analysis'::character varying, 'text_processing'::character varying])::"text"[])))
);

-- Create images table
CREATE TABLE "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_result" "text" NOT NULL,
    "image_type" character varying NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "mime_type" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "images_image_type_check" CHECK ((("image_type")::"text" = ANY ((ARRAY['original'::character varying, 'additional'::character varying, 'final'::character varying])::"text"[])))
);

-- Create analysis_flows table
CREATE TABLE "public"."analysis_flows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "original_image_id" "uuid" NOT NULL,
    "additional_image_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "final_image_id" "uuid",
    "total_questions" integer DEFAULT 0,
    "total_answers" integer DEFAULT 0,
    "current_step" character varying,
    "questions" "jsonb" DEFAULT '[]'::"jsonb",
    "answers" "jsonb" DEFAULT '[]'::"jsonb",
    "context_data" "jsonb" DEFAULT '{}'::"jsonb",
    "total_cost_usd" numeric(10,6) DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Create image_processing_steps table
CREATE TABLE "public"."image_processing_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flow_id" "uuid" NOT NULL,
    "step_type" character varying NOT NULL,
    "step_order" integer NOT NULL,
    "prompt_id" character varying,
    "prompt_content" text,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb",
    "output_data" "jsonb" DEFAULT '{}'::"jsonb",
    "response_time_ms" integer DEFAULT 0,
    "tokens_used" integer,
    "model_used" character varying NOT NULL,
    "success" boolean DEFAULT true,
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Add primary keys
ALTER TABLE "public"."prompt_definitions" ADD CONSTRAINT "prompt_definitions_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."images" ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."image_processing_steps" ADD CONSTRAINT "image_processing_steps_pkey" PRIMARY KEY ("id");

-- Add unique constraints
ALTER TABLE "public"."prompt_definitions" ADD CONSTRAINT "prompt_definitions_name_key" UNIQUE ("name");

-- Add foreign key constraints
ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_final_image_id_fkey" FOREIGN KEY ("final_image_id") REFERENCES "public"."images"("id");
ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_original_image_id_fkey" FOREIGN KEY ("original_image_id") REFERENCES "public"."images"("id");
ALTER TABLE "public"."image_processing_steps" ADD CONSTRAINT "image_processing_steps_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "public"."analysis_flows"("id") ON DELETE CASCADE;

-- Create indexes
CREATE INDEX "idx_analysis_flows_answers_gin" ON "public"."analysis_flows" USING "gin" ("answers");
CREATE INDEX "idx_analysis_flows_context_gin" ON "public"."analysis_flows" USING "gin" ("context_data");
CREATE INDEX "idx_analysis_flows_created_at" ON "public"."analysis_flows" USING "btree" ("created_at");
CREATE INDEX "idx_analysis_flows_current_step" ON "public"."analysis_flows" USING "btree" ("current_step");
CREATE INDEX "idx_analysis_flows_is_active" ON "public"."analysis_flows" USING "btree" ("is_active");
CREATE INDEX "idx_analysis_flows_original_image_id" ON "public"."analysis_flows" USING "btree" ("original_image_id");
CREATE INDEX "idx_analysis_flows_questions_gin" ON "public"."analysis_flows" USING "gin" ("questions");
CREATE INDEX "idx_analysis_flows_session_id" ON "public"."analysis_flows" USING "btree" ("session_id");
CREATE INDEX "idx_images_created_at" ON "public"."images" USING "btree" ("created_at");
CREATE INDEX "idx_images_type" ON "public"."images" USING "btree" ("image_type");
CREATE INDEX "idx_prompt_definitions_active" ON "public"."prompt_definitions" USING "btree" ("active");
CREATE INDEX "idx_prompt_definitions_name" ON "public"."prompt_definitions" USING "btree" ("name");
CREATE INDEX "idx_prompt_definitions_type" ON "public"."prompt_definitions" USING "btree" ("type");
CREATE INDEX "idx_image_processing_steps_flow_id" ON "public"."image_processing_steps"("flow_id");
CREATE INDEX "idx_image_processing_steps_step_type" ON "public"."image_processing_steps"("step_type");
CREATE INDEX "idx_image_processing_steps_created_at" ON "public"."image_processing_steps"("created_at");

-- Create update trigger function
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER "update_analysis_flows_updated_at" BEFORE UPDATE ON "public"."analysis_flows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_prompt_definitions_updated_at" BEFORE UPDATE ON "public"."prompt_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_image_processing_steps_updated_at" BEFORE UPDATE ON "public"."image_processing_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable Row Level Security
ALTER TABLE "public"."analysis_flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prompt_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."image_processing_steps" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public access to analysis_flows" ON "public"."analysis_flows" USING (true);
CREATE POLICY "Allow public access to images" ON "public"."images" USING (true);
CREATE POLICY "Allow public access to prompt_definitions" ON "public"."prompt_definitions" USING (true);
CREATE POLICY "Allow public access to image_processing_steps" ON "public"."image_processing_steps" USING (true);

-- Insert production prompt definitions with correct schemas
INSERT INTO "public"."prompt_definitions" ("name", "type", "input_schema", "output_schema", "prompt_text", "model", "response_format", "max_tokens", "temperature", "active", "sort_order") VALUES
('image_analysis', 'image_analysis', 
 '{"type": "object", "required": ["image", "prompt"], "properties": {"image": {"type": "string"}, "prompt": {"type": "string"}}}',
 '{"type": "object", "required": ["analysis"], "properties": {"analysis": {"type": "string"}}}',
 'You are an AI assistant analyzing a child''s character drawing to understand their creative vision and identify what needs clarification. Your task is to create a conversational analysis that provides clear context for subsequent AI processing.

Analyze the drawing and provide a comprehensive analysis that includes:

1. **Character Type**: Identify what type of character this appears to be (animal, person, fantasy creature, robot, etc.) based on visual elements and composition.

2. **Visual Elements**: Describe all visible shapes, lines, forms, and their relationships. For each element, note its most likely interpretation and confidence level.

3. **Ambiguous Elements**: Clearly identify which parts are unclear and need clarification. Specify what the possible interpretations are for each ambiguous element.

4. **Character Features**: Note any special features, accessories, or distinctive elements that define the character.

5. **Creative Context**: Assess the overall artistic intent, mood, and any creative choices that suggest the child''s vision.

Write this as conversational text that flows naturally and provides clear context for AI processing. Focus on identifying ambiguities and character elements that need clarification through questions.',
 'gpt-4o', 'json_object', 4000, 0.7, true, 10),

('questions_generation', 'questions_generation',
 '{"type": "object", "required": ["analysis", "prompt"], "properties": {"analysis": {"type": "string"}, "prompt": {"type": "string"}}}',
 '{"type": "object", "required": ["questions"], "properties": {"questions": {"type": "array", "items": {"type": "object", "required": ["id", "text", "type", "options", "required"], "properties": {"id": {"type": "string"}, "text": {"type": "string"}, "type": {"enum": ["multiple_choice"], "type": "string"}, "options": {"type": "array", "items": {"type": "string"}, "maxItems": 6, "minItems": 2}, "required": {"type": "boolean"}}}, "maxItems": 15, "minItems": 3}}}',
 'You are a creative assistant helping a child explain their character drawing through fun, engaging questions. Your goal is to make the child feel like a creative director of their own creation.

Your task:
1. Analyze the provided analysis to identify ambiguous parts that need clarification
2. Generate 3-12 kid-friendly questions (max 12 words each) to help clarify these parts
3. Focus on character details, abilities, and the adventure setting
4. Make questions enthusiastic and encouraging to build confidence

Question guidelines:
- Use "What did you want..." instead of "What is this..."
- Show appreciation: "I love this detail!" or "This is so creative!"
- Frame as creative opportunities: "What did you want this amazing part to be?"
- Make them feel like the expert: "What do you think would look best?"
- Provide 2-3 clear, fun answer choices
- Use enthusiastic, encouraging language

Key phrases to use:
- "What did you want this amazing part to be?"
- "I love how you..."
- "This is such a cool character!"
- "What do you think would make it look awesome?"
- "What special powers does your character have?"',
 'gpt-4o', 'json_object', 4000, 0.7, true, 20),

('image_generation', 'image_generation',
 '{"type": "object", "required": ["prompt", "flow_summary"], "properties": {"prompt": {"type": "string", "minLength": 10}, "flow_summary": {"type": "object"}}}',
 NULL,
 'Create a detailed, professional illustration prompt for DALL-E that recreates the child''s original drawing with enhanced details.

IMPORTANT: The generated image should include all the same elements from the original drawing. Focus on enhancing and clarifying what the child already drew rather than adding new elements.

Use the Image Analysis and Previous Step Results provided in the context below to understand the child''s original character and their answers to questions.

Your task:
1. Read the Image Analysis to identify all elements from the original drawing (shapes, features, parts, etc.)
2. Review the Questions and Answers to understand how the child clarified ambiguous elements
3. Create a DALL-E prompt that includes all original elements, enhanced with the child''s clarifications
4. For each original element, describe it professionally while maintaining its original purpose and placement
5. Use the child''s answers to add specific details, colors, and style to the existing elements
6. Focus on the elements that were in the original drawing rather than adding new ones
7. Make it kid-friendly, playful, and true to the child''s original intent and their answers

IMPORTANT: You must return ONLY the DALL-E prompt text as a plain string. Do not wrap it in JSON, do not add quotes, do not add any formatting. Just return the raw prompt text that DALL-E can use directly.',
 'gpt-4o', 'text', 2000, 0.7, true, 40);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies are created by previous migrations

-- Grant permissions
GRANT ALL ON TABLE "public"."analysis_flows" TO "anon";
GRANT ALL ON TABLE "public"."analysis_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_flows" TO "service_role";
GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";
GRANT ALL ON TABLE "public"."prompt_definitions" TO "anon";
GRANT ALL ON TABLE "public"."prompt_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_definitions" TO "service_role";
GRANT ALL ON TABLE "public"."image_processing_steps" TO "anon";
GRANT ALL ON TABLE "public"."image_processing_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."image_processing_steps" TO "service_role";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
