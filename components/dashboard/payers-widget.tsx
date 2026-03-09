"use client";

import {
	RiArrowDownSFill,
	RiArrowUpSFill,
	RiExternalLinkLine,
	RiGroupLine,
	RiVerifiedBadgeFill,
} from "@remixicon/react";
import Link from "next/link";
import MoneyValues from "@/components/shared/money-values";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardContent } from "@/components/ui/card";
import type { DashboardPagador } from "@/lib/dashboard/pagadores";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { formatPercentage } from "@/lib/utils/percentage";

type PayersWidgetProps = {
	pagadores: DashboardPagador[];
};

const buildInitials = (value: string) => {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "??";
	}
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : "??";
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || "??";
};

export function PayersWidget({ pagadores }: PayersWidgetProps) {
	return (
		<CardContent className="flex flex-col gap-4 px-0">
			{pagadores.length === 0 ? (
				<WidgetEmptyState
					icon={<RiGroupLine className="size-6 text-muted-foreground" />}
					title="Nenhum pagador para o período"
					description="Quando houver despesas associadas a pagadores, eles aparecerão aqui."
				/>
			) : (
				<ul className="flex flex-col">
					{pagadores.map((pagador) => {
						const initials = buildInitials(pagador.name);
						const hasValidPercentageChange =
							typeof pagador.percentageChange === "number" &&
							Number.isFinite(pagador.percentageChange);
						const percentageChange = hasValidPercentageChange
							? pagador.percentageChange
							: null;

						return (
							<li
								key={pagador.id}
								className="flex items-center justify-between border-b border-dashed last:border-b-0 last:pb-0"
							>
								<div className="flex min-w-0 flex-1 items-center gap-2 py-2">
									<Avatar className="size-10 shrink-0">
										<AvatarImage
											src={getAvatarSrc(pagador.avatarUrl)}
											alt={`Avatar de ${pagador.name}`}
										/>
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>

									<div className="min-w-0">
										<Link
											prefetch
											href={`/pagadores/${pagador.id}`}
											className="inline-flex max-w-full items-center gap-1 text-sm text-foreground underline-offset-2 hover:text-primary hover:underline"
										>
											<span className="truncate font-medium">
												{pagador.name}
											</span>
											{pagador.isAdmin && (
												<RiVerifiedBadgeFill
													className="size-4 shrink-0 text-blue-500"
													aria-hidden
												/>
											)}
											<RiExternalLinkLine
												className="size-3 shrink-0 text-muted-foreground"
												aria-hidden
											/>
										</Link>
										<p className="truncate text-xs text-muted-foreground">
											{pagador.email ?? "Sem email cadastrado"}
										</p>
									</div>
								</div>

								<div className="flex shrink-0 flex-col items-end">
									<MoneyValues amount={pagador.totalExpenses} />
									{percentageChange !== null && (
										<span
											className={`flex items-center gap-0.5 text-xs ${
												percentageChange > 0
													? "text-destructive"
													: percentageChange < 0
														? "text-success"
														: "text-muted-foreground"
											}`}
										>
											{percentageChange > 0 && (
												<RiArrowUpSFill className="size-3" />
											)}
											{percentageChange < 0 && (
												<RiArrowDownSFill className="size-3" />
											)}
											{formatPercentage(percentageChange)}
										</span>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</CardContent>
	);
}
