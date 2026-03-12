import type { BillDialogState } from "@/features/dashboard/bills-helpers";
import type { DashboardBill } from "@/features/dashboard/bills-queries";
import { BillPaymentDialog } from "./bill-payment-dialog";
import { BillsList } from "./bills-list";

type BillsWidgetViewProps = {
	bills: DashboardBill[];
	selectedBill: DashboardBill | null;
	isModalOpen: boolean;
	modalState: BillDialogState;
	isPending: boolean;
	onOpenPaymentDialog: (billId: string) => void;
	onClosePaymentDialog: () => void;
	onConfirmPayment: () => void;
};

export function BillsWidgetView({
	bills,
	selectedBill,
	isModalOpen,
	modalState,
	isPending,
	onOpenPaymentDialog,
	onClosePaymentDialog,
	onConfirmPayment,
}: BillsWidgetViewProps) {
	return (
		<>
			<div className="flex flex-col gap-4">
				<BillsList bills={bills} onPay={onOpenPaymentDialog} />
			</div>

			<BillPaymentDialog
				bill={selectedBill}
				open={isModalOpen}
				modalState={modalState}
				isPending={isPending}
				onClose={onClosePaymentDialog}
				onConfirm={onConfirmPayment}
			/>
		</>
	);
}
