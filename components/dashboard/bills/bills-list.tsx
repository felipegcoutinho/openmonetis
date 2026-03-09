import { RiBarcodeFill } from "@remixicon/react";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import type { DashboardBill } from "@/lib/dashboard/bills";
import { BillListItem } from "./bill-list-item";

type BillsListProps = {
	bills: DashboardBill[];
	onPay: (billId: string) => void;
};

export function BillsList({ bills, onPay }: BillsListProps) {
	if (bills.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiBarcodeFill className="size-6 text-muted-foreground" />}
				title="Nenhum boleto cadastrado para o período selecionado"
				description="Cadastre boletos para monitorar os pagamentos aqui."
			/>
		);
	}

	return (
		<ul className="flex flex-col">
			{bills.map((bill) => (
				<BillListItem key={bill.id} bill={bill} onPay={onPay} />
			))}
		</ul>
	);
}
