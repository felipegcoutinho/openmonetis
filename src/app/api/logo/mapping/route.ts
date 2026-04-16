import { NextResponse } from "next/server";
import { getOptionalUserSession } from "@/shared/lib/auth/server";
import { fetchEstablishmentLogoDomain } from "@/shared/lib/logo/establishment-logo-queries";

/**
 * GET /api/logo/mapping?name={name}
 *
 * Retorna o domínio Logo.dev salvo pelo usuário para um estabelecimento.
 * Usado pelo EstablishmentLogo para hidratar o domain salvo no banco.
 */
export async function GET(request: Request) {
	const session = await getOptionalUserSession();
	if (!session) {
		return NextResponse.json({ domain: null }, { status: 200 });
	}

	const { searchParams } = new URL(request.url);
	const name = searchParams.get("name")?.trim();

	if (!name) {
		return NextResponse.json({ domain: null }, { status: 200 });
	}

	const domain = await fetchEstablishmentLogoDomain(session.user.id, name);
	return NextResponse.json({ domain });
}
