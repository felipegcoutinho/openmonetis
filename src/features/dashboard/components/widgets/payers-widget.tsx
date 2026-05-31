"use client";

import { RiGroupLine, RiVerifiedBadgeFill } from "@remixicon/react";
import Link from "next/link";
import { PercentageChangeIndicator } from "@/features/dashboard/components/percentage-change-indicator";
import type { DashboardPagador } from "@/features/dashboard/lib/payers-queries";
import MoneyValues from "@/shared/components/money-values";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
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
					title="Nenhuma pessoa para o período"
					description="Quando houver despesas associadas a pessoas, elas aparecerão aqui."
				/>
			) : (
				<div className="flex flex-col">
					{payers.map((payer, index) => {
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
								className="flex items-center justify-between gap-2 transition-all duration-300 py-1.5"
							>
								<span className="w-3 shrink-0 text-left text-xs font-medium text-muted-foreground">
									{index + 1}
								</span>
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
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="inline-flex shrink-0">
															<RiVerifiedBadgeFill
																className="size-4 text-blue-500"
																aria-hidden
															/>
															<span className="sr-only">Pessoa principal</span>
														</span>
													</TooltipTrigger>
													<TooltipContent side="top">
														Pessoa principal
													</TooltipContent>
												</Tooltip>
											)}
										</Link>
										<p className="truncate text-xs text-muted-foreground">
											Despesas no período
										</p>
									</div>
								</div>

								<div className="flex shrink-0 flex-col items-end">
									<MoneyValues
										className="font-medium"
										amount={payer.totalExpenses}
									/>
									<div className="flex items-center gap-1 text-xs text-muted-foreground">
										<PercentageChangeIndicator value={percentageChange} />
										{percentageChange !== null ? (
											<span>vs. mês ant.</span>
										) : null}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
