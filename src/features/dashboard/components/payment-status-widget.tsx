"use client";

import type { PaymentStatusData } from "@/features/dashboard/payments/payment-status-queries";
import { PaymentStatusWidgetView } from "./payment-status/payment-status-widget-view";

type PaymentStatusWidgetProps = {
	data: PaymentStatusData;
};

export function PaymentStatusWidget({ data }: PaymentStatusWidgetProps) {
	return <PaymentStatusWidgetView data={data} />;
}
