import { NextResponse } from "next/server";
import { getOptionalUserSession } from "@/shared/lib/auth/server";

const LOGO_DEV_SEARCH_URL = "https://api.logo.dev/search";

interface LogoResult {
	name: string;
	domain: string;
}

async function searchByStrategy(
	q: string,
	strategy: "match" | "typeahead",
	secretKey: string,
): Promise<LogoResult[]> {
	try {
		const url = `${LOGO_DEV_SEARCH_URL}?q=${encodeURIComponent(q)}&strategy=${strategy}`;
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${secretKey}` },
			next: { revalidate: 3600 },
		});
		if (!res.ok) return [];
		const data = await res.json();
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}

/**
 * GET /api/logo/search?q={name}
 *
 * Proxy seguro para a Logo.dev Brand Search API.
 * Faz duas buscas paralelas (match + typeahead) e retorna até 20 resultados únicos.
 * Usa LOGO_DEV_SECRET_KEY server-side — nunca exposta ao cliente.
 */
export async function GET(request: Request) {
	const session = await getOptionalUserSession();
	if (!session) {
		return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.trim();

	if (!q) {
		return NextResponse.json(
			{ error: "Parâmetro q obrigatório." },
			{ status: 400 },
		);
	}

	const secretKey = process.env.LOGO_DEV_SECRET_KEY;
	if (!secretKey) {
		return NextResponse.json(
			{ error: "Logo.dev não configurado." },
			{ status: 503 },
		);
	}

	// Duas buscas paralelas para maximizar resultados (cada uma retorna até 10)
	const [matchResults, typeaheadResults] = await Promise.all([
		searchByStrategy(q, "match", secretKey),
		searchByStrategy(q, "typeahead", secretKey),
	]);

	// Mescla e deduplica por domain, mantendo ordem (match tem prioridade)
	const seen = new Set<string>();
	const merged: LogoResult[] = [];

	for (const result of [...matchResults, ...typeaheadResults]) {
		if (!seen.has(result.domain)) {
			seen.add(result.domain);
			merged.push(result);
			if (merged.length >= 20) break;
		}
	}

	return NextResponse.json(merged);
}
