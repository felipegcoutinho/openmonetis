import Image from "next/image";
import { version } from "@/package.json";
import { cn } from "@/shared/utils/ui";

interface LogoProps {
	variant?: "full" | "small" | "compact";
	className?: string;
	showVersion?: boolean;
	invertTextOnDark?: boolean;
	/** Exibe o ícone na cor original, sem filtro preto */
	colorIcon?: boolean;
}

export function Logo({
	variant = "full",
	className,
	showVersion = false,
	invertTextOnDark = true,
	colorIcon = false,
}: LogoProps) {
	if (variant === "compact") {
		return (
			<div className={cn("flex items-center gap-1", className)}>
				<Image
					src="/images/logo_small.png"
					alt="OpenMonetis"
					width={32}
					height={32}
					className={cn("object-contain", !colorIcon && "brightness-0 saturate-0")}
					priority
				/>
				<Image
					src="/images/logo_text.png"
					alt="OpenMonetis"
					width={110}
					height={32}
					className={cn(
						"hidden object-contain sm:block",
						invertTextOnDark && "dark:invert",
					)}
					priority
				/>
			</div>
		);
	}

	if (variant === "small") {
		return (
			<Image
				src="/images/logo_small.png"
				alt="OpenMonetis"
				width={32}
				height={32}
				className={cn("object-contain", className)}
				priority
			/>
		);
	}

	return (
		<div className={cn("flex items-center gap-1.5 py-4", className)}>
			<Image
				src="/images/logo_small.png"
				alt="OpenMonetis"
				width={28}
				height={28}
				className="object-contain"
				priority
			/>
			<Image
				src="/images/logo_text.png"
				alt="OpenMonetis"
				width={100}
				height={32}
				className={cn("object-contain", invertTextOnDark && "dark:invert")}
				priority
			/>
			{showVersion && (
				<span className="text-[9px] font-medium text-muted-foreground">
					{version}
				</span>
			)}
		</div>
	);
}
