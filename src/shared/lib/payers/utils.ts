import { DEFAULT_PAYER_AVATAR } from "./constants";

/**
 * Normaliza o caminho do avatar extraindo apenas o nome do arquivo.
 * Remove qualquer caminho anterior e retorna null se não houver avatar.
 * Preserva URLs completas (http/https/data).
 */
export const normalizeAvatarPath = (
	avatar: string | null | undefined,
): string | null => {
	if (!avatar) return null;

	// Preservar URLs completas (Google, etc)
	if (
		avatar.startsWith("http://") ||
		avatar.startsWith("https://") ||
		avatar.startsWith("data:")
	) {
		return avatar;
	}

	const file = avatar.split("/").filter(Boolean).pop();
	return file ?? avatar;
};

/**
 * Retorna o caminho completo para o avatar, com fallback para o avatar padrão.
 * Se o avatar for uma URL completa (http/https/data), retorna diretamente.
 */
export const getAvatarSrc = (avatar: string | null | undefined): string => {
	if (!avatar) {
		return `/avatars/${DEFAULT_PAYER_AVATAR}`;
	}

	// Se for uma URL completa (Google, etc), retorna diretamente
	if (
		avatar.startsWith("http://") ||
		avatar.startsWith("https://") ||
		avatar.startsWith("data:")
	) {
		return avatar;
	}

	// Se for um caminho local, normaliza e adiciona o prefixo
	const normalized = normalizeAvatarPath(avatar);
	return `/avatars/${normalized ?? DEFAULT_PAYER_AVATAR}`;
};

/**
 * Normaliza nome a partir de email
 */
export const normalizeNameFromEmail = (
	email: string | null | undefined,
): string => {
	if (!email) {
		return "Nova pessoa";
	}
	const [local] = email.split("@");
	if (!local) {
		return "Nova pessoa";
	}
	return local
		.split(".")
		.map((segment) =>
			segment.length > 0
				? segment[0]?.toUpperCase().concat(segment.slice(1))
				: segment,
		)
		.join(" ");
};
