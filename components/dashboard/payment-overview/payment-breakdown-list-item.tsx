import type { ReactNode } from "react";
import MoneyValues from "@/components/shared/money-values";
import { Progress } from "@/components/ui/progress";
import {
	formatPaymentBreakdownPercentage,
	formatPaymentBreakdownTransactionsLabel,
} from "@/lib/dashboard/payment-breakdown-formatters";

const ICON_WRAPPER_CLASS =
	"flex size-9.5 shrink-0 items-center justify-center rounded-full bg-muted text-foreground";

export type PaymentBreakdownListItemData = {
	id: string;
	title: string;
	icon: ReactNode;
	amount: number;
	transactions: number;
	percentage: number;
};

type PaymentBreakdownListItemProps = {
	item: PaymentBreakdownListItemData;
};

export function PaymentBreakdownListItem({
	item,
}: PaymentBreakdownListItemProps) {
	return (
		<li className="flex items-center gap-3 border-b border-dashed pb-3 last:border-b-0 last:pb-0">
			<div className={ICON_WRAPPER_CLASS}>{item.icon}</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium text-foreground">{item.title}</p>
					<MoneyValues amount={item.amount} />
				</div>

				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						{formatPaymentBreakdownTransactionsLabel(item.transactions)}
					</span>
					<span>{formatPaymentBreakdownPercentage(item.percentage)}</span>
				</div>

				<div className="mt-1">
					<Progress value={item.percentage} />
				</div>
			</div>
		</li>
	);
}
