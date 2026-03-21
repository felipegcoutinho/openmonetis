CREATE TABLE "import_category_mappings" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "description_key" text NOT NULL,
  "category_id" uuid NOT NULL REFERENCES "categorias"("id") ON DELETE CASCADE,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "description_key")
);
