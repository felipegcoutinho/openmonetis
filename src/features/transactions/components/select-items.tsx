"use client";

import { RiBankCard2Line, RiBankLine } from "@remixicon/react";
import Image from "next/image";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import StatusDot from "@/shared/components/status-dot";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { getConditionIcon, getPaymentMethodIcon } from "@/shared/utils/icons";

type SelectItemContentProps = {
	label: string;
	avatarUrl?: string | null;
	logo?: string | null;
	icon?: string | null;
};

export function PayerSelectContent({
	label,
	avatarUrl,
}: SelectItemContentProps) {
	const avatarSrc = getAvatarSrc(avatarUrl);
	const initial = label.charAt(0).toUpperCase() || "?";

	return (
		<span className="flex items-center gap-2">
			<Avatar className="size-5 border border-border/60 bg-background">
				<AvatarImage src={avatarSrc} alt={`Avatar de ${label}`} />
				<AvatarFallback className="text-xs font-medium uppercase">
					{initial}
				</AvatarFallback>
			</Avatar>
			<span>{label}</span>
		</span>
	);
}

export function CategorySelectContent({ label, icon }: SelectItemContentProps) {
	return (
		<span className="flex items-center gap-2">
			<CategoryIcon name={icon} className="size-4" />
			<span>{label}</span>
		</span>
	);
}

export function TransactionTypeSelectContent({ label }: { label: string }) {
	const colorMap: Record<string, string> = {
		Receita: "bg-success",
		Despesa: "bg-destructive",
		Transferência: "bg-info",
	};

	return (
		<span className="flex items-center gap-2">
			<StatusDot color={colorMap[label]} />
			<span>{label}</span>
		</span>
	);
}

export function PaymentMethodSelectContent({ label }: { label: string }) {
	const icon = getPaymentMethodIcon(label);

	return (
		<span className="flex items-center gap-2">
			{icon}
			<span>{label}</span>
		</span>
	);
}

export function ConditionSelectContent({ label }: { label: string }) {
	const icon = getConditionIcon(label);

	return (
		<span className="flex items-center gap-2">
			{icon}
			<span>{label}</span>
		</span>
	);
}

export function AccountCardSelectContent({
	label,
	logo,
	isCartao,
}: SelectItemContentProps & { isCartao?: boolean }) {
	const logoSrc = resolveLogoSrc(logo);
	const Icon = isCartao ? RiBankCard2Line : RiBankLine;

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
				<Icon className="size-4 text-muted-foreground" aria-hidden />
			)}
			<span>{label}</span>
		</span>
	);
}
