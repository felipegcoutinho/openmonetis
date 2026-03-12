import { RiBankCard2Line, RiMoneyDollarCircleLine } from "@remixicon/react";
import type { PaymentMethodsData } from "@/features/dashboard/payments/payment-methods-queries";
import { getPaymentMethodIcon } from "@/shared/utils/icons";
import {
	PaymentBreakdownList,
	type PaymentBreakdownListItemData,
} from "./payment-breakdown-list";

type PaymentMethodsWidgetProps = {
	data: PaymentMethodsData;
};

const resolvePaymentMethodIcon = (paymentMethod: string) =>
	getPaymentMethodIcon(paymentMethod) ?? (
		<RiBankCard2Line className="size-5" aria-hidden />
	);

export function PaymentMethodsWidget({ data }: PaymentMethodsWidgetProps) {
	const items: PaymentBreakdownListItemData[] = data.methods.map((method) => ({
		id: method.paymentMethod,
		title: method.paymentMethod,
		icon: resolvePaymentMethodIcon(method.paymentMethod),
		amount: method.amount,
		transactions: method.transactions,
		percentage: method.percentage,
	}));

	return (
		<PaymentBreakdownList
			items={items}
			emptyIcon={
				<RiMoneyDollarCircleLine className="size-6 text-muted-foreground" />
			}
			emptyTitle="Nenhuma despesa encontrada"
			emptyDescription="Cadastre despesas para visualizar a distribuição por forma de pagamento."
		/>
	);
}
