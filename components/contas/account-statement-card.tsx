"use client";
import MoneyValues from "@/components/money-values";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/ui";
import { RiInformationLine } from "@remixicon/react";
import Image from "next/image";
import { useMemo, type ReactNode } from "react";

type DetailValue = string | number | ReactNode;

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

const resolveLogoPath = (logo?: string | null) => {
  if (!logo) return null;
  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://") ||
    logo.startsWith("data:")
  ) {
    return logo;
  }

  return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

const getAccountStatusBadgeVariant = (
  status: string
): "success" | "secondary" => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "ativa") {
    return "success";
  }
  return "outline";
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
  const logoPath = useMemo(() => resolveLogoPath(logo), [logo]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <Card className="border">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {logoPath ? (
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background">
              <Image
                src={logoPath}
                alt={`Logo da conta ${accountName}`}
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}

          <div className="flex w-full items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-foreground">
                {accountName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Extrato de {periodLabel}
              </p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 border-t border-border/60 border-dashed pt-4">
        {/* Composição do Saldo */}
        <div className="space-y-3">
          <DetailItem
            label="Saldo no início do período"
            value={<MoneyValues amount={openingBalance} className="text-2xl" />}
            tooltip="Saldo inicial cadastrado na conta somado aos lançamentos pagos anteriores a este mês."
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailItem
              label="Entradas"
              value={
                <span className="font-medium text-emerald-600">
                  {formatCurrency(totalIncomes)}
                </span>
              }
              tooltip="Total de receitas deste mês classificadas como pagas para esta conta."
            />
            <DetailItem
              label="Saídas"
              value={
                <span className="font-medium text-destructive">
                  {formatCurrency(totalExpenses)}
                </span>
              }
              tooltip="Total de despesas pagas neste mês (considerando divisão entre pagadores)."
            />

            <DetailItem
              label="Resultado do período"
              value={
                <MoneyValues
                  amount={totalIncomes - totalExpenses}
                  className={cn(
                    "font-semibold text-xl",
                    totalIncomes - totalExpenses >= 0
                      ? "text-emerald-600"
                      : "text-destructive"
                  )}
                />
              }
              tooltip="Diferença entre entradas e saídas do mês; positivo indica saldo crescente."
            />
          </div>

          {/* Saldo Atual - Destaque Principal */}
          <DetailItem
            label="Saldo ao final do período"
            value={<MoneyValues amount={currentBalance} className="text-2xl" />}
            tooltip="Saldo inicial do período + entradas - saídas realizadas neste mês."
          />
        </div>

        {/* Informações da Conta */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-border/60 border-dashed">
          <DetailItem
            label="Tipo da conta"
            value={accountType}
            tooltip="Classificação definida na criação da conta (corrente, poupança, etc.)."
          />
          <DetailItem
            label="Status da conta"
            value={
              <div className="flex items-center">
                <Badge
                  variant={getAccountStatusBadgeVariant(status)}
                  className="text-xs"
                >
                  {status}
                </Badge>
              </div>
            }
            tooltip="Indica se a conta está ativa para lançamentos ou foi desativada."
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
  className,
  tooltip,
}: {
  label: string;
  value: DetailValue;
  className?: string;
  tooltip?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <span className="flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground/80">
        {label}
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <RiInformationLine className="size-3.5 cursor-help text-muted-foreground/60" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-xs text-xs"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      <div className="text-base text-foreground">{value}</div>
    </div>
  );
}
