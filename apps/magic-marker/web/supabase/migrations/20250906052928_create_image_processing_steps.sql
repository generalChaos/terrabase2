-- Create image_processing_steps table for tracking processing steps
CREATE TABLE IF NOT EXISTS "public"."image_processing_steps" (
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

-- Add primary key
ALTER TABLE "public"."image_processing_steps" ADD CONSTRAINT "image_processing_steps_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint to analysis_flows
ALTER TABLE "public"."image_processing_steps" 
ADD CONSTRAINT "image_processing_steps_flow_id_fkey" 
FOREIGN KEY ("flow_id") 
REFERENCES "public"."analysis_flows"("id") 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_image_processing_steps_flow_id" ON "public"."image_processing_steps"("flow_id");
CREATE INDEX IF NOT EXISTS "idx_image_processing_steps_step_type" ON "public"."image_processing_steps"("step_type");
CREATE INDEX IF NOT EXISTS "idx_image_processing_steps_created_at" ON "public"."image_processing_steps"("created_at");

-- Enable Row Level Security
ALTER TABLE "public"."image_processing_steps" ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public access to image_processing_steps" ON "public"."image_processing_steps" 
FOR ALL USING (true);

-- Add updated_at trigger
CREATE TRIGGER "update_image_processing_steps_updated_at" 
    BEFORE UPDATE ON "public"."image_processing_steps" 
    FOR EACH ROW 
    EXECUTE FUNCTION "public"."update_updated_at_column"();
