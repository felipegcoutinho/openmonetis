import { RiBankCard2Line } from "@remixicon/react";
import Image from "next/image";
import MoneyValues from "@/shared/components/money-values";
import { CardContent } from "@/shared/components/ui/card";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { resolveLogoSrc } from "@/shared/lib/logo";
import type { PayerCardUsageItem } from "@/shared/lib/payers/details";

const buildInitials = (value: string) => {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "CC";
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CC";
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || "CC";
};

type PagadorCardUsageCardProps = {
	items: PayerCardUsageItem[];
};

export function PayerCardUsageCard({ items }: PagadorCardUsageCardProps) {
	if (items.length === 0) {
		return (
			<CardContent className="px-0">
				<WidgetEmptyState
					icon={<RiBankCard2Line className="size-6 text-muted-foreground" />}
					title="Nenhum lançamento com cartão de crédito"
					description="Quando houver despesas registradas com cartão, elas aparecerão aqui."
				/>
			</CardContent>
		);
	}

	return (
		<CardContent className="flex flex-col gap-4 px-0">
			<ul className="flex flex-col">
				{items.map((item) => {
					const logoPath = resolveLogoSrc(item.logo);
					const initials = buildInitials(item.name);
					return (
						<div key={item.id} className="flex items-center justify-between">
							<div className="flex min-w-0 flex-1 items-center gap-2 py-2">
								<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
									{logoPath ? (
										<Image
											src={logoPath}
											alt={`Logo do cartão ${item.name}`}
											width={36}
											height={36}
											className="h-full w-full object-contain"
										/>
									) : (
										<span className="text-sm font-semibold uppercase text-muted-foreground">
											{initials}
										</span>
									)}
								</div>
								<div className="min-w-0">
									<span className="block truncate text-sm font-medium text-foreground">
										{item.name}
									</span>
									<span className="text-xs text-muted-foreground">
										Despesas no mês
									</span>
								</div>
							</div>
							<MoneyValues amount={item.amount} />
						</div>
					);
				})}
			</ul>
		</CardContent>
	);
}
