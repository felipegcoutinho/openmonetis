import { relations, sql } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
	updatedAt: timestamp("updatedAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
		mode: "date",
		withTimezone: true,
	}),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
		mode: "date",
		withTimezone: true,
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
	updatedAt: timestamp("updatedAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
	updatedAt: timestamp("updatedAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt", {
		mode: "date",
		withTimezone: true,
	}).notNull(),
	createdAt: timestamp("createdAt", {
		mode: "date",
		withTimezone: true,
	}),
	updatedAt: timestamp("updatedAt", {
		mode: "date",
		withTimezone: true,
	}),
});

export const preferenciasUsuario = pgTable("preferencias_usuario", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	disableMagnetlines: boolean("disable_magnetlines").notNull().default(false),
	systemFont: text("system_font").notNull().default("ai-sans"),
	moneyFont: text("money_font").notNull().default("ai-sans"),
	dashboardWidgets: jsonb("dashboard_widgets").$type<{
		order: string[];
		hidden: string[];
	}>(),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	})
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	})
		.notNull()
		.default(sql`now()`),
});

// ===================== PUBLIC TABLES =====================

export const contas = pgTable(
	"contas",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		name: text("nome").notNull(),
		accountType: text("tipo_conta").notNull(),
		note: text("anotacao"),
		status: text("status").notNull(),
		logo: text("logo").notNull(),
		initialBalance: numeric("saldo_inicial", { precision: 12, scale: 2 })
			.notNull()
			.default("0"),
		excludeFromBalance: boolean("excluir_do_saldo").notNull().default(false),
		excludeInitialBalanceFromIncome: boolean("excluir_saldo_inicial_receitas")
			.notNull()
			.default(false),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdStatusIdx: index("contas_user_id_status_idx").on(
			table.userId,
			table.status,
		),
	}),
);

export const categorias = pgTable(
	"categorias",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		name: text("nome").notNull(),
		type: text("tipo").notNull(),
		icon: text("icone"),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => ({
		userIdTypeIdx: index("categorias_user_id_type_idx").on(
			table.userId,
			table.type,
		),
	}),
);

export const pagadores = pgTable(
	"pagadores",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		name: text("nome").notNull(),
		email: text("email"),
		avatarUrl: text("avatar_url"),
		status: text("status").notNull(),
		note: text("anotacao"),
		role: text("role"),
		isAutoSend: boolean("is_auto_send").notNull().default(false),
		shareCode: text("share_code")
			.notNull()
			.default(sql`substr(encode(gen_random_bytes(24), 'base64'), 1, 24)`),
		lastMailAt: timestamp("last_mail", {
			mode: "date",
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => ({
		uniqueShareCode: uniqueIndex("pagadores_share_code_key").on(
			table.shareCode,
		),
		userIdStatusIdx: index("pagadores_user_id_status_idx").on(
			table.userId,
			table.status,
		),
		userIdRoleIdx: index("pagadores_user_id_role_idx").on(
			table.userId,
			table.role,
		),
	}),
);

export const compartilhamentosPagador = pgTable(
	"compartilhamentos_pagador",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		pagadorId: uuid("pagador_id")
			.notNull()
			.references(() => pagadores.id, { onDelete: "cascade" }),
		sharedWithUserId: text("shared_with_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		permission: text("permission").notNull().default("read"),
		createdByUserId: text("created_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		uniqueCompartilhamentoPagador: uniqueIndex(
			"compartilhamentos_pagador_unique",
		).on(table.pagadorId, table.sharedWithUserId),
	}),
);

export const cartoes = pgTable(
	"cartoes",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		name: text("nome").notNull(),
		closingDay: text("dt_fechamento").notNull(),
		dueDay: text("dt_vencimento").notNull(),
		note: text("anotacao"),
		limit: numeric("limite", { precision: 10, scale: 2 }),
		brand: text("bandeira"),
		logo: text("logo"),
		status: text("status").notNull(),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		contaId: uuid("conta_id")
			.notNull()
			.references(() => contas.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
	},
	(table) => ({
		userIdStatusIdx: index("cartoes_user_id_status_idx").on(
			table.userId,
			table.status,
		),
	}),
);

export const faturas = pgTable(
	"faturas",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		paymentStatus: text("status_pagamento"),
		period: text("periodo"),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		cartaoId: uuid("cartao_id").references(() => cartoes.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	},
	(table) => ({
		userIdPeriodIdx: index("faturas_user_id_period_idx").on(
			table.userId,
			table.period,
		),
		cartaoIdPeriodIdx: index("faturas_cartao_id_period_idx").on(
			table.cartaoId,
			table.period,
		),
	}),
);

export const orcamentos = pgTable(
	"orcamentos",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		amount: numeric("valor", { precision: 10, scale: 2 }).notNull(),
		period: text("periodo").notNull(),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		categoriaId: uuid("categoria_id").references(() => categorias.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	},
	(table) => ({
		userIdPeriodIdx: index("orcamentos_user_id_period_idx").on(
			table.userId,
			table.period,
		),
	}),
);

export const anotacoes = pgTable("anotacoes", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	title: text("titulo"),
	description: text("descricao"),
	type: text("tipo").notNull().default("nota"), // "nota" ou "tarefa"
	tasks: text("tasks"), // JSON stringificado com array de tarefas
	arquivada: boolean("arquivada").notNull().default(false),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const insightsSalvos = pgTable(
	"insights_salvos",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		period: text("period").notNull(),
		modelId: text("model_id").notNull(),
		data: text("data").notNull(), // JSON stringificado com as análises
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userPeriodIdx: uniqueIndex("insights_salvos_user_period_idx").on(
			table.userId,
			table.period,
		),
	}),
);

// ===================== OPENMONETIS COMPANION =====================

export const tokensApi = pgTable(
	"tokens_api",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(), // Ex: "Meu Samsung Galaxy"
		tokenHash: text("token_hash").notNull(), // SHA-256 do token
		tokenPrefix: text("token_prefix").notNull(), // Primeiros 8 chars (display)
		lastUsedAt: timestamp("last_used_at", { mode: "date", withTimezone: true }),
		lastUsedIp: text("last_used_ip"),
		expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
		revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
		createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdIdx: index("tokens_api_user_id_idx").on(table.userId),
		tokenHashIdx: uniqueIndex("tokens_api_token_hash_idx").on(table.tokenHash),
	}),
);

export const preLancamentos = pgTable(
	"pre_lancamentos",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// Informações da fonte
		sourceApp: text("source_app").notNull(), // Ex: "com.nu.production"
		sourceAppName: text("source_app_name"), // Ex: "Nubank"

		// Dados originais da notificação
		originalTitle: text("original_title"),
		originalText: text("original_text").notNull(),
		notificationTimestamp: timestamp("notification_timestamp", {
			mode: "date",
			withTimezone: true,
		}).notNull(),

		// Dados parseados (editáveis pelo usuário antes de processar)
		parsedName: text("parsed_name"), // Nome do estabelecimento
		parsedAmount: numeric("parsed_amount", { precision: 12, scale: 2 }),

		// Status de processamento
		status: text("status").notNull().default("pending"), // pending, processed, discarded

		// Referência ao lançamento criado (se processado)
		lancamentoId: uuid("lancamento_id").references(() => lancamentos.id, {
			onDelete: "set null",
		}),

		// Metadados de processamento
		processedAt: timestamp("processed_at", {
			mode: "date",
			withTimezone: true,
		}),
		discardedAt: timestamp("discarded_at", {
			mode: "date",
			withTimezone: true,
		}),

		// Timestamps
		createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdStatusIdx: index("pre_lancamentos_user_id_status_idx").on(
			table.userId,
			table.status,
		),
		userIdCreatedAtIdx: index("pre_lancamentos_user_id_created_at_idx").on(
			table.userId,
			table.createdAt,
		),
	}),
);

export const antecipacoesParcelas = pgTable(
	"antecipacoes_parcelas",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		seriesId: uuid("series_id").notNull(),
		anticipationPeriod: text("periodo_antecipacao").notNull(),
		anticipationDate: date("data_antecipacao", { mode: "date" }).notNull(),
		anticipatedInstallmentIds: jsonb("parcelas_antecipadas")
			.notNull()
			.$type<string[]>(),
		totalAmount: numeric("valor_total", { precision: 12, scale: 2 }).notNull(),
		installmentCount: smallint("qtde_parcelas").notNull(),
		discount: numeric("desconto", { precision: 12, scale: 2 })
			.notNull()
			.default("0"),
		lancamentoId: uuid("lancamento_id")
			.notNull()
			.references(() => lancamentos.id, { onDelete: "cascade" }),
		pagadorId: uuid("pagador_id").references(() => pagadores.id, {
			onDelete: "cascade",
		}),
		categoriaId: uuid("categoria_id").references(() => categorias.id, {
			onDelete: "cascade",
		}),
		note: text("anotacao"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		seriesIdIdx: index("antecipacoes_parcelas_series_id_idx").on(
			table.seriesId,
		),
		userIdIdx: index("antecipacoes_parcelas_user_id_idx").on(table.userId),
	}),
);

export const lancamentos = pgTable(
	"lancamentos",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		condition: text("condicao").notNull(),
		name: text("nome").notNull(),
		paymentMethod: text("forma_pagamento").notNull(),
		note: text("anotacao"),
		amount: numeric("valor", { precision: 12, scale: 2 }).notNull(),
		purchaseDate: date("data_compra", { mode: "date" }).notNull(),
		transactionType: text("tipo_transacao").notNull(),
		installmentCount: smallint("qtde_parcela"),
		period: text("periodo").notNull(),
		currentInstallment: smallint("parcela_atual"),
		recurrenceCount: integer("qtde_recorrencia"),
		dueDate: date("data_vencimento", { mode: "date" }),
		boletoPaymentDate: date("dt_pagamento_boleto", { mode: "date" }),
		isSettled: boolean("realizado").default(false),
		isDivided: boolean("dividido").default(false),
		isAnticipated: boolean("antecipado").default(false),
		anticipationId: uuid("antecipacao_id").references(
			() => antecipacoesParcelas.id,
			{ onDelete: "set null" },
		),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		cartaoId: uuid("cartao_id").references(() => cartoes.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		contaId: uuid("conta_id").references(() => contas.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		categoriaId: uuid("categoria_id").references(() => categorias.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		pagadorId: uuid("pagador_id").references(() => pagadores.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		seriesId: uuid("series_id"),
		transferId: uuid("transfer_id"),
	},
	(table) => ({
		// Índice composto mais importante: userId + period (usado em quase todas as queries do dashboard)
		userIdPeriodIdx: index("lancamentos_user_id_period_idx").on(
			table.userId,
			table.period,
		),
		// Índice composto userId + period + transactionType (cobre maioria das queries do dashboard)
		userIdPeriodTypeIdx: index("lancamentos_user_id_period_type_idx").on(
			table.userId,
			table.period,
			table.transactionType,
		),
		// Índice para queries por pagador + period (invoice/breakdown queries)
		pagadorIdPeriodIdx: index("lancamentos_pagador_id_period_idx").on(
			table.pagadorId,
			table.period,
		),
		// Índice para queries ordenadas por data de compra
		userIdPurchaseDateIdx: index("lancamentos_user_id_purchase_date_idx").on(
			table.userId,
			table.purchaseDate,
		),
		// Índice para buscar parcelas de uma série
		seriesIdIdx: index("lancamentos_series_id_idx").on(table.seriesId),
		// Índice para buscar transferências relacionadas
		transferIdIdx: index("lancamentos_transfer_id_idx").on(table.transferId),
		// Índice para filtrar por condição (aberto, realizado, cancelado)
		userIdConditionIdx: index("lancamentos_user_id_condition_idx").on(
			table.userId,
			table.condition,
		),
		// Índice para queries de cartão específico
		cartaoIdPeriodIdx: index("lancamentos_cartao_id_period_idx").on(
			table.cartaoId,
			table.period,
		),
	}),
);

export const userRelations = relations(user, ({ many, one }) => ({
	accounts: many(account),
	sessions: many(session),
	anotacoes: many(anotacoes),
	cartoes: many(cartoes),
	categorias: many(categorias),
	contas: many(contas),
	faturas: many(faturas),
	lancamentos: many(lancamentos),
	orcamentos: many(orcamentos),
	pagadores: many(pagadores),
	antecipacoesParcelas: many(antecipacoesParcelas),
	tokensApi: many(tokensApi),
	preLancamentos: many(preLancamentos),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const contasRelations = relations(contas, ({ one, many }) => ({
	user: one(user, {
		fields: [contas.userId],
		references: [user.id],
	}),
	cartoes: many(cartoes),
	lancamentos: many(lancamentos),
}));

export const categoriasRelations = relations(categorias, ({ one, many }) => ({
	user: one(user, {
		fields: [categorias.userId],
		references: [user.id],
	}),
	lancamentos: many(lancamentos),
	orcamentos: many(orcamentos),
}));

export const pagadoresRelations = relations(pagadores, ({ one, many }) => ({
	user: one(user, {
		fields: [pagadores.userId],
		references: [user.id],
	}),
	lancamentos: many(lancamentos),
	compartilhamentos: many(compartilhamentosPagador),
}));

export const compartilhamentosPagadorRelations = relations(
	compartilhamentosPagador,
	({ one }) => ({
		pagador: one(pagadores, {
			fields: [compartilhamentosPagador.pagadorId],
			references: [pagadores.id],
		}),
		sharedWithUser: one(user, {
			fields: [compartilhamentosPagador.sharedWithUserId],
			references: [user.id],
		}),
		createdByUser: one(user, {
			fields: [compartilhamentosPagador.createdByUserId],
			references: [user.id],
		}),
	}),
);

export const cartoesRelations = relations(cartoes, ({ one, many }) => ({
	user: one(user, {
		fields: [cartoes.userId],
		references: [user.id],
	}),
	conta: one(contas, {
		fields: [cartoes.contaId],
		references: [contas.id],
	}),
	faturas: many(faturas),
	lancamentos: many(lancamentos),
}));

export const faturasRelations = relations(faturas, ({ one }) => ({
	user: one(user, {
		fields: [faturas.userId],
		references: [user.id],
	}),
	cartao: one(cartoes, {
		fields: [faturas.cartaoId],
		references: [cartoes.id],
	}),
}));

export const orcamentosRelations = relations(orcamentos, ({ one }) => ({
	user: one(user, {
		fields: [orcamentos.userId],
		references: [user.id],
	}),
	categoria: one(categorias, {
		fields: [orcamentos.categoriaId],
		references: [categorias.id],
	}),
}));

export const anotacoesRelations = relations(anotacoes, ({ one }) => ({
	user: one(user, {
		fields: [anotacoes.userId],
		references: [user.id],
	}),
}));

export const insightsSalvosRelations = relations(insightsSalvos, ({ one }) => ({
	user: one(user, {
		fields: [insightsSalvos.userId],
		references: [user.id],
	}),
}));

export const tokensApiRelations = relations(tokensApi, ({ one }) => ({
	user: one(user, {
		fields: [tokensApi.userId],
		references: [user.id],
	}),
}));

export const preLancamentosRelations = relations(preLancamentos, ({ one }) => ({
	user: one(user, {
		fields: [preLancamentos.userId],
		references: [user.id],
	}),
	lancamento: one(lancamentos, {
		fields: [preLancamentos.lancamentoId],
		references: [lancamentos.id],
	}),
}));

export const lancamentosRelations = relations(lancamentos, ({ one }) => ({
	user: one(user, {
		fields: [lancamentos.userId],
		references: [user.id],
	}),
	cartao: one(cartoes, {
		fields: [lancamentos.cartaoId],
		references: [cartoes.id],
	}),
	conta: one(contas, {
		fields: [lancamentos.contaId],
		references: [contas.id],
	}),
	categoria: one(categorias, {
		fields: [lancamentos.categoriaId],
		references: [categorias.id],
	}),
	pagador: one(pagadores, {
		fields: [lancamentos.pagadorId],
		references: [pagadores.id],
	}),
	anticipation: one(antecipacoesParcelas, {
		fields: [lancamentos.anticipationId],
		references: [antecipacoesParcelas.id],
	}),
}));

export const antecipacoesParcRelations = relations(
	antecipacoesParcelas,
	({ one, many }) => ({
		user: one(user, {
			fields: [antecipacoesParcelas.userId],
			references: [user.id],
		}),
		lancamento: one(lancamentos, {
			fields: [antecipacoesParcelas.lancamentoId],
			references: [lancamentos.id],
		}),
		pagador: one(pagadores, {
			fields: [antecipacoesParcelas.pagadorId],
			references: [pagadores.id],
		}),
		categoria: one(categorias, {
			fields: [antecipacoesParcelas.categoriaId],
			references: [categorias.id],
		}),
	}),
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type PreferenciasUsuario = typeof preferenciasUsuario.$inferSelect;
export type NovasPreferenciasUsuario = typeof preferenciasUsuario.$inferInsert;
export type CompartilhamentoPagador =
	typeof compartilhamentosPagador.$inferSelect;
export type Conta = typeof contas.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type Pagador = typeof pagadores.$inferSelect;
export type Cartao = typeof cartoes.$inferSelect;
export type Fatura = typeof faturas.$inferSelect;
export type Orcamento = typeof orcamentos.$inferSelect;
export type Anotacao = typeof anotacoes.$inferSelect;
export type InsightSalvo = typeof insightsSalvos.$inferSelect;
export type Lancamento = typeof lancamentos.$inferSelect;
export type AntecipacaoParcela = typeof antecipacoesParcelas.$inferSelect;
export type TokenApi = typeof tokensApi.$inferSelect;
export type NovoTokenApi = typeof tokensApi.$inferInsert;
export type PreLancamento = typeof preLancamentos.$inferSelect;
export type NovoPreLancamento = typeof preLancamentos.$inferInsert;
