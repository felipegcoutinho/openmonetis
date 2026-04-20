import { NextResponse } from "next/server";
import { getOptionalUserSession } from "@/shared/lib/auth/server";
import { fetchEstablishmentLogoDomain } from "@/shared/lib/logo/establishment-logo-queries";
import { buildLogoDevUrl } from "@/shared/lib/logo/server";

/**
 * GET /api/logo/mapping?name={name}
 *
 * Retorna o domínio Logo.dev salvo pelo usuário para um estabelecimento,
 * junto com a `logoUrl` final (construída server-side com o token). O
 * cliente usa `logoUrl` diretamente — sem precisar conhecer o token.
 */
export async function GET(request: Request) {
	const session = await getOptionalUserSession();
	if (!session) {
		return NextResponse.json({ domain: null, logoUrl: null }, { status: 200 });
	}

	const { searchParams } = new URL(request.url);
	const name = searchParams.get("name")?.trim();

	if (!name) {
		return NextResponse.json({ domain: null, logoUrl: null }, { status: 200 });
	}

	const domain = await fetchEstablishmentLogoDomain(session.user.id, name);
	const logoUrl = buildLogoDevUrl(domain);
	return NextResponse.json({ domain, logoUrl });
}
