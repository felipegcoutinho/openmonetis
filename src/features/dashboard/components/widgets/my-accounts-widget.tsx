"use client";

import {
	RiBarChartBoxLine,
	RiExternalLinkLine,
	RiEyeLine,
	RiEyeOffLine,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import type { DashboardAccount } from "@/features/dashboard/accounts-queries";
import { updateMyAccountsWidgetPreference } from "@/features/dashboard/widget-registry/widget-actions";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CardFooter } from "@/shared/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatPeriodForUrl } from "@/shared/utils/period";

type MyAccountsWidgetProps = {
	accounts: DashboardAccount[];
	showExcludedAccounts: boolean;
	onShowExcludedAccountsChange?: (value: boolean) => void;
	totalBalance: number;
	period: string;
};

export function MyAccountsWidget({
	accounts,
	showExcludedAccounts,
	onShowExcludedAccountsChange,
	totalBalance,
	period,
}: MyAccountsWidgetProps) {
	const [isPending, startTransition] = useTransition();

	const excludedAccountsCount = accounts.filter(
		(account) => account.excludeFromBalance,
	).length;
	const visibleAccounts = showExcludedAccounts
		? accounts
		: accounts.filter((account) => !account.excludeFromBalance);
	const displayedAccounts = visibleAccounts.slice(0, 5);
	const remainingCount = visibleAccounts.length - displayedAccounts.length;
	const hiddenExcludedAccountsCount = showExcludedAccounts
		? 0
		: excludedAccountsCount;
	const toggleButtonLabel = showExcludedAccounts
		? "Ocultar contas não consideradas"
		: "Mostrar contas não consideradas";

	const handleToggleExcludedAccounts = () => {
		const nextShowExcludedAccounts = !showExcludedAccounts;
		onShowExcludedAccountsChange?.(nextShowExcludedAccounts);

		startTransition(async () => {
			const result = await updateMyAccountsWidgetPreference({
				showExcludedAccounts: nextShowExcludedAccounts,
			});

			if (!result.success) {
				onShowExcludedAccountsChange?.(!nextShowExcludedAccounts);
				toast.error(result.error ?? "Erro ao salvar preferência");
			}
		});
	};

	return (
		<>
			<div className="flex items-start justify-between gap-3 py-1">
				<div className="space-y-1">
					<p className="text-sm text-muted-foreground">Saldo Total</p>
					<MoneyValues className="text-2xl font-medium" amount={totalBalance} />
				</div>

				{excludedAccountsCount > 0 ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={isPending}
								className="mt-0.5 text-muted-foreground"
								aria-label={toggleButtonLabel}
								onClick={handleToggleExcludedAccounts}
							>
								{showExcludedAccounts ? (
									<RiEyeOffLine className="size-4" aria-hidden />
								) : (
									<RiEyeLine className="size-4" aria-hidden />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="left" className="max-w-xs">
							<p className="text-xs">{toggleButtonLabel}</p>
						</TooltipContent>
					</Tooltip>
				) : null}
			</div>

			{hiddenExcludedAccountsCount > 0 ? (
				<p className="pb-2 text-xs text-muted-foreground">
					{hiddenExcludedAccountsCount}{" "}
					{hiddenExcludedAccountsCount === 1
						? "conta não considerada oculta"
						: "contas não consideradas ocultas"}
				</p>
			) : null}

			<div>
				{accounts.length === 0 ? (
					<div className="-mt-10">
						<WidgetEmptyState
							icon={
								<RiBarChartBoxLine className="size-6 text-muted-foreground" />
							}
							title="Você ainda não adicionou nenhuma conta"
							description="Cadastre suas contas bancárias para acompanhar os saldos e movimentações."
						/>
					</div>
				) : displayedAccounts.length === 0 ? (
					<div className="-mt-10">
						<WidgetEmptyState
							icon={<RiEyeOffLine className="size-6 text-muted-foreground" />}
							title="As contas não consideradas estão ocultas"
							description="Use o botão no topo do widget para mostrá-las novamente."
						/>
					</div>
				) : (
					<ul className="flex flex-col">
						{displayedAccounts.map((account, index) => {
							const logoSrc = resolveLogoSrc(account.logo);

							return (
								<div
									key={account.id}
									className="flex items-center justify-between transition-all duration-300 py-1.5 "
								>
									<div className="flex min-w-0 flex-1 items-center gap-2 py-1">
										<div className="relative size-9.5 overflow-hidden">
											{logoSrc ? (
												<Image
													src={logoSrc}
													alt={`Logo da conta ${account.name}`}
													fill
													sizes="38px"
													className="object-contain rounded-full"
													priority={index === 0}
												/>
											) : null}
										</div>

										<div className="min-w-0">
											<Link
												prefetch
												href={`/accounts/${
													account.id
												}/statement?periodo=${formatPeriodForUrl(period)}`}
												className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
											>
												<span className="truncate">{account.name}</span>
												<RiExternalLinkLine
													className="size-3 shrink-0 text-muted-foreground"
													aria-hidden
												/>
											</Link>

											{account.excludeFromBalance ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="inline-flex cursor-help ml-2">
															<Badge className="font-normal" variant="info">
																Não considerada
															</Badge>
														</span>
													</TooltipTrigger>
													<TooltipContent side="top" className="max-w-xs">
														<p className="text-xs">
															Esta conta aparece na lista, mas não entra no
															cálculo do saldo total porque está marcada para
															desconsiderar do saldo total.
														</p>
													</TooltipContent>
												</Tooltip>
											) : null}

											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span className="truncate">{account.accountType}</span>
											</div>
										</div>
									</div>

									<div className="flex flex-col items-end gap-0.5 text-right">
										<MoneyValues
											className="font-medium"
											amount={account.balance}
										/>
									</div>
								</div>
							);
						})}
					</ul>
				)}
			</div>

			{remainingCount > 0 ? (
				<CardFooter className="border-border/60 border-t pt-4 text-sm text-muted-foreground">
					+{remainingCount} contas não exibidas
				</CardFooter>
			) : null}
		</>
	);
}
