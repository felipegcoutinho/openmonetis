import Link from "next/link";
import type { ReactNode } from "react";
import {
	formatPaymentBreakdownPercentage,
	formatPaymentBreakdownTransactionsLabel,
} from "@/features/dashboard/payments/payment-breakdown-formatters";
import MoneyValues from "@/shared/components/money-values";
import { Progress } from "@/shared/components/ui/progress";
import {
	getCategoryBgColorFromName,
	getCategoryColorFromName,
} from "@/shared/utils/category-colors";

export type PaymentBreakdownListItemData = {
	id: string;
	title: string;
	icon: ReactNode;
	amount: number;
	transactions: number;
	percentage: number;
	href?: string;
};

type PaymentBreakdownListItemProps = {
	item: PaymentBreakdownListItemData;
	position: number;
};

export function PaymentBreakdownListItem({
	item,
	position,
}: PaymentBreakdownListItemProps) {
	return (
		<div className="flex items-center gap-2 transition-all duration-300 py-1">
			<span className="w-3 shrink-0 text-left text-xs font-medium text-muted-foreground">
				{position}
			</span>
			<div
				className="flex size-9.5 shrink-0 items-center justify-center rounded-full"
				style={{
					backgroundColor: getCategoryBgColorFromName(item.id),
					color: getCategoryColorFromName(item.id),
				}}
			>
				{item.icon}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between">
					{item.href ? (
						<Link
							href={item.href}
							className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
						>
							<span className="truncate">{item.title}</span>
						</Link>
					) : (
						<p className="text-sm font-medium text-foreground">{item.title}</p>
					)}
					<MoneyValues className="shrink-0 font-medium" amount={item.amount} />
				</div>

				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						{formatPaymentBreakdownTransactionsLabel(item.transactions)}
					</span>
					<span>
						{formatPaymentBreakdownPercentage(item.percentage)} do total
					</span>
				</div>

				<div className="mt-1">
					<Progress value={item.percentage} />
				</div>
			</div>
		</div>
	);
}
