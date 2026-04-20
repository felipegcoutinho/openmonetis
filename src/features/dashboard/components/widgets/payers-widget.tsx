"use client";

import {
	RiExternalLinkLine,
	RiGroupLine,
	RiVerifiedBadgeFill,
} from "@remixicon/react";
import Link from "next/link";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import type { DashboardPagador } from "@/features/dashboard/payers-queries";
import MoneyValues from "@/shared/components/money-values";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { buildInitials } from "@/shared/utils/initials";

type PayersWidgetProps = {
	payers: DashboardPagador[];
};

export function PayersWidget({ payers }: PayersWidgetProps) {
	return (
		<div className="flex flex-col">
			{payers.length === 0 ? (
				<WidgetEmptyState
					icon={<RiGroupLine className="size-6 text-muted-foreground" />}
					title="Nenhum pagador para o período"
					description="Quando houver despesas associadas a pagadores, eles aparecerão aqui."
				/>
			) : (
				<div className="flex flex-col">
					{payers.map((payer) => {
						const initials = buildInitials(payer.name);
						const hasValidPercentageChange =
							typeof payer.percentageChange === "number" &&
							Number.isFinite(payer.percentageChange);
						const percentageChange = hasValidPercentageChange
							? payer.percentageChange
							: null;

						return (
							<div
								key={payer.id}
								className="flex items-center justify-between transition-all duration-300 py-1.5"
							>
								<div className="flex min-w-0 flex-1 items-center gap-2 py-1">
									<Avatar className="size-9.5 shrink-0">
										<AvatarImage
											src={getAvatarSrc(payer.avatarUrl)}
											alt={`Avatar de ${payer.name}`}
										/>
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>

									<div className="min-w-0">
										<Link
											prefetch
											href={`/payers/${payer.id}`}
											className="inline-flex max-w-full items-center gap-1 text-sm text-foreground underline-offset-2 hover:text-primary hover:underline"
										>
											<span className="truncate font-medium">{payer.name}</span>
											{payer.isAdmin && (
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
											{payer.email ?? "Sem email cadastrado"}
										</p>
									</div>
								</div>

								<div className="flex shrink-0 flex-col items-end">
									<MoneyValues
										className="font-medium"
										amount={payer.totalExpenses}
									/>
									<PercentageChangeIndicator value={percentageChange} />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
