-- Remove unique constraint that limits one active conversation per image
-- This allows multiple conversations per image, treating each as separate
DROP INDEX IF EXISTS "conversations_image_id_active_key";

-- Add a new index for better query performance without the unique constraint
CREATE INDEX "idx_conversations_image_id_active" ON "public"."conversations" USING btree ("image_id", "is_active");
