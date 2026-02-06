"use client";

import { RiCalendarCheckLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CardDetailData } from "@/lib/relatorios/cartoes-report";
import { cn } from "@/lib/utils";

type CardInvoiceStatusProps = {
	data: CardDetailData["invoiceStatus"];
};

const monthLabels = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
];

export function CardInvoiceStatus({ data }: CardInvoiceStatusProps) {
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const getStatusColor = (status: string | null) => {
		switch (status) {
			case "pago":
				return "bg-green-500";
			case "pendente":
				return "bg-yellow-500";
			case "atrasado":
				return "bg-red-500";
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

	const formatPeriodShort = (period: string) => {
		const [, month] = period.split("-");
		return monthLabels[parseInt(month, 10) - 1];
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
											{formatPeriodShort(invoice.period)}
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent side="top">
									<p className="font-medium">
										{formatCurrency(invoice.amount)}
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
