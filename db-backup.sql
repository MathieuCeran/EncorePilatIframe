

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






CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT r.name 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    client_role_id UUID;
BEGIN
    -- Récupérer l'ID du rôle client
    SELECT id INTO client_role_id FROM public.roles WHERE name = 'client';
    
    -- Créer le profil
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        NOW(),
        NOW()
    );
    
    -- Assigner le rôle client par défaut
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, client_role_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_hostess"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
   RETURN EXISTS (
       SELECT 1 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = auth.uid()
       AND r.name = 'hostess'
   );
END;
$$;


ALTER FUNCTION "public"."is_hostess"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
    -- Your existing function logic here
    -- Example (adjust to match your actual function):
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."commandes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pack_id" "uuid",
    "montant_total" numeric(10,2) NOT NULL,
    "type_paiement" character varying NOT NULL,
    "statut" character varying DEFAULT 'pending'::character varying,
    "date_commande" timestamp with time zone DEFAULT "now"(),
    "date_paiement" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "commandes_statut_check" CHECK ((("statut")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::"text"[]))),
    CONSTRAINT "commandes_type_paiement_check" CHECK ((("type_paiement")::"text" = ANY ((ARRAY['cash'::character varying, 'cmi_online'::character varying])::"text"[])))
);


ALTER TABLE "public"."commandes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "duration_minutes" integer DEFAULT 60,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "benefits" "text"[]
);


ALTER TABLE "public"."course_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_type_id" "uuid",
    "instructor_id" "uuid",
    "intensity" integer DEFAULT 2,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "max_capacity" integer DEFAULT 10,
    "current_bookings" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    CONSTRAINT "courses_intensity_check" CHECK (("intensity" = ANY (ARRAY[1, 2, 3, 4]))),
    CONSTRAINT "courses_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "last_name" character varying(100),
    "first_name" character varying(100),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instructors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pack_limitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pack_id" "uuid" NOT NULL,
    "course_type_id" "uuid" NOT NULL,
    "max_utilisations" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pack_limitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nom" character varying NOT NULL,
    "description" "text",
    "prix" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type_pack" character varying,
    "duree_validite_jours" integer,
    "nombre_cours_total" integer,
    CONSTRAINT "packs_type_pack_check" CHECK ((("type_pack")::"text" = ANY ((ARRAY['decouverte'::character varying, 'mono_cours'::character varying, 'multi_cours'::character varying])::"text"[])))
);


ALTER TABLE "public"."packs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_code_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid",
    "user_id" "uuid",
    "commande_id" "uuid",
    "discount_applied" numeric(10,2) NOT NULL,
    "used_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."promo_code_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "discount_type" character varying(20) NOT NULL,
    "discount_value" numeric(10,2) NOT NULL,
    "minimum_order_amount" numeric(10,2) DEFAULT 0,
    "maximum_discount_amount" numeric(10,2),
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0,
    "user_usage_limit" integer DEFAULT 1,
    "start_date" timestamp without time zone NOT NULL,
    "end_date" timestamp without time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_discount_type_check" CHECK ((("discount_type")::"text" = ANY ((ARRAY['percentage'::character varying, 'fixed_amount'::character varying])::"text"[])))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "commande_id" "uuid",
    "statut" character varying DEFAULT 'pending_payment'::character varying,
    "presente" boolean DEFAULT false,
    "date_presence" timestamp with time zone,
    "date_annulation" timestamp with time zone,
    "raison_annulation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_pack_purchase_id" "uuid",
    CONSTRAINT "reservations_statut_check" CHECK ((("statut")::"text" = ANY ((ARRAY['pending_payment'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "roles_name_check" CHECK ((("name")::"text" = ANY ((ARRAY['admin'::character varying, 'client'::character varying, 'hostess'::character varying])::"text"[])))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_pack_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pack_id" "uuid" NOT NULL,
    "date_achat" timestamp with time zone DEFAULT "now"(),
    "date_expiration" timestamp with time zone,
    "cours_restants" integer DEFAULT 0 NOT NULL,
    "statut" character varying DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_pack_purchases_statut_check" CHECK ((("statut")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('expired'::character varying)::"text", ('consumed'::character varying)::"text", ('pending'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);


ALTER TABLE "public"."user_pack_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_pack_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_type_id" "uuid" NOT NULL,
    "utilisations_consommees" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_pack_purchase_id" "uuid"
);


ALTER TABLE "public"."user_pack_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."commandes"
    ADD CONSTRAINT "commandes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_types"
    ADD CONSTRAINT "course_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructors"
    ADD CONSTRAINT "instructors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pack_limitations"
    ADD CONSTRAINT "pack_limitations_pack_id_course_type_id_key" UNIQUE ("pack_id", "course_type_id");



ALTER TABLE ONLY "public"."pack_limitations"
    ADD CONSTRAINT "pack_limitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packs"
    ADD CONSTRAINT "packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_pack_purchases"
    ADD CONSTRAINT "user_pack_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_pack_usage"
    ADD CONSTRAINT "user_pack_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_pack_usage"
    ADD CONSTRAINT "user_pack_usage_user_pack_purchase_id_course_type_id_key" UNIQUE ("user_id", "course_type_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_pack_limitations_course_type_id" ON "public"."pack_limitations" USING "btree" ("course_type_id");



CREATE INDEX "idx_pack_limitations_pack_id" ON "public"."pack_limitations" USING "btree" ("pack_id");



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_promo_codes_active" ON "public"."promo_codes" USING "btree" ("is_active", "start_date", "end_date");



CREATE INDEX "idx_promo_codes_code" ON "public"."promo_codes" USING "btree" ("code");



CREATE INDEX "idx_promo_usage_user" ON "public"."promo_code_usage" USING "btree" ("user_id", "promo_code_id");



CREATE INDEX "idx_user_pack_purchases_expiration" ON "public"."user_pack_purchases" USING "btree" ("date_expiration");



CREATE INDEX "idx_user_pack_purchases_statut" ON "public"."user_pack_purchases" USING "btree" ("statut");



CREATE INDEX "idx_user_pack_purchases_user_id" ON "public"."user_pack_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_user_pack_usage_course_type" ON "public"."user_pack_usage" USING "btree" ("course_type_id");



CREATE INDEX "idx_user_pack_usage_purchase_id" ON "public"."user_pack_usage" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_course_types_updated_at" BEFORE UPDATE ON "public"."course_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_courses_updated_at" BEFORE UPDATE ON "public"."courses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_instructors_updated_at" BEFORE UPDATE ON "public"."instructors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."commandes"
    ADD CONSTRAINT "commandes_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id");



ALTER TABLE ONLY "public"."commandes"
    ADD CONSTRAINT "commandes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pack_limitations"
    ADD CONSTRAINT "pack_limitations_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pack_limitations"
    ADD CONSTRAINT "pack_limitations_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "public"."commandes"("id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "public"."commandes"("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_pack_purchase_id_fkey" FOREIGN KEY ("user_pack_purchase_id") REFERENCES "public"."user_pack_purchases"("id");



ALTER TABLE ONLY "public"."user_pack_purchases"
    ADD CONSTRAINT "user_pack_purchases_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id");



ALTER TABLE ONLY "public"."user_pack_purchases"
    ADD CONSTRAINT "user_pack_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_pack_usage"
    ADD CONSTRAINT "user_pack_usage_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_pack_usage"
    ADD CONSTRAINT "user_pack_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_pack_usage"
    ADD CONSTRAINT "user_pack_usage_user_pack_purchase_id_fkey" FOREIGN KEY ("user_pack_purchase_id") REFERENCES "public"."user_pack_purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enregistrement des usages de codes promo" ON "public"."promo_code_usage" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent annuler leurs propres réservations" ON "public"."reservations" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent créer leur propre profil" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Les utilisateurs peuvent créer leurs propres commandes" ON "public"."commandes" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Les utilisateurs peuvent créer leurs propres réservations" ON "public"."reservations" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent modifier leurs propres commandes" ON "public"."commandes" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent modifier leurs propres réservations" ON "public"."reservations" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent voir les codes promo actifs" ON "public"."promo_codes" FOR SELECT USING (("public"."is_admin"() OR (("is_active" = true) AND ("start_date" <= CURRENT_TIMESTAMP) AND ("end_date" >= CURRENT_TIMESTAMP))));



CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent voir leur propre usage de codes promo" ON "public"."promo_code_usage" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent voir leur propre utilisation de packs" ON "public"."user_pack_usage" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_pack_purchases" "upp"
  WHERE (("upp"."id" = "user_pack_usage"."user_id") AND (("upp"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "Les utilisateurs peuvent voir leurs propres achats de packs" ON "public"."user_pack_purchases" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent voir leurs propres attributions de rô" ON "public"."user_roles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent voir leurs propres commandes" ON "public"."commandes" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Les utilisateurs peuvent voir leurs propres réservations" ON "public"."reservations" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Seuls les admins peuvent attribuer des rôles" ON "public"."user_roles" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des achats de packs" ON "public"."user_pack_purchases" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des codes promo" ON "public"."promo_codes" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des cours" ON "public"."courses" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des instructeurs" ON "public"."instructors" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des limitations de packs" ON "public"."pack_limitations" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des packs" ON "public"."packs" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des rôles" ON "public"."roles" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des types de cours" ON "public"."course_types" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent créer des utilisations de packs" ON "public"."user_pack_usage" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des achats de packs" ON "public"."user_pack_purchases" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des codes promo" ON "public"."promo_codes" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des cours" ON "public"."courses" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des instructeurs" ON "public"."instructors" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des limitations de packs" ON "public"."pack_limitations" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des packs" ON "public"."packs" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des rôles" ON "public"."roles" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des types de cours" ON "public"."course_types" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier des utilisations de packs" ON "public"."user_pack_usage" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier les attributions de rôles" ON "public"."user_roles" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent modifier les usages de codes promo" ON "public"."promo_code_usage" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des achats de packs" ON "public"."user_pack_purchases" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des attributions de rôles" ON "public"."user_roles" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des codes promo" ON "public"."promo_codes" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des commandes" ON "public"."commandes" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des cours" ON "public"."courses" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des instructeurs" ON "public"."instructors" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des limitations de packs" ON "public"."pack_limitations" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des packs" ON "public"."packs" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des profils" ON "public"."profiles" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des rôles" ON "public"."roles" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des types de cours" ON "public"."course_types" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer des utilisations de packs" ON "public"."user_pack_usage" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Seuls les admins peuvent supprimer les usages de codes promo" ON "public"."promo_code_usage" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Tout le monde peut voir les cours" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Tout le monde peut voir les instructeurs" ON "public"."instructors" FOR SELECT USING (true);



CREATE POLICY "Tout le monde peut voir les limitations de packs" ON "public"."pack_limitations" FOR SELECT USING (true);



CREATE POLICY "Tout le monde peut voir les packs" ON "public"."packs" FOR SELECT USING (true);



CREATE POLICY "Tout le monde peut voir les rôles" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Tout le monde peut voir les types de cours" ON "public"."course_types" FOR SELECT USING (true);



ALTER TABLE "public"."commandes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pack_limitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_code_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_pack_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_pack_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_hostess"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_hostess"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_hostess"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."commandes" TO "anon";
GRANT ALL ON TABLE "public"."commandes" TO "authenticated";
GRANT ALL ON TABLE "public"."commandes" TO "service_role";



GRANT ALL ON TABLE "public"."course_types" TO "anon";
GRANT ALL ON TABLE "public"."course_types" TO "authenticated";
GRANT ALL ON TABLE "public"."course_types" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."instructors" TO "anon";
GRANT ALL ON TABLE "public"."instructors" TO "authenticated";
GRANT ALL ON TABLE "public"."instructors" TO "service_role";



GRANT ALL ON TABLE "public"."pack_limitations" TO "anon";
GRANT ALL ON TABLE "public"."pack_limitations" TO "authenticated";
GRANT ALL ON TABLE "public"."pack_limitations" TO "service_role";



GRANT ALL ON TABLE "public"."packs" TO "anon";
GRANT ALL ON TABLE "public"."packs" TO "authenticated";
GRANT ALL ON TABLE "public"."packs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promo_code_usage" TO "anon";
GRANT ALL ON TABLE "public"."promo_code_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_code_usage" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_pack_purchases" TO "anon";
GRANT ALL ON TABLE "public"."user_pack_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."user_pack_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."user_pack_usage" TO "anon";
GRANT ALL ON TABLE "public"."user_pack_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."user_pack_usage" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









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






























-- ========================================
-- DONNÉES INITIALES POUR L'ADMIN
-- ========================================

-- Insérer les rôles de base s'ils n'existent pas
INSERT INTO "public"."roles" ("name") VALUES 
('admin'),
('client'),
('hostess')
ON CONFLICT ("name") DO NOTHING;

-- Promouvoir ceran.mete@gmail.com en admin
-- (L'utilisateur doit d'abord s'inscrire sur l'app)
UPDATE "public"."user_roles" 
SET "role_id" = (SELECT "id" FROM "public"."roles" WHERE "name" = 'admin')
WHERE "user_id" = (
    SELECT "id" FROM "public"."profiles" 
    WHERE "email" = 'ceran.mete@gmail.com'
);

-- Vérification : Afficher tous les admins
SELECT 
    p."email",
    p."first_name",
    p."last_name",
    r."name" as "role"
FROM "public"."profiles" p
JOIN "public"."user_roles" ur ON p."id" = ur."user_id"
JOIN "public"."roles" r ON ur."role_id" = r."id"
WHERE r."name" = 'admin';


RESET ALL;
