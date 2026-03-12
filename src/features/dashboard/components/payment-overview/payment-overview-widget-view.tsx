import { RiMoneyDollarCircleLine, RiSlideshowLine } from "@remixicon/react";
import type { PaymentOverviewTab } from "@/features/dashboard/payment-overview-tabs";
import type { PaymentConditionsData } from "@/features/dashboard/payments/payment-conditions-queries";
import type { PaymentMethodsData } from "@/features/dashboard/payments/payment-methods-queries";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { PaymentConditionsWidget } from "./payment-conditions-widget";
import { PaymentMethodsWidget } from "./payment-methods-widget";

type PaymentOverviewWidgetViewProps = {
	activeTab: PaymentOverviewTab;
	paymentConditionsData: PaymentConditionsData;
	paymentMethodsData: PaymentMethodsData;
	onTabChange: (value: string) => void;
};

export function PaymentOverviewWidgetView({
	activeTab,
	paymentConditionsData,
	paymentMethodsData,
	onTabChange,
}: PaymentOverviewWidgetViewProps) {
	return (
		<Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
			<TabsList className="grid grid-cols-2">
				<TabsTrigger value="conditions" className="text-xs">
					<RiSlideshowLine className="mr-1 size-3.5" />
					Condições
				</TabsTrigger>
				<TabsTrigger value="methods" className="text-xs">
					<RiMoneyDollarCircleLine className="mr-1 size-3.5" />
					Formas
				</TabsTrigger>
			</TabsList>

			<TabsContent value="conditions" className="mt-2">
				<PaymentConditionsWidget data={paymentConditionsData} />
			</TabsContent>

			<TabsContent value="methods" className="mt-2">
				<PaymentMethodsWidget data={paymentMethodsData} />
			</TabsContent>
		</Tabs>
	);
}
