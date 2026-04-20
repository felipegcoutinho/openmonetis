/**
 * Data palette para categorias e estabelecimentos.
 * Os valores são CSS variables definidas em globals.css,
 * com variantes light/dark — sem hardcode de hex fora do tema.
 */
const DATA_PALETTE_SIZE = 6;

/** Array de CSS variables da paleta de dados — usado em gráficos e charts. */
export const CATEGORY_COLORS = Array.from(
	{ length: DATA_PALETTE_SIZE },
	(_, i) => `var(--data-${i + 1})`,
) as readonly string[];

function hashNameToIndex(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash) % DATA_PALETTE_SIZE;
}

/**
 * Cor do ícone — sempre primary para consistência visual.
 */
export function getCategoryColorFromName(_name: string): string {
	return "var(--foreground)";
}

/**
 * Background distinto por nome (hash), com 20% de opacidade.
 */
export function getCategoryBgColorFromName(name: string): string {
	const n = hashNameToIndex(name) + 1;
	return `color-mix(in oklch, var(--data-${n}) 20%, transparent)`;
}

/**
 * Gera 1 ou 2 iniciais a partir de um nome.
 * "Padaria João" → "PJ" | "Alimentação" → "AL" | "" → "?"
 */
export function buildInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) {
		return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
	}
	const a = parts[0]?.[0] ?? "";
	const b = parts[1]?.[0] ?? "";
	return `${a}${b}`.toUpperCase() || "?";
}
