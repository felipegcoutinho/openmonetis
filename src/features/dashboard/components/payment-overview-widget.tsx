"use client";

import type { PaymentConditionsData } from "@/features/dashboard/payments/payment-conditions-queries";
import type { PaymentMethodsData } from "@/features/dashboard/payments/payment-methods-queries";
import { usePaymentOverviewWidgetController } from "@/features/dashboard/use-payment-overview-widget-controller";
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
