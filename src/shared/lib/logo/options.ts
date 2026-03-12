import { readdir } from "node:fs/promises";
import path from "node:path";

const LOGOS_DIRECTORY = path.join(process.cwd(), "public", "logos");
const LOGO_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

/**
 * Loads available logo files from the public/logos directory
 * @returns Array of logo filenames sorted alphabetically
 */
export async function loadLogoOptions() {
	try {
		const files = await readdir(LOGOS_DIRECTORY, { withFileTypes: true });

		return files
			.filter((file) => file.isFile())
			.map((file) => file.name)
			.filter((file) => LOGO_EXTENSIONS.has(path.extname(file).toLowerCase()))
			.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
	} catch {
		return [];
	}
}
