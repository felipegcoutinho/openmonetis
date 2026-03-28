CREATE TABLE "anexos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"chave_arquivo" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anexos_chave_arquivo_unique" UNIQUE("chave_arquivo")
);
--> statement-breakpoint
CREATE TABLE "dashboard_notification_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"notification_key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lancamento_anexos" (
	"lancamento_id" uuid NOT NULL,
	"anexo_id" uuid NOT NULL,
	CONSTRAINT "lancamento_anexos_lancamento_id_anexo_id_pk" PRIMARY KEY("lancamento_id","anexo_id")
);
--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_notification_states" ADD CONSTRAINT "dashboard_notification_states_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamento_anexos" ADD CONSTRAINT "lancamento_anexos_lancamento_id_lancamentos_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."lancamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamento_anexos" ADD CONSTRAINT "lancamento_anexos_anexo_id_anexos_id_fk" FOREIGN KEY ("anexo_id") REFERENCES "public"."anexos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_notification_states_user_id_key_unique" ON "dashboard_notification_states" USING btree ("user_id","notification_key");--> statement-breakpoint
CREATE INDEX "dashboard_notification_states_user_id_archived_idx" ON "dashboard_notification_states" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "lancamento_anexos_anexo_id_idx" ON "lancamento_anexos" USING btree ("anexo_id");--> statement-breakpoint
ALTER TABLE "preferencias_usuario" DROP COLUMN "system_font";--> statement-breakpoint
ALTER TABLE "preferencias_usuario" DROP COLUMN "money_font";