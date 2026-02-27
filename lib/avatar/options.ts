import { readdir } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_PAGADOR_AVATAR } from "@/lib/pagadores/constants";

const AVATAR_DIRECTORY = path.join(process.cwd(), "public", "avatares");
const AVATAR_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

/**
 * Loads available avatar files from the public/avatares directory
 * @returns Array of unique avatar filenames sorted alphabetically
 */
export async function loadAvatarOptions() {
	try {
		const files = await readdir(AVATAR_DIRECTORY, { withFileTypes: true });

		const items = files
			.filter((file) => file.isFile())
			.map((file) => file.name)
			.filter((file) => AVATAR_EXTENSIONS.has(path.extname(file).toLowerCase()))
			.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

		if (items.length === 0) {
			items.push(DEFAULT_PAGADOR_AVATAR);
		}

		return Array.from(new Set(items));
	} catch {
		return [DEFAULT_PAGADOR_AVATAR];
	}
}
