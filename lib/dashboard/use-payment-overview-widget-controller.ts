"use client";

import { useState } from "react";
import {
	DEFAULT_PAYMENT_OVERVIEW_TAB,
	type PaymentOverviewTab,
	parsePaymentOverviewTab,
} from "@/lib/dashboard/payment-overview-tabs";

export type PaymentOverviewWidgetController = {
	activeTab: PaymentOverviewTab;
	handleTabChange: (value: string) => void;
};

export function usePaymentOverviewWidgetController(): PaymentOverviewWidgetController {
	const [activeTab, setActiveTab] = useState<PaymentOverviewTab>(
		DEFAULT_PAYMENT_OVERVIEW_TAB,
	);

	const handleTabChange = (value: string) => {
		setActiveTab(parsePaymentOverviewTab(value));
	};

	return {
		activeTab,
		handleTabChange,
	};
}
