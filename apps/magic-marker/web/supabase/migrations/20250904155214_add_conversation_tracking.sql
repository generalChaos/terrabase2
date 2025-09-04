-- Add conversation tracking for conversational question generation
CREATE TABLE "public"."conversations" (
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
CREATE INDEX "idx_conversations_image_id" ON "public"."conversations" USING btree ("image_id");
CREATE INDEX "idx_conversations_session_id" ON "public"."conversations" USING btree ("session_id");
CREATE INDEX "idx_conversations_is_active" ON "public"."conversations" USING btree ("is_active");
CREATE INDEX "idx_conversations_created_at" ON "public"."conversations" USING btree ("created_at");

-- Add unique constraint for active conversations per image
CREATE UNIQUE INDEX "conversations_image_id_active_key" ON "public"."conversations" USING btree ("image_id") WHERE ("is_active" = true);

-- Add foreign key constraint
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;

-- Add primary key
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");

-- Enable RLS
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public insert access to conversations"
  ON "public"."conversations"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to conversations"
  ON "public"."conversations"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to conversations"
  ON "public"."conversations"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true);

-- Add update trigger
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON "public"."conversations" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";
