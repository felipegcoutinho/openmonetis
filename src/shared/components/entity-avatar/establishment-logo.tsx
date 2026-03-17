import {
	buildInitials,
	getCategoryBgColorFromName,
	getCategoryColorFromName,
} from "@/shared/utils/category-colors";
import { cn } from "@/shared/utils/ui";

interface EstablishmentLogoProps {
	name: string;
	size?: number;
	className?: string;
}

export function EstablishmentLogo({
	name,
	size = 32,
	className,
}: EstablishmentLogoProps) {
	const initials = buildInitials(name);
	const color = getCategoryColorFromName(name);
	const bgColor = getCategoryBgColorFromName(name);

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full font-bold",
				className,
			)}
			style={{
				width: size,
				height: size,
				fontSize: Math.max(10, Math.round(size * 0.38)),
				backgroundColor: bgColor,
				color,
			}}
			aria-hidden
		>
			{initials}
		</div>
	);
}
