-- Add missing fields to analysis_flows table for imageFlowService compatibility
ALTER TABLE "public"."analysis_flows" 
ADD COLUMN IF NOT EXISTS "original_image_path" text,
ADD COLUMN IF NOT EXISTS "analysis_result" text,
ADD COLUMN IF NOT EXISTS "final_image_path" text,
ADD COLUMN IF NOT EXISTS "final_image_prompt" text;

-- Update the session_id to be optional (remove NOT NULL constraint)
ALTER TABLE "public"."analysis_flows" 
ALTER COLUMN "session_id" DROP NOT NULL;

-- Add default value for session_id
ALTER TABLE "public"."analysis_flows" 
ALTER COLUMN "session_id" SET DEFAULT '';

-- Update existing records to have empty session_id if null
UPDATE "public"."analysis_flows" 
SET "session_id" = '' 
WHERE "session_id" IS NULL;
