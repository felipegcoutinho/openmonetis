import { RiCheckboxCircleFill } from "@remixicon/react";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/shared/money-values";
import { Button } from "@/components/ui/button";
import type { DashboardBill } from "@/lib/dashboard/bills";
import {
	buildBillStatusLabel,
	isBillOverdue,
} from "@/lib/dashboard/bills-helpers";
import { cn } from "@/lib/utils/ui";

type BillListItemProps = {
	bill: DashboardBill;
	onPay: (billId: string) => void;
};

export function BillListItem({ bill, onPay }: BillListItemProps) {
	const statusLabel = buildBillStatusLabel(bill);
	const overdue = isBillOverdue(bill);

	return (
		<li className="flex items-center justify-between border-b border-dashed last:border-b-0 last:pb-0">
			<div className="flex min-w-0 flex-1 items-center gap-2 py-2">
				<EstabelecimentoLogo name={bill.name} size={37} />

				<div className="min-w-0">
					<span className="block truncate text-sm font-medium text-foreground">
						{bill.name}
					</span>
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						{statusLabel ? (
							<span
								className={cn(
									"rounded-full py-0.5",
									bill.isSettled && "text-success",
								)}
							>
								{statusLabel}
							</span>
						) : null}
					</div>
				</div>
			</div>

			<div className="flex shrink-0 flex-col items-end">
				<MoneyValues amount={bill.amount} />
				<Button
					type="button"
					size="sm"
					variant="link"
					className="h-auto p-0 disabled:opacity-100"
					disabled={bill.isSettled}
					onClick={() => onPay(bill.id)}
				>
					{bill.isSettled ? (
						<span className="flex items-center gap-1 text-success">
							<RiCheckboxCircleFill className="size-3" /> Pago
						</span>
					) : overdue ? (
						<span className="overdue-blink">
							<span className="overdue-blink-primary text-destructive">
								Atrasado
							</span>
							<span className="overdue-blink-secondary">Pagar</span>
						</span>
					) : (
						"Pagar"
					)}
				</Button>
			</div>
		</li>
	);
}
