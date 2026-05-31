import type { BillDialogState } from "@/features/dashboard/bills/bills-helpers";
import type {
	BillPaymentAccountOption,
	DashboardBill,
} from "@/features/dashboard/bills/bills-queries";
import { BillPaymentDialog } from "./bill-payment-dialog";
import { BillsList } from "./bills-list";

type BillsWidgetViewProps = {
	bills: DashboardBill[];
	period?: string;
	selectedBill: DashboardBill | null;
	isModalOpen: boolean;
	modalState: BillDialogState;
	isPending: boolean;
	paymentAccountId: string;
	onPaymentAccountChange: (accountId: string) => void;
	paymentDate: Date;
	onPaymentDateChange: (date: Date) => void;
	paymentAccountOptions: BillPaymentAccountOption[];
	onOpenPaymentDialog: (billId: string) => void;
	onClosePaymentDialog: () => void;
	onConfirmPayment: () => void;
};

export function BillsWidgetView({
	bills,
	period,
	selectedBill,
	isModalOpen,
	modalState,
	isPending,
	paymentAccountId,
	onPaymentAccountChange,
	paymentDate,
	onPaymentDateChange,
	paymentAccountOptions,
	onOpenPaymentDialog,
	onClosePaymentDialog,
	onConfirmPayment,
}: BillsWidgetViewProps) {
	return (
		<>
			<BillsList bills={bills} period={period} onPay={onOpenPaymentDialog} />

			<BillPaymentDialog
				bill={selectedBill}
				open={isModalOpen}
				modalState={modalState}
				isPending={isPending}
				paymentAccountId={paymentAccountId}
				onPaymentAccountChange={onPaymentAccountChange}
				paymentDate={paymentDate}
				onPaymentDateChange={onPaymentDateChange}
				paymentAccountOptions={paymentAccountOptions}
				onClose={onClosePaymentDialog}
				onConfirm={onConfirmPayment}
			/>
		</>
	);
}
