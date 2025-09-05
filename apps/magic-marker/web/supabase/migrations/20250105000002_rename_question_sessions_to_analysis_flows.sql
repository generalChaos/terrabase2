-- Rename question_sessions table to analysis_flows for clarity
-- This table represents the entire image analysis flow, not just question sessions
ALTER TABLE "public"."question_sessions" RENAME TO "analysis_flows";

-- Rename the foreign key constraint
ALTER TABLE "public"."analysis_flows" DROP CONSTRAINT "question_sessions_image_id_fkey";
ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;

-- Rename the primary key constraint
ALTER TABLE "public"."analysis_flows" DROP CONSTRAINT "question_sessions_pkey";
ALTER TABLE "public"."analysis_flows" ADD CONSTRAINT "analysis_flows_pkey" PRIMARY KEY ("id");

-- Rename indexes
DROP INDEX IF EXISTS "idx_question_sessions_image_id";
DROP INDEX IF EXISTS "idx_question_sessions_session_id";
DROP INDEX IF EXISTS "idx_question_sessions_is_active";
DROP INDEX IF EXISTS "idx_question_sessions_created_at";

CREATE INDEX "idx_analysis_flows_image_id" ON "public"."analysis_flows" USING btree ("image_id");
CREATE INDEX "idx_analysis_flows_session_id" ON "public"."analysis_flows" USING btree ("session_id");
CREATE INDEX "idx_analysis_flows_is_active" ON "public"."analysis_flows" USING btree ("is_active");
CREATE INDEX "idx_analysis_flows_created_at" ON "public"."analysis_flows" USING btree ("created_at");

-- Rename RLS policies
DROP POLICY IF EXISTS "Allow public insert access to question_sessions" ON "public"."analysis_flows";
DROP POLICY IF EXISTS "Allow public read access to question_sessions" ON "public"."analysis_flows";
DROP POLICY IF EXISTS "Allow public update access to question_sessions" ON "public"."analysis_flows";

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

-- Rename trigger
DROP TRIGGER IF EXISTS update_question_sessions_updated_at ON "public"."analysis_flows";
CREATE TRIGGER update_analysis_flows_updated_at 
  BEFORE UPDATE ON "public"."analysis_flows" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update grants
REVOKE ALL ON TABLE "public"."question_sessions" FROM "anon";
REVOKE ALL ON TABLE "public"."question_sessions" FROM "authenticated";
REVOKE ALL ON TABLE "public"."question_sessions" FROM "service_role";

GRANT ALL ON TABLE "public"."analysis_flows" TO "anon";
GRANT ALL ON TABLE "public"."analysis_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_flows" TO "service_role";
