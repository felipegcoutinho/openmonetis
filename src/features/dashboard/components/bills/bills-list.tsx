import { RiBarcodeFill } from "@remixicon/react";
import type { DashboardBill } from "@/features/dashboard/bills/bills-queries";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { BillListItem } from "./bill-list-item";

type BillsListProps = {
	bills: DashboardBill[];
	period?: string;
	onPay: (billId: string) => void;
};

export function BillsList({ bills, period, onPay }: BillsListProps) {
	if (bills.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiBarcodeFill className="size-6 text-muted-foreground" />}
				title="Nenhum boleto cadastrado para o período selecionado"
				description="Cadastre boletos para monitorar os vencimentos aqui."
			/>
		);
	}

	return (
		<ul className="flex flex-col">
			{bills.map((bill) => (
				<BillListItem key={bill.id} bill={bill} period={period} onPay={onPay} />
			))}
		</ul>
	);
}
