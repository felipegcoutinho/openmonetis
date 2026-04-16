"use client";

import {
	RiBankCard2Line,
	RiCheckboxCircleFill,
	RiEyeLine,
	RiTimeLine,
} from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import { useState } from "react";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils";
import type { InstallmentGroup } from "./types";

type InstallmentGroupCardProps = {
	group: InstallmentGroup;
	selectedInstallments: Set<string>;
	onToggleGroup: () => void;
	onToggleInstallment: (installmentId: string) => void;
};

export function InstallmentGroupCard({
	group,
	selectedInstallments,
	onToggleGroup,
	onToggleInstallment,
}: InstallmentGroupCardProps) {
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const unpaidInstallments = group.pendingInstallments.filter(
		(i) => !i.isSettled,
	);
	const paidInstallments = group.pendingInstallments.filter((i) => i.isSettled);
	const unpaidCount = unpaidInstallments.length;

	const isFullySelected =
		selectedInstallments.size === unpaidInstallments.length &&
		unpaidInstallments.length > 0;

	const isPartiallySelected = selectedInstallments.size > 0 && !isFullySelected;

	const hasSelection = selectedInstallments.size > 0;

	const progress =
		group.totalInstallments > 0
			? (group.paidInstallments / group.totalInstallments) * 100
			: 0;

	const selectedAmount = group.pendingInstallments
		.filter((i) => selectedInstallments.has(i.id) && !i.isSettled)
		.reduce((sum, i) => sum + Number(i.amount), 0);

	const totalAmount = group.pendingInstallments.reduce(
		(sum, i) => sum + i.amount,
		0,
	);

	const pendingAmount = unpaidInstallments.reduce(
		(sum, i) => sum + i.amount,
		0,
	);

	return (
		<>
			<Card
				className={cn(
					"overflow-hidden transition-all duration-300",
					isFullySelected && "ring-2 ring-primary/30 border-primary/50",
					isPartiallySelected && "border-primary/30",
				)}
			>
				{/* Header Section */}
				<CardHeader className="pb-0">
					<div className="flex items-start gap-2">
						{/* Checkbox de seleção do grupo */}
						<div className="pt-1">
							<Checkbox
								checked={
									isFullySelected
										? true
										: isPartiallySelected
											? "indeterminate"
											: false
								}
								onCheckedChange={onToggleGroup}
								className="size-4"
								aria-label={`Selecionar todas as parcelas de ${group.name}`}
							/>
						</div>

						{/* Info principal */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-3 flex-wrap">
								{group.cartaoLogo ? (
									<Image
										src={`/logos/${group.cartaoLogo}`}
										alt={group.cartaoName ?? "Cartão"}
										width={40}
										height={40}
										className="size-10 rounded-full object-cover"
									/>
								) : (
									<div className="size-10 flex items-center justify-center">
										<RiBankCard2Line className="size-5 text-muted-foreground" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<CardTitle className="text-base truncate">
										{group.name}
									</CardTitle>
									<CardDescription className="text-xs">
										{group.cartaoName ?? "Compra parcelada"}
									</CardDescription>
								</div>
							</div>
						</div>

						{/* Badge de status */}
						<Badge
							variant={progress === 100 ? "default" : "outline"}
							className={cn("shrink-0", progress === 100 && "bg-success")}
						>
							{progress === 100 ? "Quitado" : `${Math.round(progress)}% pago`}
						</Badge>
					</div>
				</CardHeader>

				<CardContent>
					{/* Grid de valores */}
					<div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 mb-4">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-medium">
								Valor total
							</p>
							<MoneyValues
								amount={totalAmount}
								className="text-lg font-semibold text-foreground"
							/>
						</div>
						<div className="space-y-1 text-right">
							<p className="text-xs text-muted-foreground font-medium">
								Pendente
							</p>
							<MoneyValues
								amount={pendingAmount}
								className={cn(
									"text-lg font-semibold",
									pendingAmount > 0 ? "text-amber-600" : "text-success-600",
								)}
							/>
						</div>
					</div>

					{/* Barra de progresso */}
					<div className="space-y-2 mb-4">
						<div className="flex items-center justify-between text-xs">
							<div className="flex items-center gap-1 text-muted-foreground">
								<RiCheckboxCircleFill className="size-3.5 text-success" />
								<span>
									{group.paidInstallments} de {group.totalInstallments} parcelas
									pagas
								</span>
							</div>
							{unpaidCount > 0 && (
								<div className="flex items-center gap-1 text-muted-foreground">
									<RiTimeLine className="size-3.5 text-amber-600" />
									<span>
										{unpaidCount} {unpaidCount === 1 ? "pendente" : "pendentes"}
									</span>
								</div>
							)}
						</div>
						<Progress value={progress} className="h-2.5" />
					</div>

					{/* Valor selecionado */}
					{hasSelection && (
						<div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
							<span className="text-sm font-medium text-foreground">
								{selectedInstallments.size}{" "}
								{selectedInstallments.size === 1
									? "parcela selecionada"
									: "parcelas selecionadas"}
							</span>
							<MoneyValues
								amount={selectedAmount}
								className="text-base font-semibold text-primary"
							/>
						</div>
					)}

					{/* Botão para abrir detalhes */}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-full gap-1.5"
						onClick={() => setIsDetailsOpen(true)}
					>
						<RiEyeLine className="size-4" />
						Ver detalhes ({group.pendingInstallments.length} parcelas)
					</Button>
				</CardContent>
			</Card>

			{/* Modal de detalhes */}
			<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<DialogContent className="max-w-md max-h-[80vh] flex flex-col">
					<DialogHeader>
						<div className="flex items-center gap-3">
							{group.cartaoLogo ? (
								<img
									src={`/logos/${group.cartaoLogo}`}
									alt={group.cartaoName ?? "Cartão"}
									className="size-8 rounded-full object-cover"
								/>
							) : (
								<div className="size-8 rounded-full bg-muted flex items-center justify-center">
									<RiBankCard2Line className="size-4 text-muted-foreground" />
								</div>
							)}
							<DialogTitle className="text-base">{group.name}</DialogTitle>
						</div>
						<DialogDescription className="sr-only">
							Detalhes das parcelas do grupo {group.name}
						</DialogDescription>
					</DialogHeader>

					<div className="overflow-y-auto flex-1 space-y-4 pr-1">
						{/* Parcelas pagas */}
						{paidInstallments.length > 0 && (
							<div className="space-y-2">
								<p className="text-xs font-medium text-muted-foreground">
									Parcelas pagas
								</p>
								{paidInstallments.map((installment) => {
									const dueDate = installment.dueDate
										? format(installment.dueDate, "dd MMM yyyy", {
												locale: ptBR,
											})
										: format(installment.purchaseDate, "dd MMM yyyy", {
												locale: ptBR,
											});

									return (
										<div
											key={installment.id}
											className="flex items-center gap-3 p-3 rounded-lg bg-success/5 dark:bg-success/10 border border-success/20 dark:border-success/10"
										>
											<div className="size-8 rounded-full flex items-center justify-center shrink-0">
												<RiCheckboxCircleFill className="size-6 text-success" />
											</div>

											<div className="flex-1 min-w-0">
												<p className="text-sm text-success">
													Parcela {installment.currentInstallment}/
													{group.totalInstallments}
												</p>
												<p className="text-xs text-success/80">
													Vencimento: {dueDate}
												</p>
											</div>

											<MoneyValues
												amount={installment.amount}
												className="text-sm font-semibold text-success shrink-0"
											/>
										</div>
									);
								})}
							</div>
						)}

						{/* Parcelas pendentes */}
						{unpaidInstallments.length > 0 && (
							<div className="space-y-2">
								<p className="text-xs font-medium text-muted-foreground">
									Parcelas pendentes
								</p>
								{unpaidInstallments.map((installment) => {
									const isSelected = selectedInstallments.has(installment.id);
									const dueDate = installment.dueDate
										? format(installment.dueDate, "dd MMM yyyy", {
												locale: ptBR,
											})
										: format(installment.purchaseDate, "dd MMM yyyy", {
												locale: ptBR,
											});

									return (
										<label
											key={installment.id}
											className={cn(
												"flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
												isSelected
													? "bg-primary/5 border-primary/30 shadow-sm"
													: "bg-card hover:bg-muted/50 hover:border-border",
											)}
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() =>
													onToggleInstallment(installment.id)
												}
												className="size-5"
												aria-label={`Selecionar parcela ${installment.currentInstallment} de ${group.totalInstallments}`}
											/>

											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium">
													Parcela {installment.currentInstallment}/
													{group.totalInstallments}
												</p>
												<p className="text-xs text-muted-foreground flex items-center gap-1">
													<RiTimeLine className="size-3 text-amber-600" />
													Vencimento: {dueDate}
												</p>
											</div>

											<MoneyValues
												amount={installment.amount}
												className={cn(
													"text-sm font-semibold shrink-0",
													isSelected ? "text-primary" : "text-foreground",
												)}
											/>
										</label>
									);
								})}
							</div>
						)}
					</div>

					{/* Footer com resumo da seleção */}
					{hasSelection && (
						<div className="border-t pt-3 mt-1 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								{selectedInstallments.size}{" "}
								{selectedInstallments.size === 1
									? "parcela selecionada"
									: "parcelas selecionadas"}
							</span>
							<MoneyValues
								amount={selectedAmount}
								className="text-base font-bold text-primary"
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
