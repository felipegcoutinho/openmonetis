import Image from "next/image";
import { cn } from "@/shared/utils/ui";

interface LogoProps {
	variant?: "full" | "small" | "compact";
	className?: string;
	/** Apenas nos variants "full" e "compact" */
	invertTextOnDark?: boolean;
	/** Exibe o ícone na cor original, sem filtro preto. Apenas nos variants "full" e "compact" */
	colorIcon?: boolean;
	/** Classes extras aplicadas na imagem do ícone */
	iconClassName?: string;
	/** Classes extras aplicadas na imagem do texto */
	textClassName?: string;
}

const iconFilterClass = "brightness-0 saturate-0";

export function Logo({
	variant = "full",
	className,
	invertTextOnDark = true,
	colorIcon = false,
	iconClassName,
	textClassName,
}: LogoProps) {
	if (variant === "compact") {
		return (
			<div className={cn("flex items-center gap-1", className)}>
				<div className="relative size-8 shrink-0">
					<Image
						src="/images/logo_small.png"
						alt="OpenMonetis"
						fill
						sizes="32px"
						className={cn(
							"object-contain",
							!colorIcon && iconFilterClass,
							iconClassName,
						)}
						priority
					/>
				</div>
				<div className="relative hidden h-8 w-[110px] shrink-0 sm:block">
					<Image
						src="/images/logo_text.png"
						alt="OpenMonetis"
						fill
						sizes="110px"
						className={cn(
							"object-contain",
							invertTextOnDark && "dark:invert",
							textClassName,
						)}
						priority
					/>
				</div>
			</div>
		);
	}

	if (variant === "small") {
		return (
			<div className={cn("relative size-8 shrink-0", className)}>
				<Image
					src="/images/logo_small.png"
					alt="OpenMonetis"
					fill
					sizes="32px"
					className="object-contain"
					priority
				/>
			</div>
		);
	}

	return (
		<div className={cn("flex items-center gap-1.5 py-4", className)}>
			<div className="relative size-7 shrink-0">
				<Image
					src="/images/logo_small.png"
					alt="OpenMonetis"
					fill
					sizes="28px"
					className={cn("object-contain", !colorIcon && iconFilterClass)}
					priority
				/>
			</div>
			<div className="relative h-8 w-[100px] shrink-0">
				<Image
					src="/images/logo_text.png"
					alt="OpenMonetis"
					fill
					sizes="100px"
					className={cn("object-contain", invertTextOnDark && "dark:invert")}
					priority
				/>
			</div>
		</div>
	);
}
