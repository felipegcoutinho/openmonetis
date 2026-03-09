import {
	RiBarcodeLine,
	RiCheckboxCircleLine,
	RiHourglass2Line,
	RiWallet3Line,
} from "@remixicon/react";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/shared/money-values";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildBillStatusLabel } from "@/lib/dashboard/bills-helpers";
import type {
	PagadorBoletoItem,
	PagadorPaymentStatusData,
} from "@/lib/pagadores/details";
import { cn } from "@/lib/utils/ui";

// --- PagadorBoletoCard ---

type PagadorBoletoCardProps = {
	items: PagadorBoletoItem[];
};

export function PagadorBoletoCard({ items }: PagadorBoletoCardProps) {
	if (items.length === 0) {
		return (
			<CardContent className="px-0">
				<WidgetEmptyState
					icon={<RiBarcodeLine className="size-6 text-muted-foreground" />}
					title="Nenhum boleto cadastrado para o período"
					description="Quando houver despesas registradas com boleto, elas aparecerão aqui."
				/>
			</CardContent>
		);
	}

	return (
		<CardContent className="flex flex-col gap-4 px-0">
			<ul className="flex flex-col">
				{items.map((item) => {
					const statusLabel = buildBillStatusLabel(item);
					return (
						<li
							key={item.id}
							className="flex items-center justify-between border-b border-dashed last:border-b-0 last:pb-0"
						>
							<div className="flex min-w-0 flex-1 items-center gap-3 py-2">
								<EstabelecimentoLogo name={item.name} size={36} />
								<div className="min-w-0">
									<span className="block truncate text-sm font-medium text-foreground">
										{item.name}
									</span>
									{statusLabel ? (
										<span
											className={cn(
												"text-xs text-muted-foreground",
												item.isSettled && "text-success",
											)}
										>
											{statusLabel}
										</span>
									) : null}
								</div>
							</div>
							<MoneyValues amount={item.amount} />
						</li>
					);
				})}
			</ul>
		</CardContent>
	);
}

// --- PagadorPaymentStatusCard ---

type PagadorPaymentStatusCardProps = {
	data: PagadorPaymentStatusData;
};

export function PagadorPaymentStatusCard({
	data,
}: PagadorPaymentStatusCardProps) {
	const { paidAmount, paidCount, pendingAmount, pendingCount, totalAmount } =
		data;

	if (totalAmount === 0) {
		return (
			<CardContent className="px-0">
				<WidgetEmptyState
					icon={<RiWallet3Line className="size-6 text-muted-foreground" />}
					title="Nenhuma despesa no período"
					description="Registre lançamentos para visualizar o status de pagamento."
				/>
			</CardContent>
		);
	}

	const paidPercentage = (paidAmount / totalAmount) * 100;

	return (
		<CardContent className="space-y-6 px-0">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-foreground">Pago</span>
					<MoneyValues amount={paidAmount} />
				</div>
				<Progress value={paidPercentage} className="h-2" />
				<div className="flex items-center justify-between gap-4 text-sm">
					<div className="flex items-center gap-1.5">
						<RiCheckboxCircleLine className="size-3 text-success" />
						<MoneyValues amount={paidAmount} />
						<span className="text-xs text-muted-foreground">
							({paidCount} registro{paidCount !== 1 ? "s" : ""})
						</span>
					</div>
				</div>
			</div>

			<div className="border-t border-dashed" />

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-foreground">Pendente</span>
					<MoneyValues amount={pendingAmount} />
				</div>
				<Progress value={100 - paidPercentage} className="h-2" />
				<div className="flex items-center justify-between gap-4 text-sm">
					<div className="flex items-center gap-1.5">
						<RiHourglass2Line className="size-3 text-warning" />
						<MoneyValues amount={pendingAmount} />
						<span className="text-xs text-muted-foreground">
							({pendingCount} registro{pendingCount !== 1 ? "s" : ""})
						</span>
					</div>
				</div>
			</div>
		</CardContent>
	);
}
