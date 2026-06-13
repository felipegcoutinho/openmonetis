export type InstallmentDetection = {
	name: string;
	currentInstallment: number;
	installmentCount: number;
};

const INSTALLMENT_SUFFIX_PATTERNS = [
	/^(?<name>.+?)\s*[-–—]?\s*parcela\s+(?<current>\d{1,2})\s+de\s+(?<total>\d{1,2})\s*$/iu,
	/^(?<name>.+?)\s*[-–—]?\s*parcela\s+(?<current>\d{1,2})\s*\/\s*(?<total>\d{1,2})\s*$/iu,
	/^(?<name>.+?)\s*\((?<current>\d{1,2})\s*[/?]\s*(?<total>\d{1,2})\)\s*$/u,
	/^(?<name>.+?)\s+(?<current>\d{1,2})\s*[/?]\s*(?<total>\d{1,2})\s*$/u,
];

const normalizeDetectedName = (value: string) =>
	value
		.trim()
		.replace(/\s+[-–—:]\s*$/u, "")
		.trim();

export function detectInstallmentFromName(
	value: string | null | undefined,
): InstallmentDetection | null {
	const text = value?.trim();
	if (!text) return null;

	for (const pattern of INSTALLMENT_SUFFIX_PATTERNS) {
		const match = pattern.exec(text);
		const groups = match?.groups;
		if (!groups) continue;

		const currentInstallment = Number(groups.current);
		const installmentCount = Number(groups.total);
		const name = normalizeDetectedName(groups.name ?? "");

		if (
			name.length > 0 &&
			Number.isInteger(currentInstallment) &&
			Number.isInteger(installmentCount) &&
			currentInstallment >= 1 &&
			installmentCount >= 2 &&
			currentInstallment <= installmentCount &&
			installmentCount <= 60
		) {
			return { name, currentInstallment, installmentCount };
		}
	}

	return null;
}
