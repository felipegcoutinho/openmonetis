import {
	RiBarcodeLine,
	RiCheckboxCircleLine,
	RiHourglass2Line,
	RiWallet3Line,
} from "@remixicon/react";
import { buildBillStatusLabel } from "@/features/dashboard/bills-helpers";
import { EstablishmentLogo } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Separator } from "@/shared/components/ui/separator";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import type {
	PayerBoletoItem,
	PayerPaymentStatusData,
} from "@/shared/lib/payers/details";
import { cn } from "@/shared/utils/ui";

// --- PayerBoletoCard ---

type PagadorBoletoCardProps = {
	items: PayerBoletoItem[];
};

export function PayerBoletoCard({ items }: PagadorBoletoCardProps) {
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
						<div key={item.id} className="flex items-center justify-between">
							<div className="flex min-w-0 flex-1 items-center gap-3 py-2">
								<EstablishmentLogo name={item.name} size={36} />
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
						</div>
					);
				})}
			</ul>
		</CardContent>
	);
}

// --- PayerPaymentStatusCard ---

type PagadorPaymentStatusCardProps = {
	data: PayerPaymentStatusData;
};

export function PayerPaymentStatusCard({
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

			<Separator />

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
