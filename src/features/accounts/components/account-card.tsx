"use client";

import {
	RiArrowLeftRightLine,
	RiDeleteBin5Line,
	RiFileList2Line,
	RiInformationLine,
	RiPencilLine,
} from "@remixicon/react";
import type React from "react";
import MoneyValues from "@/shared/components/money-values";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/ui";

interface AccountCardProps {
	accountName: string;
	accountType: string;
	balance: number;
	status?: string;
	icon?: React.ReactNode;
	excludeFromBalance?: boolean;
	excludeInitialBalanceFromIncome?: boolean;
	onViewStatement?: () => void;
	onEdit?: () => void;
	onRemove?: () => void;
	onTransfer?: () => void;
	className?: string;
}

export function AccountCard({
	accountName,
	accountType,
	balance,
	status,
	icon,
	excludeFromBalance,
	excludeInitialBalanceFromIncome,
	onViewStatement,
	onEdit,
	onRemove,
	onTransfer,
	className,
}: AccountCardProps) {
	const isInactive = status?.toLowerCase() === "inativa";

	const balanceColor =
		balance > 0
			? "text-success"
			: balance < 0
				? "text-destructive"
				: "text-foreground";

	const actions = [
		{
			label: "editar",
			icon: <RiPencilLine className="size-4" aria-hidden />,
			onClick: onEdit,
			variant: "default" as const,
		},
		{
			label: "extrato",
			icon: <RiFileList2Line className="size-4" aria-hidden />,
			onClick: onViewStatement,
			variant: "default" as const,
		},
		{
			label: "transferir",
			icon: <RiArrowLeftRightLine className="size-4" aria-hidden />,
			onClick: onTransfer,
			variant: "default" as const,
		},
		{
			label: "remover",
			icon: <RiDeleteBin5Line className="size-4" aria-hidden />,
			onClick: onRemove,
			variant: "destructive" as const,
		},
	].filter((action) => typeof action.onClick === "function");

	return (
		<Card className={cn("flex w-full flex-col p-6", className)}>
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<div
						className={cn(
							"flex shrink-0 items-center justify-center",
							isInactive && "grayscale opacity-40",
						)}
					>
						{icon}
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-1">
							<h3 className="truncate font-semibold text-foreground">
								{accountName}
							</h3>
							{excludeFromBalance || excludeInitialBalanceFromIncome ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											className="shrink-0 text-muted-foreground/70 transition-colors hover:text-foreground"
											aria-label="Informações da conta"
										>
											<RiInformationLine className="size-3.5" />
										</button>
									</TooltipTrigger>
									<TooltipContent side="top" align="start" className="max-w-xs">
										<div className="space-y-1">
											{excludeFromBalance && (
												<p className="text-xs">
													<strong>Desconsiderado do saldo total:</strong> Esta
													conta não é incluída no cálculo do saldo total geral.
												</p>
											)}
											{excludeInitialBalanceFromIncome && (
												<p className="text-xs">
													<strong>
														Saldo inicial desconsiderado das receitas:
													</strong>{" "}
													O saldo inicial desta conta não é contabilizado como
													receita nas métricas.
												</p>
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							) : null}
						</div>

						<p className="text-xs text-muted-foreground">{status}</p>
					</div>
				</div>

				<p className="text-xs text-muted-foreground">{accountType}</p>
			</div>

			<CardContent className="flex flex-1 flex-col gap-2 px-0 pb-2">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Saldo</span>
					<MoneyValues
						amount={balance}
						className={cn("text-2xl font-semibold", balanceColor)}
					/>
				</div>
			</CardContent>

			<CardFooter className="flex flex-wrap gap-4 p-0 text-sm">
				{actions.map(({ label, icon, onClick, variant }) => (
					<button
						key={label}
						type="button"
						onClick={onClick}
						className={cn(
							"flex items-center gap-1 font-medium transition-opacity hover:opacity-80",
							variant === "destructive" ? "text-destructive" : "text-primary",
						)}
						aria-label={`${label} conta`}
					>
						{icon}
						{label}
					</button>
				))}
			</CardFooter>
		</Card>
	);
}
