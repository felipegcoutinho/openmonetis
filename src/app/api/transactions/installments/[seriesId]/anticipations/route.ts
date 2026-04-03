import { NextResponse } from "next/server";
import { fetchInstallmentAnticipations } from "@/features/transactions/anticipation-queries";
import { getUserId } from "@/shared/lib/auth/server";

const PRIVATE_RESPONSE_HEADERS = {
	"Cache-Control": "private, no-store",
};

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ seriesId: string }> },
) {
	try {
		const [userId, { seriesId }] = await Promise.all([getUserId(), params]);
		const anticipations = await fetchInstallmentAnticipations(userId, seriesId);

		return NextResponse.json(anticipations, {
			headers: PRIVATE_RESPONSE_HEADERS,
		});
	} catch (error) {
		console.error("Erro ao carregar histórico de antecipações:", error);

		return NextResponse.json(
			{
				error: "Erro ao carregar histórico de antecipações.",
			},
			{
				status: 400,
				headers: PRIVATE_RESPONSE_HEADERS,
			},
		);
	}
}
