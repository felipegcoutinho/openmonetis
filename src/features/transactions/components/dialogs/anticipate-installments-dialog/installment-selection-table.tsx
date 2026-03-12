"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import type { EligibleInstallment } from "@/shared/lib/installments/anticipation-types";
import { formatCurrentInstallment } from "@/shared/lib/installments/utils";
import { formatShortPeriodLabel } from "@/shared/utils/period";
import { cn } from "@/shared/utils/ui";

interface InstallmentSelectionTableProps {
	installments: EligibleInstallment[];
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
}

export function InstallmentSelectionTable({
	installments,
	selectedIds,
	onSelectionChange,
}: InstallmentSelectionTableProps) {
	const toggleSelection = (id: string) => {
		const newSelection = selectedIds.includes(id)
			? selectedIds.filter((selectedId) => selectedId !== id)
			: [...selectedIds, id];
		onSelectionChange(newSelection);
	};

	const toggleAll = () => {
		if (selectedIds.length === installments.length && installments.length > 0) {
			onSelectionChange([]);
		} else {
			onSelectionChange(installments.map((inst) => inst.id));
		}
	};

	const formatDate = (date: Date | null) => {
		if (!date) return "—";
		return format(date, "dd/MM/yyyy", { locale: ptBR });
	};

	if (installments.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">
					Nenhuma parcela elegível para antecipação encontrada.
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Todas as parcelas desta compra já foram pagas ou antecipadas.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-12">
							<Checkbox
								checked={
									selectedIds.length === installments.length &&
									installments.length > 0
								}
								onCheckedChange={toggleAll}
								aria-label="Selecionar todas as parcelas"
							/>
						</TableHead>
						<TableHead>Parcela</TableHead>
						<TableHead>Período</TableHead>
						<TableHead>Vencimento</TableHead>
						<TableHead className="text-right">Valor</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{installments.map((inst) => {
						const isSelected = selectedIds.includes(inst.id);
						return (
							<TableRow
								key={inst.id}
								className={cn(
									"cursor-pointer transition-colors",
									isSelected && "bg-muted/50",
								)}
								onClick={() => toggleSelection(inst.id)}
							>
								<TableCell onClick={(e) => e.stopPropagation()}>
									<Checkbox
										checked={isSelected}
										onCheckedChange={() => toggleSelection(inst.id)}
										aria-label={`Selecionar parcela ${inst.currentInstallment}`}
									/>
								</TableCell>
								<TableCell>
									<Badge variant="outline">
										{formatCurrentInstallment(
											inst.currentInstallment ?? 0,
											inst.installmentCount ?? 0,
										)}
									</Badge>
								</TableCell>
								<TableCell className="font-medium">
									{formatShortPeriodLabel(inst.period)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{formatDate(inst.dueDate)}
								</TableCell>
								<TableCell className="text-right font-semibold tabular-nums">
									<MoneyValues amount={Number(inst.amount)} />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			{selectedIds.length > 0 && (
				<div className="border-t bg-muted/20 px-4 py-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{selectedIds.length}{" "}
							{selectedIds.length === 1
								? "parcela selecionada"
								: "parcelas selecionadas"}
						</span>
						<span className="font-semibold">
							Total:{" "}
							<MoneyValues
								amount={installments
									.filter((inst) => selectedIds.includes(inst.id))
									.reduce((sum, inst) => sum + Number(inst.amount), 0)}
							/>
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
