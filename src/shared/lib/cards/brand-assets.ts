const CARD_BRAND_ASSET_BY_KEY = {
	visa: "/flags/visa.svg",
	mastercard: "/flags/mastercard.svg",
	amex: "/flags/amex.svg",
	american: "/flags/amex.svg",
	elo: "/flags/elo.svg",
	hipercard: "/flags/hipercard.svg",
	hiper: "/flags/hipercard.svg",
} as const;

const CARD_BRAND_LOGO_BY_KEY = {
	visa: "/logos/visa.png",
	mastercard: "/logos/mastercard.png",
	amex: "/logos/amex.png",
	american: "/logos/amex.png",
	elo: "/logos/elo.png",
	hipercard: "/logos/hipercard.png",
	hiper: "/logos/hipercard.png",
} as const;

const findMatchingCardBrandKey = (brand?: string | null) => {
	if (!brand) {
		return null;
	}

	const normalizedBrand = brand.trim().toLowerCase();

	return (
		(
			Object.keys(CARD_BRAND_ASSET_BY_KEY) as Array<
				keyof typeof CARD_BRAND_ASSET_BY_KEY
			>
		).find((key) => normalizedBrand.includes(key)) ?? null
	);
};

export const resolveCardBrandAsset = (brand?: string | null) => {
	const key = findMatchingCardBrandKey(brand);
	return key ? CARD_BRAND_ASSET_BY_KEY[key] : null;
};

export const resolveCardBrandLogoSrc = (brand?: string | null) => {
	const key = findMatchingCardBrandKey(brand);
	return key ? CARD_BRAND_LOGO_BY_KEY[key] : null;
};
