import { RiBankCard2Line, RiMoneyDollarCircleLine } from "@remixicon/react";
import type { PaymentMethodsData } from "@/features/dashboard/payments/payment-methods-queries";
import { getPaymentMethodIcon } from "@/shared/utils/icons";
import { formatPeriodForUrl } from "@/shared/utils/period";
import { slugify } from "@/shared/utils/string";
import {
	PaymentBreakdownList,
	type PaymentBreakdownListItemData,
} from "./payment-breakdown-list";

type PaymentMethodsWidgetProps = {
	data: PaymentMethodsData;
	period: string;
	adminPayerSlug: string | null;
};

const resolvePaymentMethodIcon = (paymentMethod: string) =>
	getPaymentMethodIcon(paymentMethod) ?? (
		<RiBankCard2Line className="size-5" aria-hidden />
	);

export function PaymentMethodsWidget({
	data,
	period,
	adminPayerSlug,
}: PaymentMethodsWidgetProps) {
	const items: PaymentBreakdownListItemData[] = data.methods.map((method) => {
		const params = new URLSearchParams({
			type: slugify("Despesa"),
			payment: slugify(method.paymentMethod),
			periodo: formatPeriodForUrl(period),
		});
		if (adminPayerSlug) params.set("payer", adminPayerSlug);
		return {
			id: method.paymentMethod,
			title: method.paymentMethod,
			icon: resolvePaymentMethodIcon(method.paymentMethod),
			amount: method.amount,
			transactions: method.transactions,
			percentage: method.percentage,
			href: `/transactions?${params.toString()}`,
		};
	});

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
