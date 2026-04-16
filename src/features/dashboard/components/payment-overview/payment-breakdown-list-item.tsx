import { RiExternalLinkLine } from "@remixicon/react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
	formatPaymentBreakdownPercentage,
	formatPaymentBreakdownTransactionsLabel,
} from "@/features/dashboard/payment-breakdown-formatters";
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
};

export function PaymentBreakdownListItem({
	item,
}: PaymentBreakdownListItemProps) {
	return (
		<div className="flex items-center gap-3 transition-all duration-300 py-1.5">
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
							<RiExternalLinkLine
								className="size-3 shrink-0 text-muted-foreground"
								aria-hidden
							/>
						</Link>
					) : (
						<p className="text-sm font-medium text-foreground">{item.title}</p>
					)}
					<MoneyValues className="font-medium" amount={item.amount} />
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
		</div>
	);
}
