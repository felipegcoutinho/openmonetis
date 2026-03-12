"use client";

import { RiCalendarCheckLine } from "@remixicon/react";
import type { CardDetailData } from "@/features/reports/cards-report-queries";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { formatPeriodMonthShort } from "@/shared/utils/period";

type CardInvoiceStatusProps = {
	data: CardDetailData["invoiceStatus"];
};

export function CardInvoiceStatus({ data }: CardInvoiceStatusProps) {
	const getStatusColor = (status: string | null) => {
		switch (status) {
			case "pago":
				return "bg-success";
			case "pendente":
				return "bg-warning";
			case "atrasado":
				return "bg-destructive";
			default:
				return "bg-muted";
		}
	};

	const getStatusLabel = (status: string | null) => {
		switch (status) {
			case "pago":
				return "Pago";
			case "pendente":
				return "Pendente";
			case "atrasado":
				return "Atrasado";
			default:
				return "—";
		}
	};

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-1.5 text-base">
					<RiCalendarCheckLine className="size-4 text-primary" />
					Faturas
				</CardTitle>
			</CardHeader>
			<CardContent>
				<TooltipProvider>
					<div className="flex items-center gap-1">
						{data.map((invoice) => (
							<Tooltip key={invoice.period}>
								<TooltipTrigger asChild>
									<div className="flex-1 flex flex-col items-center gap-2 cursor-default">
										<div
											className={cn(
												"w-full h-2.5 rounded",
												getStatusColor(invoice.status),
											)}
										/>
										<span className="text-xs text-muted-foreground">
											{formatPeriodMonthShort(invoice.period)}
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent side="top">
									<p className="font-medium">
										{formatCurrency(invoice.amount, {
											maximumFractionDigits: 0,
											minimumFractionDigits: 0,
										})}
									</p>
									<p className="text-xs ">{getStatusLabel(invoice.status)}</p>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				</TooltipProvider>
			</CardContent>
		</Card>
	);
}
