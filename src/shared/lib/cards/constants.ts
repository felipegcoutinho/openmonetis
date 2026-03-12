export const DEFAULT_CARD_BRANDS = ["Visa", "Mastercard", "Elo"] as const;

export const DEFAULT_CARD_STATUS = ["Ativo", "Inativo"] as const;

export const DAYS_IN_MONTH = Array.from({ length: 31 }, (_, index) =>
	String(index + 1).padStart(2, "0"),
);
