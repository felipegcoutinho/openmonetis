import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { attachments } from "@/db/schema";
import { getUserId } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { createPresignedGetUrl } from "@/shared/lib/storage/presign";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ attachmentId: string }> },
) {
	const [userId, { attachmentId }] = await Promise.all([getUserId(), params]);

	const [row] = await db
		.select({ fileKey: attachments.fileKey })
		.from(attachments)
		.where(
			and(eq(attachments.id, attachmentId), eq(attachments.userId, userId)),
		);

	if (!row) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const url = await createPresignedGetUrl(row.fileKey);
	return NextResponse.json({ url });
}
