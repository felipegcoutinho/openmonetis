"use client";
import {
	RiArrowLeftRightLine,
	RiDeleteBin5Line,
	RiFileList2Line,
	RiInformationLine,
	RiPencilLine,
} from "@remixicon/react";
import type React from "react";
import { cn } from "@/lib/utils/ui";
import MoneyValues from "../money-values";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
		<Card className={cn("h-full w-full gap-0", className)}>
			<CardContent className="flex flex-1 flex-col gap-4">
				<div className="flex items-center gap-2">
					{icon ? (
						<div
							className={cn(
								"flex items-center justify-center",
								isInactive && "[&_img]:grayscale [&_img]:opacity-40",
							)}
						>
							{icon}
						</div>
					) : null}
					<h2 className="text-lg font-semibold text-foreground">
						{accountName}
					</h2>

					{(excludeFromBalance || excludeInitialBalanceFromIncome) && (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center">
									<RiInformationLine className="size-5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
								</div>
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-xs">
								<div className="space-y-1">
									{excludeFromBalance && (
										<p className="text-xs">
											<strong>Desconsiderado do saldo total:</strong> Esta conta
											não é incluída no cálculo do saldo total geral.
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
					)}
				</div>

				<div className="space-y-2">
					<MoneyValues amount={balance} className="text-3xl" />
					<p className="text-sm text-muted-foreground">{accountType}</p>
				</div>
			</CardContent>

			{actions.length > 0 ? (
				<CardFooter className="flex flex-wrap gap-3 px-6 pt-6 text-sm">
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
			) : null}
		</Card>
	);
}
