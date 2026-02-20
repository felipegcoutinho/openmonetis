CREATE TABLE IF NOT EXISTS "estabelecimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "estabelecimentos_user_id_idx" ON "estabelecimentos" ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "estabelecimentos_user_id_nome_key" ON "estabelecimentos" ("user_id", "nome");

DO $$ BEGIN
 ALTER TABLE "estabelecimentos" ADD CONSTRAINT "estabelecimentos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
