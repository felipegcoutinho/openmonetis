"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { z } from "zod";
import { lancamentos, pagadores } from "@/db/schema";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { getResendFromEmail } from "@/lib/email/resend";
import {
	fetchPagadorBoletoStats,
	fetchPagadorCardUsage,
	fetchPagadorHistory,
	fetchPagadorMonthlyBreakdown,
} from "@/lib/pagadores/details";
import { displayPeriod } from "@/lib/utils/period";

const inputSchema = z.object({
	pagadorId: z.string().uuid("Pagador inválido."),
	period: z
		.string()
		.regex(/^\d{4}-\d{2}$/, "Período inválido. Informe no formato AAAA-MM."),
});

type ActionResult =
	| { success: true; message: string }
	| { success: false; error: string };

const formatCurrency = (value: number) =>
	value.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
		maximumFractionDigits: 2,
	});

const formatDate = (value: Date | null | undefined) => {
	if (!value) return "—";
	return value.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

// Escapa HTML para prevenir XSS
const escapeHtml = (text: string | null | undefined): string => {
	if (!text) return "";
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};

type LancamentoRow = {
	id: string;
	name: string | null;
	paymentMethod: string | null;
	condition: string | null;
	amount: number;
	transactionType: string | null;
	purchaseDate: Date | null;
};

type BoletoItem = {
	name: string;
	amount: number;
	dueDate: Date | null;
};

type ParceladoItem = {
	name: string;
	totalAmount: number;
	installmentCount: number;
	currentInstallment: number;
	installmentAmount: number;
	purchaseDate: Date | null;
};

type SummaryPayload = {
	pagadorName: string;
	periodLabel: string;
	monthlyBreakdown: Awaited<ReturnType<typeof fetchPagadorMonthlyBreakdown>>;
	historyData: Awaited<ReturnType<typeof fetchPagadorHistory>>;
	cardUsage: Awaited<ReturnType<typeof fetchPagadorCardUsage>>;
	boletoStats: Awaited<ReturnType<typeof fetchPagadorBoletoStats>>;
	boletos: BoletoItem[];
	lancamentos: LancamentoRow[];
	parcelados: ParceladoItem[];
};

const buildSectionHeading = (label: string) =>
	`<h3 style="font-size:16px;margin:24px 0 8px 0;color:#0f172a;">${label}</h3>`;

const buildSummaryHtml = ({
	pagadorName,
	periodLabel,
	monthlyBreakdown,
	historyData,
	cardUsage,
	boletoStats,
	boletos,
	lancamentos,
	parcelados,
}: SummaryPayload) => {
	// Calcular máximo de despesas para barras de progresso
	const maxDespesas = Math.max(...historyData.map((p) => p.despesas), 1);

	const historyRows =
		historyData.length > 0
			? historyData
					.map((point) => {
						const percentage = (point.despesas / maxDespesas) * 100;
						const barColor =
							point.despesas > maxDespesas * 0.8
								? "#ef4444"
								: point.despesas > maxDespesas * 0.5
									? "#f59e0b"
									: "#10b981";

						return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${escapeHtml(
							point.label,
						)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="flex:1;background:#f1f5f9;border-radius:6px;height:24px;overflow:hidden;">
                  <div style="background:${barColor};height:100%;width:${percentage}%;transition:width 0.3s;"></div>
                </div>
                <span style="font-weight:600;min-width:100px;text-align:right;">${formatCurrency(
									point.despesas,
								)}</span>
              </div>
            </td>
          </tr>`;
					})
					.join("")
			: `<tr><td colspan="2" style="padding:16px;text-align:center;color:#94a3b8;">Sem histórico suficiente.</td></tr>`;

	const cardUsageRows =
		cardUsage.length > 0
			? cardUsage
					.map(
						(item) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${escapeHtml(
							item.name,
						)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(
							item.amount,
						)}</td>
          </tr>`,
					)
					.join("")
			: `<tr><td colspan="2" style="padding:16px;text-align:center;color:#94a3b8;">Sem gastos com cartão neste período.</td></tr>`;

	const boletoRows =
		boletos.length > 0
			? boletos
					.map(
						(item) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${escapeHtml(
							item.name,
						)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${
							item.dueDate ? formatDate(item.dueDate) : "—"
						}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(
							item.amount,
						)}</td>
          </tr>`,
					)
					.join("")
			: `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">Sem boletos neste período.</td></tr>`;

	const lancamentoRows =
		lancamentos.length > 0
			? lancamentos
					.map(
						(item) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">${formatDate(
							item.purchaseDate,
						)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${
							escapeHtml(item.name) || "Sem descrição"
						}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${
							escapeHtml(item.condition) || "—"
						}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${
							escapeHtml(item.paymentMethod) || "—"
						}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(
							item.amount,
						)}</td>
          </tr>`,
					)
					.join("")
			: `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;">Nenhum lançamento registrado no período.</td></tr>`;

	const parceladoRows =
		parcelados.length > 0
			? parcelados
					.map(
						(item) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">${formatDate(
							item.purchaseDate,
						)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${
							escapeHtml(item.name) || "Sem descrição"
						}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${
							item.currentInstallment
						}/${item.installmentCount}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(
							item.installmentAmount,
						)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${formatCurrency(
							item.totalAmount,
						)}</td>
          </tr>`,
					)
					.join("")
			: `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;">Nenhum lançamento parcelado neste período.</td></tr>`;

	return `
    <div style="margin:0 auto;max-width:800px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;color:#0f172a;line-height:1.6;">
  <!-- Preheader invisível (melhora a prévia no cliente de e-mail) -->
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">Resumo mensal e detalhes de gastos por cartão, boletos e lançamentos.</span>

  <!-- Cabeçalho -->
  <div style="background:linear-gradient(90deg,#dc5a3a,#ea744e);padding:28px 24px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0 0 6px 0;font-size:26px;font-weight:800;letter-spacing:-0.3px;color:#ffffff;">Resumo Financeiro</h1>
    <p style="margin:0;font-size:15px;color:#ffece6;">${escapeHtml(
			periodLabel,
		)}</p>
  </div>

  <!-- Cartão principal -->
  <div style="background:#ffffff;padding:28px 24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
    <!-- Saudação -->
    <p style="margin:0 0 24px 0;font-size:15px;color:#334155;">
      Olá <strong>${escapeHtml(
				pagadorName,
			)}</strong>, segue o consolidado do mês:
    </p>

    <!-- Totais do mês -->
    ${buildSectionHeading("💰 Totais do mês")}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 28px 0;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden;">
      <tbody>
        <tr>
          <td style="padding:16px 18px;background:#fff7f5;border-bottom:1px solid #f1f5f9;font-size:15px;color:#475569;">Total gasto</td>
          <td style="padding:16px 18px;background:#fff7f5;border-bottom:1px solid #f1f5f9;text-align:right;">
            <strong style="font-size:22px;color:#0f172a;">${formatCurrency(
							monthlyBreakdown.totalExpenses,
						)}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:14px;color:#64748b;">💳 Cartões</td>
          <td style="padding:12px 18px;text-align:right;"><strong style="font-size:15px;color:#0f172a;">${formatCurrency(
						monthlyBreakdown.paymentSplits.card,
					)}</strong></td>
        </tr>
        <tr style="background:#fcfcfd;">
          <td style="padding:12px 18px;font-size:14px;color:#64748b;">📄 Boletos</td>
          <td style="padding:12px 18px;text-align:right;"><strong style="font-size:15px;color:#0f172a;">${formatCurrency(
						monthlyBreakdown.paymentSplits.boleto,
					)}</strong></td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:14px;color:#64748b;">⚡ Pix/Débito/Dinheiro</td>
          <td style="padding:12px 18px;text-align:right;"><strong style="font-size:15px;color:#0f172a;">${formatCurrency(
						monthlyBreakdown.paymentSplits.instant,
					)}</strong></td>
        </tr>
      </tbody>
    </table>

    <!-- Evolução 6 meses -->
    ${buildSectionHeading("📊 Evolução das Despesas (6 meses)")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 28px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Período</th>
          <th style="text-align:right;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Valor</th>
        </tr>
      </thead>
      <tbody>${historyRows}</tbody>
    </table>

    <!-- Gastos por cartão -->
    ${buildSectionHeading("💳 Gastos com Cartões")}
     <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 8px 0;">
      <tr>
        <td style="padding:10px 0;border-bottom:2px solid #e2e8f0;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#475569;font-weight:700;font-size:15px;">Total</td>
              <td style="text-align:right;">
                <strong style="font-size:18px;color:#0f172a;">${formatCurrency(
									monthlyBreakdown.paymentSplits.card,
								)}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 28px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Cartão</th>
          <th style="text-align:right;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Valor</th>
        </tr>
      </thead>
      <tbody>${cardUsageRows}</tbody>
    </table>

    <!-- Boletos -->
    ${buildSectionHeading("📄 Boletos")}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 8px 0;">
      <tr>
        <td style="padding:10px 0;border-bottom:2px solid #e2e8f0;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#475569;font-weight:700;font-size:15px;">Total</td>
              <td style="text-align:right;">
                <strong style="font-size:18px;color:#0f172a;">${formatCurrency(
									boletoStats.totalAmount,
								)}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 28px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Descrição</th>
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Vencimento</th>
          <th style="text-align:right;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Valor</th>
        </tr>
      </thead>
      <tbody>${boletoRows}</tbody>
    </table>

    <!-- Lançamentos -->
    ${buildSectionHeading("📝 Lançamentos do Mês")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Data</th>
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Descrição</th>
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Condição</th>
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Pagamento</th>
          <th style="text-align:right;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Valor</th>
        </tr>
      </thead>
      <tbody>${lancamentoRows}</tbody>
    </table>

    <!-- Lançamentos Parcelados -->
    ${buildSectionHeading("💳 Lançamentos Parcelados")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Data</th>
          <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Descrição</th>
          <th style="text-align:center;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Parcela</th>
          <th style="text-align:right;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Valor Parcela</th>
          <th style="text-align:right;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Total</th>
        </tr>
      </thead>
      <tbody>${parceladoRows}</tbody>
    </table>

    <!-- Divisor suave -->
    <div style="height:1px;background:#e2e8f0;margin:28px 0;"></div>
  </div>

  <!-- Rodapé externo -->
  <p style="margin:16px 0 0 0;font-size:12.5px;color:#94a3b8;text-align:center;">
    Este e-mail foi enviado automaticamente pelo <strong>OpenMonetis</strong>.
  </p>
</div>

  `;
};

export async function sendPagadorSummaryAction(
	input: z.infer<typeof inputSchema>,
): Promise<ActionResult> {
	try {
		const { pagadorId, period } = inputSchema.parse(input);
		const user = await getUser();

		const pagadorRow = await db.query.pagadores.findFirst({
			where: and(eq(pagadores.id, pagadorId), eq(pagadores.userId, user.id)),
		});

		if (!pagadorRow) {
			return { success: false, error: "Pagador não encontrado." };
		}

		if (!pagadorRow.email) {
			return {
				success: false,
				error: "Cadastre um e-mail para conseguir enviar o resumo.",
			};
		}

		const resendApiKey = process.env.RESEND_API_KEY;
		const resendFrom = getResendFromEmail();

		if (!resendApiKey) {
			return {
				success: false,
				error: "Serviço de e-mail não configurado (RESEND_API_KEY ausente).",
			};
		}

		const resend = new Resend(resendApiKey);

		const [
			monthlyBreakdown,
			historyData,
			cardUsage,
			boletoStats,
			boletoRows,
			lancamentoRows,
			parceladoRows,
		] = await Promise.all([
			fetchPagadorMonthlyBreakdown({
				userId: user.id,
				pagadorId,
				period,
			}),
			fetchPagadorHistory({
				userId: user.id,
				pagadorId,
				period,
			}),
			fetchPagadorCardUsage({
				userId: user.id,
				pagadorId,
				period,
			}),
			fetchPagadorBoletoStats({
				userId: user.id,
				pagadorId,
				period,
			}),
			db
				.select({
					name: lancamentos.name,
					amount: lancamentos.amount,
					dueDate: lancamentos.dueDate,
				})
				.from(lancamentos)
				.where(
					and(
						eq(lancamentos.userId, user.id),
						eq(lancamentos.pagadorId, pagadorId),
						eq(lancamentos.period, period),
						eq(lancamentos.paymentMethod, "Boleto"),
					),
				)
				.orderBy(desc(lancamentos.dueDate)),
			db
				.select({
					id: lancamentos.id,
					name: lancamentos.name,
					paymentMethod: lancamentos.paymentMethod,
					condition: lancamentos.condition,
					amount: lancamentos.amount,
					transactionType: lancamentos.transactionType,
					purchaseDate: lancamentos.purchaseDate,
				})
				.from(lancamentos)
				.where(
					and(
						eq(lancamentos.userId, user.id),
						eq(lancamentos.pagadorId, pagadorId),
						eq(lancamentos.period, period),
					),
				)
				.orderBy(desc(lancamentos.purchaseDate)),
			db
				.select({
					name: lancamentos.name,
					amount: lancamentos.amount,
					installmentCount: lancamentos.installmentCount,
					currentInstallment: lancamentos.currentInstallment,
					purchaseDate: lancamentos.purchaseDate,
				})
				.from(lancamentos)
				.where(
					and(
						eq(lancamentos.userId, user.id),
						eq(lancamentos.pagadorId, pagadorId),
						eq(lancamentos.period, period),
						eq(lancamentos.condition, "Parcelado"),
						eq(lancamentos.isAnticipated, false),
					),
				)
				.orderBy(desc(lancamentos.purchaseDate)),
		]);

		const normalizedBoletos: BoletoItem[] = boletoRows.map((row) => ({
			name: row.name ?? "Sem descrição",
			amount: Math.abs(Number(row.amount ?? 0)),
			dueDate: row.dueDate,
		}));

		const normalizedLancamentos: LancamentoRow[] = lancamentoRows.map(
			(row) => ({
				id: row.id,
				name: row.name,
				paymentMethod: row.paymentMethod,
				condition: row.condition,
				transactionType: row.transactionType,
				purchaseDate: row.purchaseDate,
				amount: Number(row.amount ?? 0),
			}),
		);

		const normalizedParcelados: ParceladoItem[] = parceladoRows.map((row) => {
			const installmentAmount = Math.abs(Number(row.amount ?? 0));
			const installmentCount = row.installmentCount ?? 1;
			const totalAmount = installmentAmount * installmentCount;

			return {
				name: row.name ?? "Sem descrição",
				installmentAmount,
				installmentCount,
				currentInstallment: row.currentInstallment ?? 1,
				totalAmount,
				purchaseDate: row.purchaseDate,
			};
		});

		const html = buildSummaryHtml({
			pagadorName: pagadorRow.name,
			periodLabel: displayPeriod(period),
			monthlyBreakdown,
			historyData,
			cardUsage,
			boletoStats,
			boletos: normalizedBoletos,
			lancamentos: normalizedLancamentos,
			parcelados: normalizedParcelados,
		});

		await resend.emails.send({
			from: resendFrom,
			to: pagadorRow.email,
			subject: `Resumo Financeiro | ${displayPeriod(period)}`,
			html,
		});

		const now = new Date();

		await db
			.update(pagadores)
			.set({ lastMailAt: now })
			.where(
				and(eq(pagadores.id, pagadorRow.id), eq(pagadores.userId, user.id)),
			);

		revalidatePath(`/pagadores/${pagadorRow.id}`);

		return { success: true, message: "Resumo enviado com sucesso." };
	} catch (error) {
		// Log estruturado em desenvolvimento
		if (process.env.NODE_ENV === "development") {
			console.error("[sendPagadorSummaryAction]", error);
		}

		// Tratar erros de validação separadamente
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message ?? "Dados inválidos.",
			};
		}

		// Não expor detalhes do erro para o usuário
		return {
			success: false,
			error: "Não foi possível enviar o resumo. Tente novamente mais tarde.",
		};
	}
}
