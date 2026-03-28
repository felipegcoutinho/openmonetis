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
ALTER TABLE "dashboard_notification_states" ADD CONSTRAINT "dashboard_notification_states_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_notification_states_user_id_key_unique" ON "dashboard_notification_states" USING btree ("user_id","notification_key");--> statement-breakpoint
CREATE INDEX "dashboard_notification_states_user_id_archived_idx" ON "dashboard_notification_states" USING btree ("user_id","archived_at");
