"use client";

import { CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import type { IncomeExpenseBalanceData } from "@/lib/dashboard/income-expense-balance";
import { RiLineChartLine } from "@remixicon/react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

type IncomeExpenseBalanceWidgetProps = {
  data: IncomeExpenseBalanceData;
};

const chartConfig = {
  receita: {
    label: "Receita",
    color: "var(--chart-1)",
  },
  despesa: {
    label: "Despesa",
    color: "var(--chart-2)",
  },
  balanco: {
    label: "Balanço",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function IncomeExpenseBalanceWidget({
  data,
}: IncomeExpenseBalanceWidgetProps) {
  const chartData = data.months.map((month) => ({
    month: month.monthLabel,
    receita: month.income,
    despesa: month.expense,
    balanco: month.balance,
  }));

  // Verifica se todos os valores são zero
  const isEmpty = chartData.every(
    (item) => item.receita === 0 && item.despesa === 0 && item.balanco === 0
  );

  if (isEmpty) {
    return (
      <CardContent className="px-0">
        <WidgetEmptyState
          icon={<RiLineChartLine className="size-6 text-muted-foreground" />}
          title="Nenhuma movimentação financeira no período"
          description="Registre receitas e despesas para visualizar o balanço mensal."
        />
      </CardContent>
    );
  }

  return (
    <CardContent className="space-y-4 px-0">
      <ChartContainer
        config={chartConfig}
        className="h-[270px] w-full aspect-auto"
      >
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }

              const formatCurrency = (value: number) => {
                return new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(value);
              };

              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-2">
                    {payload.map((entry) => {
                      const config =
                        chartConfig[entry.dataKey as keyof typeof chartConfig];
                      const value = entry.value as number;

                      return (
                        <div
                          key={entry.dataKey}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: config?.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {config?.label}:
                          </span>
                          <span className="text-xs font-medium">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          />
          <Bar
            dataKey="receita"
            fill={chartConfig.receita.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            dataKey="despesa"
            fill={chartConfig.despesa.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Bar
            dataKey="balanco"
            fill={chartConfig.balanco.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ChartContainer>
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: chartConfig.receita.color }}
          />
          <span className="text-sm text-muted-foreground">
            {chartConfig.receita.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: chartConfig.despesa.color }}
          />
          <span className="text-sm text-muted-foreground">
            {chartConfig.despesa.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: chartConfig.balanco.color }}
          />
          <span className="text-sm text-muted-foreground">
            {chartConfig.balanco.label}
          </span>
        </div>
      </div>
    </CardContent>
  );
}
