/**
 * Logo utilities
 *
 * Consolidated from:
 * - /lib/logo.ts (utility functions)
 */

/**
 * Normalizes logo path to get just the filename
 * @param logo - Logo path or URL
 * @returns Filename only
 */
export const normalizeLogo = (logo?: string | null) =>
	logo?.split("/").filter(Boolean).pop() ?? "";

/**
 * Derives a display name from a logo filename
 * @param logo - Logo path or filename
 * @returns Formatted display name
 * @example
 * deriveNameFromLogo("my-company-logo.png") // "My Company Logo"
 */
export const deriveNameFromLogo = (logo?: string | null) => {
	if (!logo) {
		return "";
	}

	const fileName = normalizeLogo(logo);

	if (!fileName) {
		return "";
	}

	const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
	return withoutExtension
		.split(/[-_.\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(" ");
};

const LOGO_SRC_PATTERN = /^(https?:\/\/|data:)/;

type ResolveLogoSrcOptions = {
	basePath?: string;
};

export const resolveLogoSrc = (
	logo?: string | null,
	options?: ResolveLogoSrcOptions,
) => {
	if (!logo) {
		return null;
	}

	if (LOGO_SRC_PATTERN.test(logo)) {
		return logo;
	}

	if (logo.startsWith("/")) {
		return logo;
	}

	const fileName = normalizeLogo(logo);
	if (!fileName) {
		return null;
	}

	const basePath = options?.basePath?.replace(/\/$/, "") || "/logos";
	return `${basePath}/${fileName}`;
};
