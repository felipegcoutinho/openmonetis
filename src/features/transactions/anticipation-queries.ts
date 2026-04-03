import { and, desc, eq } from "drizzle-orm";
import {
	categories,
	installmentAnticipations,
	payers,
	transactions,
} from "@/db/schema";
import { db } from "@/shared/lib/db";
import { uuidSchema } from "@/shared/lib/schemas/common";

export type InstallmentAnticipationListItem = {
	id: string;
	anticipationPeriod: string;
	anticipationDate: string;
	installmentCount: number;
	totalAmount: string;
	discount: string;
	transactionId: string;
	note: string | null;
	transaction: {
		isSettled: boolean | null;
	} | null;
	payer: {
		name: string;
	} | null;
	category: {
		name: string;
	} | null;
};

export async function fetchInstallmentAnticipations(
	userId: string,
	seriesId: string,
): Promise<InstallmentAnticipationListItem[]> {
	const validatedSeriesId = uuidSchema("Série").parse(seriesId);

	const anticipations = await db
		.select({
			id: installmentAnticipations.id,
			anticipationPeriod: installmentAnticipations.anticipationPeriod,
			anticipationDate: installmentAnticipations.anticipationDate,
			installmentCount: installmentAnticipations.installmentCount,
			totalAmount: installmentAnticipations.totalAmount,
			discount: installmentAnticipations.discount,
			transactionId: installmentAnticipations.transactionId,
			note: installmentAnticipations.note,
			transactionRecordId: transactions.id,
			transactionIsSettled: transactions.isSettled,
			payerName: payers.name,
			categoryName: categories.name,
		})
		.from(installmentAnticipations)
		.leftJoin(
			transactions,
			and(
				eq(installmentAnticipations.transactionId, transactions.id),
				eq(transactions.userId, userId),
			),
		)
		.leftJoin(
			payers,
			and(
				eq(installmentAnticipations.payerId, payers.id),
				eq(payers.userId, userId),
			),
		)
		.leftJoin(
			categories,
			and(
				eq(installmentAnticipations.categoryId, categories.id),
				eq(categories.userId, userId),
			),
		)
		.where(
			and(
				eq(installmentAnticipations.seriesId, validatedSeriesId),
				eq(installmentAnticipations.userId, userId),
			),
		)
		.orderBy(desc(installmentAnticipations.createdAt));

	return anticipations.map((anticipation) => ({
		id: anticipation.id,
		anticipationPeriod: anticipation.anticipationPeriod,
		anticipationDate: anticipation.anticipationDate.toISOString(),
		installmentCount: anticipation.installmentCount,
		totalAmount: anticipation.totalAmount,
		discount: anticipation.discount,
		transactionId: anticipation.transactionId,
		note: anticipation.note,
		transaction: anticipation.transactionRecordId
			? { isSettled: anticipation.transactionIsSettled }
			: null,
		payer: anticipation.payerName ? { name: anticipation.payerName } : null,
		category: anticipation.categoryName
			? { name: anticipation.categoryName }
			: null,
	}));
}
