-- Fix images table to make analysis_result nullable
-- Since we're storing analysis results in analysis_flows table, not images table
ALTER TABLE "public"."images" 
ALTER COLUMN "analysis_result" DROP NOT NULL;
