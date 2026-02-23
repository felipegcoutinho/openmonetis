import { and, desc, eq, gte, lte, type SQL, sum } from "drizzle-orm";
import { cartoes, faturas, lancamentos } from "@/db/schema";
import { buildInvoicePaymentNote } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import {
	INVOICE_PAYMENT_STATUS,
	type InvoicePaymentStatus,
} from "@/lib/faturas";
import { getInvoiceDateRange } from "@/lib/utils/period";

const toNumber = (value: string | number | null | undefined) => {
	if (typeof value === "number") {
		return value;
	}
	if (value === null || value === undefined) {
		return 0;
	}
	const parsed = Number(value);
	return Number.isNaN(parsed) ? 0 : parsed;
};

export async function fetchCardData(userId: string, cartaoId: string) {
	const card = await db.query.cartoes.findFirst({
		columns: {
			id: true,
			name: true,
			brand: true,
			closingDay: true,
			dueDay: true,
			logo: true,
			limit: true,
			status: true,
			note: true,
			contaId: true,
		},
		where: and(eq(cartoes.id, cartaoId), eq(cartoes.userId, userId)),
	});

	return card;
}

export async function fetchInvoiceData(
	userId: string,
	cartaoId: string,
	selectedPeriod: string,
	closingDay: string,
): Promise<{
	totalAmount: number;
	invoiceStatus: InvoicePaymentStatus;
	paymentDate: Date | null;
}> {
	const closingDayNum = Math.min(
		31,
		Math.max(1, Number.parseInt(closingDay, 10) || 1),
	);
	const { start: invoiceStart, end: invoiceEnd } = getInvoiceDateRange(
		selectedPeriod,
		closingDayNum,
	);

	const [invoiceRow, totalRow] = await Promise.all([
		db.query.faturas.findFirst({
			columns: {
				id: true,
				period: true,
				paymentStatus: true,
			},
			where: and(
				eq(faturas.cartaoId, cartaoId),
				eq(faturas.userId, userId),
				eq(faturas.period, selectedPeriod),
			),
		}),
		db
			.select({ totalAmount: sum(lancamentos.amount) })
			.from(lancamentos)
			.where(
				and(
					eq(lancamentos.userId, userId),
					eq(lancamentos.cartaoId, cartaoId),
					gte(lancamentos.purchaseDate, invoiceStart),
					lte(lancamentos.purchaseDate, invoiceEnd),
				),
			),
	]);

	const totalAmount = toNumber(totalRow[0]?.totalAmount);
	const isInvoiceStatus = (
		value: string | null | undefined,
	): value is InvoicePaymentStatus =>
		!!value && ["pendente", "pago"].includes(value);

	const invoiceStatus = isInvoiceStatus(invoiceRow?.paymentStatus)
		? invoiceRow?.paymentStatus
		: INVOICE_PAYMENT_STATUS.PENDING;

	// Buscar data do pagamento se a fatura estiver paga
	let paymentDate: Date | null = null;
	if (invoiceStatus === INVOICE_PAYMENT_STATUS.PAID) {
		const invoiceNote = buildInvoicePaymentNote(cartaoId, selectedPeriod);
		const paymentLancamento = await db.query.lancamentos.findFirst({
			columns: {
				purchaseDate: true,
			},
			where: and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.note, invoiceNote),
			),
		});
		paymentDate = paymentLancamento?.purchaseDate
			? new Date(paymentLancamento.purchaseDate)
			: null;
	}

	return { totalAmount, invoiceStatus, paymentDate };
}

export async function fetchCardLancamentos(filters: SQL[]) {
	return db.query.lancamentos.findMany({
		where: and(...filters),
		with: {
			pagador: true,
			conta: true,
			cartao: true,
			categoria: true,
		},
		orderBy: desc(lancamentos.purchaseDate),
	});
}
