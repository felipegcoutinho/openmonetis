import { RiCheckLine, RiSlideshowLine } from "@remixicon/react";
import type { PaymentConditionsData } from "@/features/dashboard/payments/payment-conditions-queries";
import { getConditionIcon } from "@/shared/utils/icons";
import { formatPeriodForUrl } from "@/shared/utils/period";
import { slugify } from "@/shared/utils/string";
import {
	PaymentBreakdownList,
	type PaymentBreakdownListItemData,
} from "./payment-breakdown-list";

type PaymentConditionsWidgetProps = {
	data: PaymentConditionsData;
	period: string;
	adminPayerSlug: string | null;
};

const resolveConditionIcon = (condition: string) =>
	getConditionIcon(condition) ?? <RiCheckLine className="size-5" aria-hidden />;

export function PaymentConditionsWidget({
	data,
	period,
	adminPayerSlug,
}: PaymentConditionsWidgetProps) {
	const items: PaymentBreakdownListItemData[] = data.conditions.map(
		(condition) => {
			const params = new URLSearchParams({
				type: slugify("Despesa"),
				condition: slugify(condition.condition),
				periodo: formatPeriodForUrl(period),
			});
			if (adminPayerSlug) params.set("payer", adminPayerSlug);
			return {
				id: condition.condition,
				title: condition.condition,
				icon: resolveConditionIcon(condition.condition),
				amount: condition.amount,
				transactions: condition.transactions,
				percentage: condition.percentage,
				href: `/transactions?${params.toString()}`,
			};
		},
	);

	return (
		<PaymentBreakdownList
			items={items}
			emptyIcon={<RiSlideshowLine className="size-6 text-muted-foreground" />}
			emptyTitle="Nenhuma despesa encontrada"
			emptyDescription="As distribuições por condição aparecerão conforme novos lançamentos."
		/>
	);
}
