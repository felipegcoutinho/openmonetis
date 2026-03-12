type FormatPercentageOptions = {
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	absolute?: boolean;
	signDisplay?: Intl.NumberFormatOptions["signDisplay"];
};

export function formatPercentage(
	value: number,
	options?: FormatPercentageOptions,
): string {
	const normalizedValue = options?.absolute ? Math.abs(value) : value;

	return `${new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: options?.minimumFractionDigits ?? 0,
		maximumFractionDigits: options?.maximumFractionDigits ?? 1,
		...(options?.signDisplay ? { signDisplay: options.signDisplay } : {}),
	}).format(normalizedValue)}%`;
}

export function formatPercentageChange(value: number | null): string {
	if (value === null) {
		return "-";
	}

	const absoluteValue = Math.abs(value);
	const formatterOptions =
		absoluteValue < 10
			? {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
				}
			: {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				};

	return formatPercentage(value, {
		...formatterOptions,
		absolute: true,
		signDisplay: value === 0 ? "auto" : "always",
	});
}
