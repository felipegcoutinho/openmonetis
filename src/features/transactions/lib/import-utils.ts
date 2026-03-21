export function normalizeDescriptionKey(description: string): string {
	return description.toLowerCase().trim().replace(/\s+/g, " ");
}
