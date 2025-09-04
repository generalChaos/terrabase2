
  create table "public"."ai_conversations" (
    "id" uuid not null default gen_random_uuid(),
    "prompt_id" uuid,
    "input_data" jsonb,
    "output_data" jsonb,
    "response_time_ms" integer,
    "tokens_used" integer,
    "model_used" character varying,
    "success" boolean default true,
    "error_message" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."ai_conversations" enable row level security;


  create table "public"."image_processing_steps" (
    "id" uuid not null default gen_random_uuid(),
    "image_id" text not null,
    "step_type" character varying not null,
    "step_order" integer not null,
    "prompt_id" uuid,
    "prompt_content" text,
    "input_data" jsonb,
    "output_data" jsonb,
    "response_time_ms" integer,
    "tokens_used" integer,
    "model_used" character varying,
    "success" boolean default true,
    "error_message" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."image_processing_steps" enable row level security;


  create table "public"."images" (
    "id" text not null,
    "original_image_path" text not null,
    "analysis_result" text not null,
    "questions" text not null,
    "answers" text,
    "final_image_path" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."images" enable row level security;


  create table "public"."prompts" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying not null,
    "content" text not null,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "sort_order" integer default 0
      );


CREATE UNIQUE INDEX ai_conversations_pkey ON public.ai_conversations USING btree (id);

CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations USING btree (created_at);

CREATE INDEX idx_ai_conversations_prompt_id ON public.ai_conversations USING btree (prompt_id);

CREATE INDEX idx_ai_conversations_success ON public.ai_conversations USING btree (success);

CREATE INDEX idx_image_processing_steps_created_at ON public.image_processing_steps USING btree (created_at);

CREATE INDEX idx_image_processing_steps_image_id ON public.image_processing_steps USING btree (image_id);

CREATE INDEX idx_image_processing_steps_step_order ON public.image_processing_steps USING btree (step_order);

CREATE INDEX idx_image_processing_steps_step_type ON public.image_processing_steps USING btree (step_type);

CREATE INDEX idx_image_processing_steps_success ON public.image_processing_steps USING btree (success);

CREATE INDEX idx_images_created_at ON public.images USING btree (created_at);

CREATE INDEX idx_prompts_active ON public.prompts USING btree (active);

CREATE INDEX idx_prompts_name ON public.prompts USING btree (name);

CREATE UNIQUE INDEX image_processing_steps_image_id_step_order_key ON public.image_processing_steps USING btree (image_id, step_order);

CREATE UNIQUE INDEX image_processing_steps_pkey ON public.image_processing_steps USING btree (id);

CREATE UNIQUE INDEX images_pkey ON public.images USING btree (id);

CREATE UNIQUE INDEX prompts_name_key ON public.prompts USING btree (name);

CREATE UNIQUE INDEX prompts_pkey ON public.prompts USING btree (id);

alter table "public"."ai_conversations" add constraint "ai_conversations_pkey" PRIMARY KEY using index "ai_conversations_pkey";

alter table "public"."image_processing_steps" add constraint "image_processing_steps_pkey" PRIMARY KEY using index "image_processing_steps_pkey";

alter table "public"."images" add constraint "images_pkey" PRIMARY KEY using index "images_pkey";

alter table "public"."prompts" add constraint "prompts_pkey" PRIMARY KEY using index "prompts_pkey";

alter table "public"."ai_conversations" add constraint "ai_conversations_prompt_id_fkey" FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE not valid;

alter table "public"."ai_conversations" validate constraint "ai_conversations_prompt_id_fkey";

alter table "public"."image_processing_steps" add constraint "image_processing_steps_image_id_fkey" FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE not valid;

alter table "public"."image_processing_steps" validate constraint "image_processing_steps_image_id_fkey";

alter table "public"."image_processing_steps" add constraint "image_processing_steps_image_id_step_order_key" UNIQUE using index "image_processing_steps_image_id_step_order_key";

alter table "public"."image_processing_steps" add constraint "image_processing_steps_prompt_id_fkey" FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE SET NULL not valid;

alter table "public"."image_processing_steps" validate constraint "image_processing_steps_prompt_id_fkey";

alter table "public"."prompts" add constraint "prompts_name_key" UNIQUE using index "prompts_name_key";

set check_function_bodies = off;

create or replace view "public"."prompt_analytics" as  SELECT p.id AS prompt_id,
    p.name AS prompt_name,
    count(ac.id) AS total_requests,
    count(
        CASE
            WHEN ac.success THEN 1
            ELSE NULL::integer
        END) AS successful_requests,
    (((count(
        CASE
            WHEN ac.success THEN 1
            ELSE NULL::integer
        END))::numeric * 100.0) / (NULLIF(count(ac.id), 0))::numeric) AS success_rate,
    avg(ac.response_time_ms) AS avg_response_time_ms,
    sum(ac.tokens_used) AS total_tokens_used,
    max(ac.created_at) AS last_used,
    min(ac.created_at) AS first_used
   FROM (prompts p
     LEFT JOIN ai_conversations ac ON ((p.id = ac.prompt_id)))
  GROUP BY p.id, p.name;


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."ai_conversations" to "anon";

grant insert on table "public"."ai_conversations" to "anon";

grant references on table "public"."ai_conversations" to "anon";

grant select on table "public"."ai_conversations" to "anon";

grant trigger on table "public"."ai_conversations" to "anon";

grant truncate on table "public"."ai_conversations" to "anon";

grant update on table "public"."ai_conversations" to "anon";

grant delete on table "public"."ai_conversations" to "authenticated";

grant insert on table "public"."ai_conversations" to "authenticated";

grant references on table "public"."ai_conversations" to "authenticated";

grant select on table "public"."ai_conversations" to "authenticated";

grant trigger on table "public"."ai_conversations" to "authenticated";

grant truncate on table "public"."ai_conversations" to "authenticated";

grant update on table "public"."ai_conversations" to "authenticated";

grant delete on table "public"."ai_conversations" to "service_role";

grant insert on table "public"."ai_conversations" to "service_role";

grant references on table "public"."ai_conversations" to "service_role";

grant select on table "public"."ai_conversations" to "service_role";

grant trigger on table "public"."ai_conversations" to "service_role";

grant truncate on table "public"."ai_conversations" to "service_role";

grant update on table "public"."ai_conversations" to "service_role";

grant delete on table "public"."image_processing_steps" to "anon";

grant insert on table "public"."image_processing_steps" to "anon";

grant references on table "public"."image_processing_steps" to "anon";

grant select on table "public"."image_processing_steps" to "anon";

grant trigger on table "public"."image_processing_steps" to "anon";

grant truncate on table "public"."image_processing_steps" to "anon";

grant update on table "public"."image_processing_steps" to "anon";

grant delete on table "public"."image_processing_steps" to "authenticated";

grant insert on table "public"."image_processing_steps" to "authenticated";

grant references on table "public"."image_processing_steps" to "authenticated";

grant select on table "public"."image_processing_steps" to "authenticated";

grant trigger on table "public"."image_processing_steps" to "authenticated";

grant truncate on table "public"."image_processing_steps" to "authenticated";

grant update on table "public"."image_processing_steps" to "authenticated";

grant delete on table "public"."image_processing_steps" to "service_role";

grant insert on table "public"."image_processing_steps" to "service_role";

grant references on table "public"."image_processing_steps" to "service_role";

grant select on table "public"."image_processing_steps" to "service_role";

grant trigger on table "public"."image_processing_steps" to "service_role";

grant truncate on table "public"."image_processing_steps" to "service_role";

grant update on table "public"."image_processing_steps" to "service_role";

grant delete on table "public"."images" to "anon";

grant insert on table "public"."images" to "anon";

grant references on table "public"."images" to "anon";

grant select on table "public"."images" to "anon";

grant trigger on table "public"."images" to "anon";

grant truncate on table "public"."images" to "anon";

grant update on table "public"."images" to "anon";

grant delete on table "public"."images" to "authenticated";

grant insert on table "public"."images" to "authenticated";

grant references on table "public"."images" to "authenticated";

grant select on table "public"."images" to "authenticated";

grant trigger on table "public"."images" to "authenticated";

grant truncate on table "public"."images" to "authenticated";

grant update on table "public"."images" to "authenticated";

grant delete on table "public"."images" to "service_role";

grant insert on table "public"."images" to "service_role";

grant references on table "public"."images" to "service_role";

grant select on table "public"."images" to "service_role";

grant trigger on table "public"."images" to "service_role";

grant truncate on table "public"."images" to "service_role";

grant update on table "public"."images" to "service_role";

grant delete on table "public"."prompts" to "anon";

grant insert on table "public"."prompts" to "anon";

grant references on table "public"."prompts" to "anon";

grant select on table "public"."prompts" to "anon";

grant trigger on table "public"."prompts" to "anon";

grant truncate on table "public"."prompts" to "anon";

grant update on table "public"."prompts" to "anon";

grant delete on table "public"."prompts" to "authenticated";

grant insert on table "public"."prompts" to "authenticated";

grant references on table "public"."prompts" to "authenticated";

grant select on table "public"."prompts" to "authenticated";

grant trigger on table "public"."prompts" to "authenticated";

grant truncate on table "public"."prompts" to "authenticated";

grant update on table "public"."prompts" to "authenticated";

grant delete on table "public"."prompts" to "service_role";

grant insert on table "public"."prompts" to "service_role";

grant references on table "public"."prompts" to "service_role";

grant select on table "public"."prompts" to "service_role";

grant trigger on table "public"."prompts" to "service_role";

grant truncate on table "public"."prompts" to "service_role";

grant update on table "public"."prompts" to "service_role";


  create policy "Allow public insert access to ai_conversations"
  on "public"."ai_conversations"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow public read access to ai_conversations"
  on "public"."ai_conversations"
  as permissive
  for select
  to public
using (true);



  create policy "Allow public insert access to image_processing_steps"
  on "public"."image_processing_steps"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow public read access to image_processing_steps"
  on "public"."image_processing_steps"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all operations on images"
  on "public"."images"
  as permissive
  for all
  to public
using (true);



  create policy "Allow public read access to prompts"
  on "public"."prompts"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


