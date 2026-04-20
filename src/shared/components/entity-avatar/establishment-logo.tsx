"use client";

import { RiPencilLine } from "@remixicon/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLogoDevEnabled } from "@/shared/components/providers/logo-dev-provider";
import { logoQueryKeys, toNameKey } from "@/shared/lib/logo";
import {
	buildInitials,
	getCategoryBgColorFromName,
	getCategoryColorFromName,
} from "@/shared/utils/category-colors";
import { cn } from "@/shared/utils/ui";
import { EstablishmentLogoPicker } from "./establishment-logo-picker";

interface LogoMappingResponse {
	domain: string | null;
	logoUrl: string | null;
}

async function fetchLogoMapping(name: string): Promise<LogoMappingResponse> {
	const res = await fetch(`/api/logo/mapping?name=${encodeURIComponent(name)}`);
	if (!res.ok) return { domain: null, logoUrl: null };
	return res.json();
}

interface EstablishmentLogoProps {
	name: string;
	/** Domínio Logo.dev pré-carregado pelo servidor (otimização opcional). */
	domain?: string | null;
	/** URL pré-construída no servidor — evita flicker no primeiro render. */
	logoUrl?: string | null;
	size?: number;
	className?: string;
}

export function EstablishmentLogo({
	name,
	domain: initialDomain,
	logoUrl: initialLogoUrl,
	size = 32,
	className,
}: EstablishmentLogoProps) {
	const logoDevEnabled = useLogoDevEnabled();
	const [pickerOpen, setPickerOpen] = useState(false);
	const [imgError, setImgError] = useState(false);

	const hasPlaceholder =
		initialDomain !== undefined || initialLogoUrl !== undefined;

	const { data: mappingData } = useQuery({
		queryKey: logoQueryKeys.mapping(toNameKey(name)),
		queryFn: () => fetchLogoMapping(name),
		placeholderData: hasPlaceholder
			? {
					domain: initialDomain ?? null,
					logoUrl: initialLogoUrl ?? null,
				}
			: undefined,
		staleTime: 1000 * 60 * 5,
		enabled: logoDevEnabled,
	});

	const resolvedDomain = mappingData?.domain ?? null;
	const logoUrl = mappingData?.logoUrl ?? null;

	const showLogo = Boolean(logoUrl) && !imgError;

	const initials = buildInitials(name);
	const color = getCategoryColorFromName(name);
	const bgColor = getCategoryBgColorFromName(name);

	const initialsAvatar = (
		<div
			className="flex shrink-0 items-center justify-center rounded-full font-medium"
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

	const logoImage =
		showLogo && logoUrl ? (
			<img
				src={logoUrl}
				alt={name}
				width={size}
				height={size}
				onError={() => setImgError(true)}
				className="shrink-0 rounded-full object-cover"
				style={{ width: size, height: size }}
			/>
		) : (
			initialsAvatar
		);

	if (!logoDevEnabled) {
		return (
			<div className={cn("shrink-0", className)} aria-hidden>
				{initialsAvatar}
			</div>
		);
	}

	return (
		<EstablishmentLogoPicker
			name={name}
			resolvedDomain={resolvedDomain}
			open={pickerOpen}
			onOpenChange={setPickerOpen}
			onSelect={() => setPickerOpen(false)}
		>
			<button
				type="button"
				className={cn("group relative shrink-0 cursor-pointer", className)}
				onClick={(e) => e.stopPropagation()}
				title={`Alterar logo de ${name}`}
				aria-label={`Alterar logo de ${name}`}
			>
				{logoImage}
				<span
					className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
					aria-hidden
				>
					<RiPencilLine
						style={{
							width: Math.max(10, Math.round(size * 0.38)),
							height: Math.max(10, Math.round(size * 0.38)),
						}}
						className="text-white"
					/>
				</span>
			</button>
		</EstablishmentLogoPicker>
	);
}
