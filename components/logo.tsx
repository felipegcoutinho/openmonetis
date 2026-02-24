import Image from "next/image";
import { cn } from "@/lib/utils/ui";
import { version } from "@/package.json";

interface LogoProps {
	variant?: "full" | "small" | "compact";
	className?: string;
	showVersion?: boolean;
}

export function Logo({
	variant = "full",
	className,
	showVersion = false,
}: LogoProps) {
	if (variant === "compact") {
		return (
			<div className={cn("flex items-center gap-1", className)}>
				<Image
					src="/logo_small.png"
					alt="OpenMonetis"
					width={32}
					height={32}
					className="object-contain"
					priority
				/>
				<Image
					src="/logo_text.png"
					alt="OpenMonetis"
					width={110}
					height={32}
					className="object-contain dark:invert hidden sm:block"
					priority
				/>
			</div>
		);
	}

	if (variant === "small") {
		return (
			<Image
				src="/logo_small.png"
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
				src="/logo_small.png"
				alt="OpenMonetis"
				width={28}
				height={28}
				className="object-contain"
				priority
			/>
			<Image
				src="/logo_text.png"
				alt="OpenMonetis"
				width={100}
				height={32}
				className="object-contain dark:invert"
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
