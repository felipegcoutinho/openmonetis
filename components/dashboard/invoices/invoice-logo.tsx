import Image from "next/image";
import {
	buildInvoiceInitials,
	type InvoiceLogoTone,
} from "@/lib/dashboard/invoices-helpers";
import { resolveLogoSrc } from "@/lib/logo";
import { cn } from "@/lib/utils/ui";

type InvoiceLogoProps = {
	cardName: string;
	logo: string | null;
	size: number;
	containerClassName?: string;
	imageClassName?: string;
	fallbackClassName?: string;
	tone?: InvoiceLogoTone;
};

export function InvoiceLogo({
	cardName,
	logo,
	size,
	containerClassName,
	imageClassName,
	fallbackClassName,
	tone = "muted",
}: InvoiceLogoProps) {
	const resolvedLogo = resolveLogoSrc(logo);

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full",
				tone === "accent" && "bg-primary/10",
				containerClassName,
			)}
		>
			{resolvedLogo ? (
				<Image
					src={resolvedLogo}
					alt={`Logo do cartão ${cardName}`}
					width={size}
					height={size}
					className={cn("h-full w-full object-contain", imageClassName)}
				/>
			) : (
				<span
					className={cn(
						"text-sm font-semibold uppercase text-muted-foreground",
						tone === "accent" && "text-primary",
						fallbackClassName,
					)}
				>
					{buildInvoiceInitials(cardName)}
				</span>
			)}
		</div>
	);
}
