

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analysis_flows" (
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


ALTER TABLE "public"."analysis_flows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."images" (
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


ALTER TABLE "public"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_definitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "type" character varying NOT NULL,
    "input_schema" "jsonb" NOT NULL,
    "output_schema" "jsonb" NOT NULL,
    "prompt_text" "text" NOT NULL,
    "return_schema" "jsonb" NOT NULL,
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
    CONSTRAINT "prompt_definitions_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['image_analysis'::character varying, 'questions_generation'::character varying, 'conversational_question'::character varying, 'image_prompt_creation'::character varying, 'answer_analysis'::character varying, 'image_generation'::character varying, 'conversation_summary'::character varying, 'artistic_style_analysis'::character varying, 'mood_analysis'::character varying, 'composition_analysis'::character varying])::"text"[])))
);


ALTER TABLE "public"."prompt_definitions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analysis_flows"
    ADD CONSTRAINT "analysis_flows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_definitions"
    ADD CONSTRAINT "prompt_definitions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."prompt_definitions"
    ADD CONSTRAINT "prompt_definitions_pkey" PRIMARY KEY ("id");



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



CREATE OR REPLACE TRIGGER "update_analysis_flows_updated_at" BEFORE UPDATE ON "public"."analysis_flows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_prompt_definitions_updated_at" BEFORE UPDATE ON "public"."prompt_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analysis_flows"
    ADD CONSTRAINT "analysis_flows_final_image_id_fkey" FOREIGN KEY ("final_image_id") REFERENCES "public"."images"("id");



ALTER TABLE ONLY "public"."analysis_flows"
    ADD CONSTRAINT "analysis_flows_original_image_id_fkey" FOREIGN KEY ("original_image_id") REFERENCES "public"."images"("id");



CREATE POLICY "Allow public access to analysis_flows" ON "public"."analysis_flows" USING (true);



CREATE POLICY "Allow public access to images" ON "public"."images" USING (true);



CREATE POLICY "Allow public access to prompt_definitions" ON "public"."prompt_definitions" USING (true);



ALTER TABLE "public"."analysis_flows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_definitions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."analysis_flows" TO "anon";
GRANT ALL ON TABLE "public"."analysis_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_flows" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_definitions" TO "anon";
GRANT ALL ON TABLE "public"."prompt_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_definitions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
