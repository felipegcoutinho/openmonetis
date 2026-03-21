ALTER TABLE "lancamentos" ADD COLUMN "ofx_fit_id" text;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD COLUMN "import_batch_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "lancamentos_ofx_fit_id_user_id_idx" ON "lancamentos" USING btree ("user_id","ofx_fit_id") WHERE ofx_fit_id IS NOT NULL;