DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "orcamentos"
		WHERE "categoria_id" IS NOT NULL
			AND "periodo" IS NOT NULL
		GROUP BY "user_id", "categoria_id", "periodo"
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION
			'Nao foi possivel criar a unique de orcamentos: existem duplicatas por user_id, categoria_id e periodo.';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "faturas"
		WHERE "cartao_id" IS NOT NULL
			AND "periodo" IS NOT NULL
		GROUP BY "user_id", "cartao_id", "periodo"
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION
			'Nao foi possivel criar a unique de faturas: existem duplicatas por user_id, cartao_id e periodo.';
	END IF;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX "orcamentos_user_id_categoria_id_periodo_key" ON "orcamentos" USING btree ("user_id","categoria_id","periodo");--> statement-breakpoint
CREATE UNIQUE INDEX "faturas_user_id_cartao_id_periodo_key" ON "faturas" USING btree ("user_id","cartao_id","periodo");
