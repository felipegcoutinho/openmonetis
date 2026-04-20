"use client";

import { RiInformationLine } from "@remixicon/react";
import Image from "next/image";
import type { ReactNode } from "react";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/ui";

type AccountStatementCardProps = {
	accountName: string;
	accountType: string;
	status: string;
	periodLabel: string;
	currentBalance: number;
	openingBalance: number;
	totalIncomes: number;
	totalExpenses: number;
	logo?: string | null;
	actions?: React.ReactNode;
};

const getAccountStatusBadgeVariant = (
	status: string,
): "success" | "outline" => {
	return status.toLowerCase() === "ativa" ? "success" : "outline";
};

export function AccountStatementCard({
	accountName,
	accountType,
	status,
	periodLabel,
	currentBalance,
	openingBalance,
	totalIncomes,
	totalExpenses,
	logo,
	actions,
}: AccountStatementCardProps) {
	const logoPath = resolveLogoSrc(logo);
	const resultado = totalIncomes - totalExpenses;

	return (
		<Card className="gap-0 py-0">
			<CardContent className="px-4 py-4 sm:px-5 sm:py-5">
				<div className="flex flex-col gap-4">
					{/* Linha 1 — identidade */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							{logoPath ? (
								<div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full">
									<Image
										src={logoPath}
										alt={`Logo ${accountName}`}
										width={42}
										height={42}
										className="h-full w-full object-contain"
									/>
								</div>
							) : null}
							<div className="min-w-0">
								<h2 className="truncate text-sm font-semibold text-foreground">
									{accountName}
								</h2>
								<p className="text-xs text-muted-foreground">
									Extrato de {periodLabel}
								</p>
							</div>
						</div>
						{actions ? <div className="shrink-0">{actions}</div> : null}
					</div>

					{/* Linha 2 — saldo final (hero) */}
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground ">
							Saldo ao final do período
						</p>
						<MoneyValues
							amount={currentBalance}
							className="text-3xl leading-none tracking-tighter sm:text-2xl"
						/>
						<div className="flex items-center gap-2">
							<Badge
								variant={getAccountStatusBadgeVariant(status)}
								className="text-xs"
							>
								{status}
							</Badge>
							<span className="text-xs text-muted-foreground">
								{accountType}
							</span>
						</div>
					</div>

					{/* Linha 3 — breakdown financeiro */}
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<MetaItem
							label="Saldo inicial"
							tooltip="Saldo inicial cadastrado na conta somado aos lançamentos pagos anteriores a este mês."
						>
							<span className="text-sm font-medium text-foreground">
								{formatCurrency(openingBalance)}
							</span>
						</MetaItem>

						<MetaItem
							label="Entradas"
							tooltip="Total de receitas deste mês classificadas como pagas para esta conta."
						>
							<span className="text-sm font-medium text-success">
								{formatCurrency(totalIncomes)}
							</span>
						</MetaItem>

						<MetaItem
							label="Saídas"
							tooltip="Total de despesas pagas neste mês (considerando divisão entre pessoas)."
						>
							<span className="text-sm font-medium text-destructive">
								{formatCurrency(totalExpenses)}
							</span>
						</MetaItem>

						<MetaItem
							label="Resultado"
							tooltip="Diferença entre entradas e saídas do mês; positivo indica saldo crescente."
						>
							<span
								className={cn(
									"text-sm font-medium",
									resultado >= 0 ? "text-success" : "text-destructive",
								)}
							>
								{resultado >= 0 ? "+" : ""}
								{formatCurrency(resultado)}
							</span>
						</MetaItem>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function MetaItem({
	label,
	tooltip,
	children,
}: {
	label: string;
	tooltip: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-md border border-border/60  px-3 py-2">
			<span className="flex items-center gap-1 text-sm font-medium text-muted-foreground ">
				{label}
				<Tooltip>
					<TooltipTrigger asChild>
						<RiInformationLine className="size-3 shrink-0 cursor-help text-muted-foreground/50" />
					</TooltipTrigger>
					<TooltipContent side="top" align="start" className="max-w-xs text-xs">
						{tooltip}
					</TooltipContent>
				</Tooltip>
			</span>
			<div className="mt-1">{children}</div>
		</div>
	);
}
