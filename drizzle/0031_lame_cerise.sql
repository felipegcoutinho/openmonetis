CREATE TABLE "anotacao_anexos" (
	"anotacao_id" uuid NOT NULL,
	"anexo_id" uuid NOT NULL,
	CONSTRAINT "anotacao_anexos_anotacao_id_anexo_id_pk" PRIMARY KEY("anotacao_id","anexo_id")
);
--> statement-breakpoint
ALTER TABLE "anotacao_anexos" ADD CONSTRAINT "anotacao_anexos_anotacao_id_anotacoes_id_fk" FOREIGN KEY ("anotacao_id") REFERENCES "public"."anotacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anotacao_anexos" ADD CONSTRAINT "anotacao_anexos_anexo_id_anexos_id_fk" FOREIGN KEY ("anexo_id") REFERENCES "public"."anexos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anotacao_anexos_anexo_id_idx" ON "anotacao_anexos" USING btree ("anexo_id");