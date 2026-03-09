"use client";

import type { PaymentConditionsData } from "@/lib/dashboard/payments/payment-conditions";
import type { PaymentMethodsData } from "@/lib/dashboard/payments/payment-methods";
import { usePaymentOverviewWidgetController } from "@/lib/dashboard/use-payment-overview-widget-controller";
import { PaymentOverviewWidgetView } from "./payment-overview/payment-overview-widget-view";

type PaymentOverviewWidgetProps = {
	paymentConditionsData: PaymentConditionsData;
	paymentMethodsData: PaymentMethodsData;
};

export function PaymentOverviewWidget({
	paymentConditionsData,
	paymentMethodsData,
}: PaymentOverviewWidgetProps) {
	const { activeTab, handleTabChange } = usePaymentOverviewWidgetController();

	return (
		<PaymentOverviewWidgetView
			activeTab={activeTab}
			paymentConditionsData={paymentConditionsData}
			paymentMethodsData={paymentMethodsData}
			onTabChange={handleTabChange}
		/>
	);
}
