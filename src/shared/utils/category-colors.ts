/**
 * Cores para categorias em widgets e listas
 * Usadas para colorir ícones e backgrounds de categorias
 */
export const CATEGORY_COLORS = [
	"#ef4444", // red
	"#3b82f6", // blue
	"#10b981", // emerald
	"#f59e0b", // amber
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#14b8a6", // teal
	"#f97316", // orange
	"#6366f1", // indigo
	"#84cc16", // lime
] as const;

/**
 * Retorna a cor para um índice específico (com ciclo)
 */
export function getCategoryColor(index: number): string {
	return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

/**
 * Retorna a cor de background com transparência
 */
export function getCategoryBgColor(index: number): string {
	const color = getCategoryColor(index);
	return `${color}15`;
}

/**
 * Gera iniciais a partir de um nome
 */
export function buildCategoryInitials(value: string): string {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "CT";
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CT";
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || "CT";
}
