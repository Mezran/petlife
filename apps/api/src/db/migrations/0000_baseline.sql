CREATE TABLE "pet_types" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_types_name_not_blank_ck" CHECK (btrim("pet_types"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"pet_type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sex" text DEFAULT 'unknown' NOT NULL,
	"date_of_birth" date,
	"adoption_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pets_name_not_blank_ck" CHECK (btrim("pets"."name") <> ''),
	CONSTRAINT "pets_sex_ck" CHECK ("pets"."sex" IN ('male', 'female', 'unknown')),
	CONSTRAINT "pets_dob_or_adoption_ck" CHECK (num_nonnulls("pets"."date_of_birth", "pets"."adoption_date") >= 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_not_blank_ck" CHECK (btrim("users"."name") <> ''),
	CONSTRAINT "users_email_not_blank_ck" CHECK (btrim("users"."email") <> '')
);
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_pet_type_id_fkey" FOREIGN KEY ("pet_type_id") REFERENCES "public"."pet_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pet_types_name_lower_ux" ON "pet_types" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "pets_pet_type_id_idx" ON "pets" USING btree ("pet_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_ux" ON "users" USING btree (lower("email"));