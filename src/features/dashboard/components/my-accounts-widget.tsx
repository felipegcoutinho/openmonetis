import { RiBarChartBoxLine, RiExternalLinkLine } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import type { DashboardAccount } from "@/features/dashboard/accounts-queries";
import MoneyValues from "@/shared/components/money-values";
import { CardFooter } from "@/shared/components/ui/card";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatPeriodForUrl } from "@/shared/utils/period";

type MyAccountsWidgetProps = {
	accounts: DashboardAccount[];
	totalBalance: number;
	period: string;
};

export function MyAccountsWidget({
	accounts,
	totalBalance,
	period,
}: MyAccountsWidgetProps) {
	const visibleAccounts = accounts.filter(
		(account) => !account.excludeFromBalance,
	);
	const displayedAccounts = visibleAccounts.slice(0, 5);
	const remainingCount = visibleAccounts.length - displayedAccounts.length;

	return (
		<>
			<div className="flex justify-between py-2">
				Saldo Total
				<MoneyValues className="text-2xl" amount={totalBalance} />
			</div>

			<div className="py-2 px-0">
				{displayedAccounts.length === 0 ? (
					<div className="-mt-10">
						<WidgetEmptyState
							icon={
								<RiBarChartBoxLine className="size-6 text-muted-foreground" />
							}
							title="Você ainda não adicionou nenhuma conta"
							description="Cadastre suas contas bancárias para acompanhar os saldos e movimentações."
						/>
					</div>
				) : (
					<ul className="flex flex-col">
						{displayedAccounts.map((account) => {
							const logoSrc = resolveLogoSrc(account.logo);

							return (
								<li
									key={account.id}
									className="flex items-center justify-between gap-2 border-b border-dashed py-2 last:border-0"
								>
									<div className="flex min-w-0 flex-1 items-center gap-3">
										<div className="relative size-10 overflow-hidden">
											<Image
												src={logoSrc}
												alt={`Logo da conta ${account.name}`}
												fill
												className="object-contain rounded-full"
											/>
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
											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span className="truncate">{account.accountType}</span>
											</div>
										</div>
									</div>

									<div className="flex flex-col items-end gap-0.5 text-right">
										<MoneyValues amount={account.balance} />
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			{visibleAccounts.length > displayedAccounts.length ? (
				<CardFooter className="border-border/60 border-t pt-4 text-sm text-muted-foreground">
					+{remainingCount} contas não exibidas
				</CardFooter>
			) : null}
		</>
	);
}
