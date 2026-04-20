"use client";

import type { PaymentConditionsData } from "@/features/dashboard/payments/payment-conditions-queries";
import type { PaymentMethodsData } from "@/features/dashboard/payments/payment-methods-queries";
import { usePaymentOverviewWidgetController } from "@/features/dashboard/payments/use-payment-overview-widget-controller";
import { PaymentOverviewWidgetView } from "../payment-overview/payment-overview-widget-view";

type PaymentOverviewWidgetProps = {
	paymentConditionsData: PaymentConditionsData;
	paymentMethodsData: PaymentMethodsData;
	period: string;
	adminPayerSlug: string | null;
};

export function PaymentOverviewWidget({
	paymentConditionsData,
	paymentMethodsData,
	period,
	adminPayerSlug,
}: PaymentOverviewWidgetProps) {
	const { activeTab, handleTabChange } = usePaymentOverviewWidgetController();

	return (
		<PaymentOverviewWidgetView
			activeTab={activeTab}
			paymentConditionsData={paymentConditionsData}
			paymentMethodsData={paymentMethodsData}
			onTabChange={handleTabChange}
			period={period}
			adminPayerSlug={adminPayerSlug}
		/>
	);
}
