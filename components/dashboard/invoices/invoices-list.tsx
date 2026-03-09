import { RiBillLine } from "@remixicon/react";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import type { DashboardInvoice } from "@/lib/dashboard/invoices";
import { InvoiceListItem } from "./invoice-list-item";

type InvoicesListProps = {
	invoices: DashboardInvoice[];
	onPay: (invoiceId: string) => void;
};

export function InvoicesList({ invoices, onPay }: InvoicesListProps) {
	if (invoices.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiBillLine className="size-6 text-muted-foreground" />}
				title="Nenhuma fatura para o período selecionado"
				description="Quando houver cartões com compras registradas, eles aparecerão aqui."
			/>
		);
	}

	return (
		<ul className="flex flex-col">
			{invoices.map((invoice) => (
				<InvoiceListItem key={invoice.id} invoice={invoice} onPay={onPay} />
			))}
		</ul>
	);
}
