-- Rename conversations table to question_sessions for clarity
-- This table tracks the state of conversational question generation, not actual conversations
ALTER TABLE "public"."conversations" RENAME TO "question_sessions";

-- Rename the foreign key constraint
ALTER TABLE "public"."question_sessions" DROP CONSTRAINT "conversations_image_id_fkey";
ALTER TABLE "public"."question_sessions" ADD CONSTRAINT "question_sessions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;

-- Rename the primary key constraint
ALTER TABLE "public"."question_sessions" DROP CONSTRAINT "conversations_pkey";
ALTER TABLE "public"."question_sessions" ADD CONSTRAINT "question_sessions_pkey" PRIMARY KEY ("id");

-- Rename indexes
DROP INDEX IF EXISTS "idx_conversations_image_id";
DROP INDEX IF EXISTS "idx_conversations_session_id";
DROP INDEX IF EXISTS "idx_conversations_is_active";
DROP INDEX IF EXISTS "idx_conversations_created_at";
DROP INDEX IF EXISTS "conversations_image_id_active_key";

CREATE INDEX "idx_question_sessions_image_id" ON "public"."question_sessions" USING btree ("image_id");
CREATE INDEX "idx_question_sessions_session_id" ON "public"."question_sessions" USING btree ("session_id");
CREATE INDEX "idx_question_sessions_is_active" ON "public"."question_sessions" USING btree ("is_active");
CREATE INDEX "idx_question_sessions_created_at" ON "public"."question_sessions" USING btree ("created_at");

-- Rename RLS policies
DROP POLICY IF EXISTS "Allow public insert access to conversations" ON "public"."question_sessions";
DROP POLICY IF EXISTS "Allow public read access to conversations" ON "public"."question_sessions";
DROP POLICY IF EXISTS "Allow public update access to conversations" ON "public"."question_sessions";

CREATE POLICY "Allow public insert access to question_sessions"
  ON "public"."question_sessions"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to question_sessions"
  ON "public"."question_sessions"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to question_sessions"
  ON "public"."question_sessions"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true);

-- Rename trigger
DROP TRIGGER IF EXISTS update_conversations_updated_at ON "public"."question_sessions";
CREATE TRIGGER update_question_sessions_updated_at 
  BEFORE UPDATE ON "public"."question_sessions" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update grants
REVOKE ALL ON TABLE "public"."conversations" FROM "anon";
REVOKE ALL ON TABLE "public"."conversations" FROM "authenticated";
REVOKE ALL ON TABLE "public"."conversations" FROM "service_role";

GRANT ALL ON TABLE "public"."question_sessions" TO "anon";
GRANT ALL ON TABLE "public"."question_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."question_sessions" TO "service_role";
