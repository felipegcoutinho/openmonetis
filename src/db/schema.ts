import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	primaryKey,
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

// ===================== PASSKEY (WebAuthn) =====================

export const passkey = pgTable("passkey", {
	id: text("id").primaryKey(),
	name: text("name"),
	publicKey: text("publicKey").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	credentialID: text("credentialID").notNull(),
	counter: integer("counter").notNull(),
	deviceType: text("deviceType").notNull(),
	backedUp: boolean("backedUp").notNull(),
	transports: text("transports"),
	aaguid: text("aaguid"),
	createdAt: timestamp("createdAt", {
		mode: "date",
		withTimezone: true,
	}),
});

export const userPreferences = pgTable("preferencias_usuario", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	statementNoteAsColumn: boolean("extrato_note_as_column")
		.notNull()
		.default(false),
	transactionsColumnOrder: jsonb("lancamentos_column_order").$type<
		string[] | null
	>(),
	attachmentMaxSizeMb: integer("attachment_max_size_mb").notNull().default(50),
	dashboardWidgets: jsonb("dashboard_widgets").$type<{
		order: string[];
		hidden: string[];
		myAccountsShowExcluded?: boolean;
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

export const financialAccounts = pgTable(
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

export const categories = pgTable(
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

export const payers = pgTable(
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

export const payerShares = pgTable(
	"compartilhamentos_pagador",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		payerId: uuid("pagador_id")
			.notNull()
			.references(() => payers.id, { onDelete: "cascade" }),
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
		uniquePayerShare: uniqueIndex("compartilhamentos_pagador_unique").on(
			table.payerId,
			table.sharedWithUserId,
		),
	}),
);

export const cards = pgTable(
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
		accountId: uuid("conta_id")
			.notNull()
			.references(() => financialAccounts.id, {
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

export const invoices = pgTable(
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
		cardId: uuid("cartao_id").references(() => cards.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	},
	(table) => ({
		userIdPeriodIdx: index("faturas_user_id_period_idx").on(
			table.userId,
			table.period,
		),
		cardIdPeriodIdx: index("faturas_cartao_id_period_idx").on(
			table.cardId,
			table.period,
		),
		userIdCardIdPeriodUnique: uniqueIndex(
			"faturas_user_id_cartao_id_periodo_key",
		).on(table.userId, table.cardId, table.period),
	}),
);

export const budgets = pgTable(
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
		categoryId: uuid("categoria_id").references(() => categories.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	},
	(table) => ({
		userIdPeriodIdx: index("orcamentos_user_id_period_idx").on(
			table.userId,
			table.period,
		),
		userIdCategoryIdPeriodUnique: uniqueIndex(
			"orcamentos_user_id_categoria_id_periodo_key",
		).on(table.userId, table.categoryId, table.period),
	}),
);

export const notes = pgTable("anotacoes", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	title: text("titulo"),
	description: text("descricao"),
	type: text("tipo").notNull().default("nota"), // "nota" ou "tarefa"
	tasks: text("tasks"), // JSON stringificado com array de tarefas
	archived: boolean("arquivada").notNull().default(false),
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

export const savedInsights = pgTable(
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

export const apiTokens = pgTable(
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

export const inboxItems = pgTable(
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
		transactionId: uuid("lancamento_id").references(() => transactions.id, {
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

export const dashboardNotificationStates = pgTable(
	"dashboard_notification_states",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		notificationKey: text("notification_key").notNull(),
		fingerprint: text("fingerprint").notNull(),
		readAt: timestamp("read_at", {
			mode: "date",
			withTimezone: true,
		}),
		archivedAt: timestamp("archived_at", {
			mode: "date",
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdNotificationKeyUnique: uniqueIndex(
			"dashboard_notification_states_user_id_key_unique",
		).on(table.userId, table.notificationKey),
		userIdArchivedAtIdx: index(
			"dashboard_notification_states_user_id_archived_idx",
		).on(table.userId, table.archivedAt),
	}),
);

export const installmentAnticipations = pgTable(
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
		transactionId: uuid("lancamento_id")
			.notNull()
			.references((): AnyPgColumn => transactions.id, { onDelete: "cascade" }),
		payerId: uuid("pagador_id").references(() => payers.id, {
			onDelete: "cascade",
		}),
		categoryId: uuid("categoria_id").references(() => categories.id, {
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

// ===================== TRANSACTIONS =====================

export const transactions = pgTable(
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
			(): AnyPgColumn => installmentAnticipations.id,
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
		cardId: uuid("cartao_id").references(() => cards.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		accountId: uuid("conta_id").references(() => financialAccounts.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		categoryId: uuid("categoria_id").references(() => categories.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		payerId: uuid("pagador_id").references(() => payers.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
		seriesId: uuid("series_id"),
		transferId: uuid("transfer_id"),
		ofxFitId: text("ofx_fit_id"),
		importBatchId: text("import_batch_id"),
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
		payerIdPeriodIdx: index("lancamentos_pagador_id_period_idx").on(
			table.payerId,
			table.period,
		),
		// Índice composto para o filtro quente do dashboard: userId + payerId + period
		userIdPayerIdPeriodIdx: index(
			"lancamentos_user_id_pagador_id_period_idx",
		).on(table.userId, table.payerId, table.period),
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
		cardIdPeriodIdx: index("lancamentos_cartao_id_period_idx").on(
			table.cardId,
			table.period,
		),
		// Dedup OFX: garante FITID único por usuário
		ofxFitIdUserIdIdx: uniqueIndex("lancamentos_ofx_fit_id_user_id_idx")
			.on(table.userId, table.ofxFitId)
			.where(sql`ofx_fit_id IS NOT NULL`),
	}),
);

export const userRelations = relations(user, ({ many, one }) => ({
	accounts: many(account),
	sessions: many(session),
	notes: many(notes),
	cards: many(cards),
	categories: many(categories),
	financialAccounts: many(financialAccounts),
	invoices: many(invoices),
	transactions: many(transactions),
	budgets: many(budgets),
	payers: many(payers),
	installmentAnticipations: many(installmentAnticipations),
	apiTokens: many(apiTokens),
	inboxItems: many(inboxItems),
	establishmentLogos: many(establishmentLogos),
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

export const financialAccountsRelations = relations(
	financialAccounts,
	({ one, many }) => ({
		user: one(user, {
			fields: [financialAccounts.userId],
			references: [user.id],
		}),
		cards: many(cards),
		transactions: many(transactions),
	}),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	user: one(user, {
		fields: [categories.userId],
		references: [user.id],
	}),
	transactions: many(transactions),
	budgets: many(budgets),
}));

export const payersRelations = relations(payers, ({ one, many }) => ({
	user: one(user, {
		fields: [payers.userId],
		references: [user.id],
	}),
	transactions: many(transactions),
	shares: many(payerShares),
}));

export const payerSharesRelations = relations(payerShares, ({ one }) => ({
	payer: one(payers, {
		fields: [payerShares.payerId],
		references: [payers.id],
	}),
	sharedWithUser: one(user, {
		fields: [payerShares.sharedWithUserId],
		references: [user.id],
	}),
	createdByUser: one(user, {
		fields: [payerShares.createdByUserId],
		references: [user.id],
	}),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
	user: one(user, {
		fields: [cards.userId],
		references: [user.id],
	}),
	financialAccount: one(financialAccounts, {
		fields: [cards.accountId],
		references: [financialAccounts.id],
	}),
	invoices: many(invoices),
	transactions: many(transactions),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
	user: one(user, {
		fields: [invoices.userId],
		references: [user.id],
	}),
	card: one(cards, {
		fields: [invoices.cardId],
		references: [cards.id],
	}),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
	user: one(user, {
		fields: [budgets.userId],
		references: [user.id],
	}),
	category: one(categories, {
		fields: [budgets.categoryId],
		references: [categories.id],
	}),
}));

export const notesRelations = relations(notes, ({ one }) => ({
	user: one(user, {
		fields: [notes.userId],
		references: [user.id],
	}),
}));

export const savedInsightsRelations = relations(savedInsights, ({ one }) => ({
	user: one(user, {
		fields: [savedInsights.userId],
		references: [user.id],
	}),
}));

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
	user: one(user, {
		fields: [apiTokens.userId],
		references: [user.id],
	}),
}));

export const inboxItemsRelations = relations(inboxItems, ({ one }) => ({
	user: one(user, {
		fields: [inboxItems.userId],
		references: [user.id],
	}),
	transaction: one(transactions, {
		fields: [inboxItems.transactionId],
		references: [transactions.id],
	}),
}));

export const transactionsRelations = relations(
	transactions,
	({ one, many }) => ({
		user: one(user, {
			fields: [transactions.userId],
			references: [user.id],
		}),
		card: one(cards, {
			fields: [transactions.cardId],
			references: [cards.id],
		}),
		financialAccount: one(financialAccounts, {
			fields: [transactions.accountId],
			references: [financialAccounts.id],
		}),
		category: one(categories, {
			fields: [transactions.categoryId],
			references: [categories.id],
		}),
		payer: one(payers, {
			fields: [transactions.payerId],
			references: [payers.id],
		}),
		anticipation: one(installmentAnticipations, {
			fields: [transactions.anticipationId],
			references: [installmentAnticipations.id],
		}),
		transactionAttachments: many(transactionAttachments),
	}),
);

export const installmentAnticipationsRelations = relations(
	installmentAnticipations,
	({ one, many }) => ({
		user: one(user, {
			fields: [installmentAnticipations.userId],
			references: [user.id],
		}),
		transaction: one(transactions, {
			fields: [installmentAnticipations.transactionId],
			references: [transactions.id],
		}),
		payer: one(payers, {
			fields: [installmentAnticipations.payerId],
			references: [payers.id],
		}),
		category: one(categories, {
			fields: [installmentAnticipations.categoryId],
			references: [categories.id],
		}),
	}),
);

// ===================== ATTACHMENTS =====================

export const attachments = pgTable("anexos", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	fileKey: text("chave_arquivo").notNull().unique(),
	fileName: text("nome_arquivo").notNull(),
	fileSize: integer("tamanho_bytes").notNull(),
	mimeType: text("mime_type").notNull(),
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const transactionAttachments = pgTable(
	"lancamento_anexos",
	{
		transactionId: uuid("lancamento_id")
			.notNull()
			.references(() => transactions.id, { onDelete: "cascade" }),
		attachmentId: uuid("anexo_id")
			.notNull()
			.references(() => attachments.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.transactionId, table.attachmentId] }),
		attachmentIdIdx: index("lancamento_anexos_anexo_id_idx").on(
			table.attachmentId,
		),
	}),
);

export const importCategoryMappings = pgTable(
	"import_category_mappings",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		descriptionKey: text("description_key").notNull(),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "cascade" }),
		updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.descriptionKey] }),
	}),
);

export const establishmentLogos = pgTable(
	"establishment_logos",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		nameKey: text("name_key").notNull(),
		domain: text("domain").notNull(),
		updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.nameKey] }),
	}),
);

export type EstablishmentLogo = typeof establishmentLogos.$inferSelect;

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type PayerShare = typeof payerShares.$inferSelect;
export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Payer = typeof payers.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type SavedInsight = typeof savedInsights.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InstallmentAnticipation =
	typeof installmentAnticipations.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
export type InboxItem = typeof inboxItems.$inferSelect;
export type NewInboxItem = typeof inboxItems.$inferInsert;
export type ImportCategoryMapping = typeof importCategoryMappings.$inferSelect;

export const attachmentsRelations = relations(attachments, ({ one, many }) => ({
	user: one(user, {
		fields: [attachments.userId],
		references: [user.id],
	}),
	transactionAttachments: many(transactionAttachments),
}));

export const transactionAttachmentsRelations = relations(
	transactionAttachments,
	({ one }) => ({
		transaction: one(transactions, {
			fields: [transactionAttachments.transactionId],
			references: [transactions.id],
		}),
		attachment: one(attachments, {
			fields: [transactionAttachments.attachmentId],
			references: [attachments.id],
		}),
	}),
);

export type Attachment = typeof attachments.$inferSelect;
export type TransactionAttachment = typeof transactionAttachments.$inferSelect;

export const establishmentLogosRelations = relations(
	establishmentLogos,
	({ one }) => ({
		user: one(user, {
			fields: [establishmentLogos.userId],
			references: [user.id],
		}),
	}),
);
