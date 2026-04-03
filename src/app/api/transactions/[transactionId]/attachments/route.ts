import { NextResponse } from "next/server";
import { fetchTransactionAttachments } from "@/features/transactions/attachment-queries";
import { getUserId } from "@/shared/lib/auth/server";

const PRIVATE_RESPONSE_HEADERS = {
	"Cache-Control": "private, no-store",
};

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ transactionId: string }> },
) {
	const [userId, { transactionId }] = await Promise.all([getUserId(), params]);
	const attachments = await fetchTransactionAttachments(userId, transactionId);

	return NextResponse.json(attachments, {
		headers: PRIVATE_RESPONSE_HEADERS,
	});
}
