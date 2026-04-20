import { RiBillLine } from "@remixicon/react";
import type { DashboardInvoice } from "@/features/dashboard/invoices/invoices-queries";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
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
