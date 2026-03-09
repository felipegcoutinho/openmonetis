import { RiWallet3Line } from "@remixicon/react";
import { CardContent } from "@/components/ui/card";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import type { PaymentStatusData } from "@/lib/dashboard/payments/payment-status";
import { PaymentStatusCategorySection } from "./payment-status-category-section";

type PaymentStatusWidgetViewProps = {
	data: PaymentStatusData;
};

export function PaymentStatusWidgetView({
	data,
}: PaymentStatusWidgetViewProps) {
	const isEmpty = data.income.total === 0 && data.expenses.total === 0;

	if (isEmpty) {
		return (
			<CardContent className="px-0">
				<WidgetEmptyState
					icon={<RiWallet3Line className="size-6 text-muted-foreground" />}
					title="Nenhum valor a receber ou pagar no período"
					description="Registre lançamentos para visualizar os valores confirmados e pendentes."
				/>
			</CardContent>
		);
	}

	return (
		<CardContent className="space-y-6 px-0">
			<PaymentStatusCategorySection
				title="A Receber"
				total={data.income.total}
				confirmed={data.income.confirmed}
				pending={data.income.pending}
			/>

			<div className="border-t border-dashed" />

			<PaymentStatusCategorySection
				title="A Pagar"
				total={data.expenses.total}
				confirmed={data.expenses.confirmed}
				pending={data.expenses.pending}
			/>
		</CardContent>
	);
}
