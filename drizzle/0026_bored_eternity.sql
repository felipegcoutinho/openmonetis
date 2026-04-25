ALTER TABLE "lancamentos" ADD COLUMN "split_group_id" uuid;--> statement-breakpoint
CREATE INDEX "lancamentos_user_id_split_group_id_idx" ON "lancamentos" USING btree ("user_id","split_group_id");