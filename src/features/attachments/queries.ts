import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import {
	attachments,
	categories,
	transactionAttachments,
	transactions,
} from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

export type AttachmentForPeriod = {
	attachmentId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	transactionId: string;
	transactionName: string;
	transactionAmount: string;
	transactionPeriod: string;
	purchaseDate: Date;
	categoryName: string | null;
	categoryIcon: string | null;
};

export async function fetchAttachmentsForPeriod(
	userId: string,
	period: string,
): Promise<AttachmentForPeriod[]> {
	"use cache";
	cacheTag(`dashboard-${userId}`);
	cacheLife({ revalidate: 3 });

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) return [];

	return db
		.select({
			attachmentId: attachments.id,
			fileName: attachments.fileName,
			fileSize: attachments.fileSize,
			mimeType: attachments.mimeType,
			transactionId: transactions.id,
			transactionName: transactions.name,
			transactionAmount: transactions.amount,
			transactionPeriod: transactions.period,
			purchaseDate: transactions.purchaseDate,
			categoryName: categories.name,
			categoryIcon: categories.icon,
		})
		.from(transactionAttachments)
		.innerJoin(
			attachments,
			and(
				eq(transactionAttachments.attachmentId, attachments.id),
				eq(attachments.userId, userId),
			),
		)
		.innerJoin(
			transactions,
			and(
				eq(transactionAttachments.transactionId, transactions.id),
				eq(transactions.userId, userId),
				eq(transactions.payerId, adminPayerId),
				eq(transactions.period, period),
			),
		)
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.orderBy(desc(transactions.purchaseDate), desc(attachments.id));
}
