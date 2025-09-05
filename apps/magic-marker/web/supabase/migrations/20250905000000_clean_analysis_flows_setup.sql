-- Clean setup for analysis flows
-- This replaces all the messy back-and-forth migrations with a single clean state

-- Create analysis_flows table (renamed from conversations for clarity)
CREATE TABLE "public"."analysis_flows" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "image_id" text NOT NULL,
  "session_id" text NOT NULL,
  "conversation_state" jsonb NOT NULL DEFAULT '{}',
  "current_question_index" integer NOT NULL DEFAULT 0,
  "total_questions" integer NOT NULL DEFAULT 0,
  "context_data" jsonb NOT NULL DEFAULT '{}',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX "idx_analysis_flows_image_id" ON "public"."analysis_flows" USING btree ("image_id");
CREATE INDEX "idx_analysis_flows_session_id" ON "public"."analysis_flows" USING btree ("session_id");
CREATE INDEX "idx_analysis_flows_is_active" ON "public"."analysis_flows" USING btree ("is_active");
CREATE INDEX "idx_analysis_flows_created_at" ON "public"."analysis_flows" USING btree ("created_at");

-- Add foreign key constraint (if images table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'images' AND table_schema = 'public') THEN
        ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Add primary key
ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_pkey" PRIMARY KEY ("id");

-- Enable RLS
ALTER TABLE "public"."analysis_flows" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public insert access to analysis_flows"
  ON "public"."analysis_flows"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to analysis_flows"
  ON "public"."analysis_flows"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to analysis_flows"
  ON "public"."analysis_flows"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true);

-- Add update trigger
CREATE TRIGGER update_analysis_flows_updated_at 
  BEFORE UPDATE ON "public"."analysis_flows" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE "public"."analysis_flows" TO "anon";
GRANT ALL ON TABLE "public"."analysis_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_flows" TO "service_role";
