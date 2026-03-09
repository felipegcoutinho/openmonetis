"use client";

import { RiBankLine } from "@remixicon/react";
import Image from "next/image";
import StatusDot from "@/components/shared/status-dot";
import { resolveCardBrandLogoSrc } from "@/lib/cartoes/brand-assets";
import { resolveLogoSrc } from "@/lib/logo";

type SelectItemContentProps = {
	label: string;
	logo?: string | null;
};

export function BrandSelectContent({ label }: { label: string }) {
	const logoSrc = resolveCardBrandLogoSrc(label);

	return (
		<span className="flex items-center gap-2">
			{logoSrc ? (
				<Image
					src={logoSrc}
					alt={`Logo ${label}`}
					width={24}
					height={24}
					className="rounded-full object-contain"
				/>
			) : (
				<RiBankLine className="size-5 text-muted-foreground" aria-hidden />
			)}
			<span>{label}</span>
		</span>
	);
}

export function StatusSelectContent({ label }: { label: string }) {
	const isActive = label === "Ativo";

	return (
		<span className="flex items-center gap-2">
			<StatusDot
				color={isActive ? "bg-success" : "bg-slate-400 dark:bg-slate-500"}
			/>
			<span>{label}</span>
		</span>
	);
}

export function AccountSelectContent({ label, logo }: SelectItemContentProps) {
	const logoSrc = resolveLogoSrc(logo);

	return (
		<span className="flex items-center gap-2">
			{logoSrc ? (
				<Image
					src={logoSrc}
					alt={`Logo de ${label}`}
					width={20}
					height={20}
					className="rounded-full"
				/>
			) : (
				<RiBankLine className="size-4 text-muted-foreground" aria-hidden />
			)}
			<span>{label}</span>
		</span>
	);
}
