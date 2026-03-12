import { cn } from "@/shared/utils/ui";

interface EstabelecimentoLogoProps {
	name: string;
	size?: number;
	className?: string;
}

const COLOR_PALETTE = [
	"bg-purple-400 dark:bg-purple-600",
	"bg-pink-400 dark:bg-pink-600",
	"bg-red-400 dark:bg-red-600",
	"bg-orange-400 dark:bg-orange-600",
	"bg-indigo-400 dark:bg-indigo-600",
	"bg-violet-400 dark:bg-violet-600",
	"bg-fuchsia-400 dark:bg-fuchsia-600",
	"bg-rose-400 dark:bg-rose-600",
	"bg-amber-400 dark:bg-amber-600",
	"bg-emerald-400 dark:bg-emerald-600",
];

function getInitials(name: string): string {
	if (!name || !name.trim()) return "?";

	const words = name.trim().split(/\s+/);

	if (words.length === 1) {
		return words[0]?.[0]?.toUpperCase() || "?";
	}

	const firstInitial = words[0]?.[0]?.toUpperCase() || "";
	const secondInitial = words[1]?.[0]?.toUpperCase() || "";

	return `${firstInitial}${secondInitial}`;
}

function generateColorFromName(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % COLOR_PALETTE.length;
	return COLOR_PALETTE[index] || "bg-gray-400";
}

export function EstabelecimentoLogo({
	name,
	size = 32,
	className,
}: EstabelecimentoLogoProps) {
	const initials = getInitials(name);
	const colorClass = generateColorFromName(name);

	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-full text-white font-bold shrink-0",
				colorClass,
				className,
			)}
			style={{
				width: size,
				height: size,
				fontSize: (size ?? 32) * 0.4,
			}}
		>
			{initials}
		</div>
	);
}
