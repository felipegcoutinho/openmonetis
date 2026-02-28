"use client";

import {
	RiCheckboxCircleLine,
	RiHourglass2Line,
	RiWallet3Line,
} from "@remixicon/react";
import MoneyValues from "@/components/money-values";
import { CardContent } from "@/components/ui/card";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import type { PaymentStatusData } from "@/lib/dashboard/payments/payment-status";
import { Progress } from "../ui/progress";

type PaymentStatusWidgetProps = {
	data: PaymentStatusData;
};

type CategorySectionProps = {
	title: string;
	total: number;
	confirmed: number;
	pending: number;
};

function CategorySection({
	title,
	total,
	confirmed,
	pending,
}: CategorySectionProps) {
	// Usa valores absolutos para calcular percentual corretamente
	const absTotal = Math.abs(total);
	const absConfirmed = Math.abs(confirmed);
	const confirmedPercentage =
		absTotal > 0 ? (absConfirmed / absTotal) * 100 : 0;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-foreground">{title}</span>
				<MoneyValues
					amount={total}
					className="text-sm font-medium tabular-nums"
				/>
			</div>

			{/* Barra de progresso */}
			<Progress value={confirmedPercentage} className="h-2" />

			{/* Status de confirmados e pendentes */}
			<div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<div className="flex items-center gap-1.5">
					<RiCheckboxCircleLine className="size-3 shrink-0 text-success" />
					<MoneyValues amount={confirmed} className="tabular-nums" />
					<span className="text-xs text-muted-foreground">confirmados</span>
				</div>

				<div className="flex items-center gap-1.5">
					<RiHourglass2Line className="size-3 shrink-0 text-warning" />
					<MoneyValues amount={pending} className="tabular-nums" />
					<span className="text-xs text-muted-foreground">pendentes</span>
				</div>
			</div>
		</div>
	);
}

export function PaymentStatusWidget({ data }: PaymentStatusWidgetProps) {
	const isEmpty = data.income.total === 0 && data.expenses.total === 0;

	if (isEmpty) {
		return (
			<CardContent className="px-0">
				<WidgetEmptyState
					icon={<RiWallet3Line className="size-6 text-muted-foreground" />}
					title="Nenhum valor a receber ou pagar no período"
					description="Registre lançamentos para visualizar os valores confirmados e pendentes."
				/>
			</CardContent>
		);
	}

	return (
		<CardContent className="space-y-6 px-0">
			<CategorySection
				title="A Receber"
				total={data.income.total}
				confirmed={data.income.confirmed}
				pending={data.income.pending}
			/>

			{/* Linha divisória pontilhada */}
			<div className="border-t border-dashed" />

			<CategorySection
				title="A Pagar"
				total={data.expenses.total}
				confirmed={data.expenses.confirmed}
				pending={data.expenses.pending}
			/>
		</CardContent>
	);
}
