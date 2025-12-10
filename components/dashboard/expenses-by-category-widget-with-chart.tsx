"use client";

import MoneyValues from "@/components/money-values";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { ExpensesByCategoryData } from "@/lib/dashboard/categories/expenses-by-category";
import { getIconComponent } from "@/lib/utils/icons";
import { formatPeriodForUrl } from "@/lib/utils/period";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiExternalLinkLine,
  RiListUnordered,
  RiPieChart2Line,
  RiPieChartLine,
  RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Pie, PieChart, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { WidgetEmptyState } from "../widget-empty-state";

type ExpensesByCategoryWidgetWithChartProps = {
  data: ExpensesByCategoryData;
  period: string;
};

const buildInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CT";
  }
  if (parts.length === 1) {
    const firstPart = parts[0];
    return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CT";
  }
  const firstChar = parts[0]?.[0] ?? "";
  const secondChar = parts[1]?.[0] ?? "";
  return `${firstChar}${secondChar}`.toUpperCase() || "CT";
};

const formatPercentage = (value: number) => {
  return `${Math.abs(value).toFixed(0)}%`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function ExpensesByCategoryWidgetWithChart({
  data,
  period,
}: ExpensesByCategoryWidgetWithChartProps) {
  const [activeTab, setActiveTab] = useState<"list" | "chart">("list");
  const periodParam = formatPeriodForUrl(period);

  // Configuração do chart com cores do CSS
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-1)",
      "var(--chart-2)",
    ];

    if (data.categories.length <= 7) {
      data.categories.forEach((category, index) => {
        config[category.categoryId] = {
          label: category.categoryName,
          color: colors[index % colors.length],
        };
      });
    } else {
      // Top 7 + Outros
      const top7 = data.categories.slice(0, 7);
      top7.forEach((category, index) => {
        config[category.categoryId] = {
          label: category.categoryName,
          color: colors[index % colors.length],
        };
      });
      config["outros"] = {
        label: "Outros",
        color: "var(--chart-6)",
      };
    }

    return config;
  }, [data.categories]);

  // Preparar dados para o gráfico de pizza - Top 7 + Outros
  const chartData = useMemo(() => {
    if (data.categories.length <= 7) {
      return data.categories.map((category) => ({
        category: category.categoryId,
        name: category.categoryName,
        value: category.currentAmount,
        percentage: category.percentageOfTotal,
        fill: chartConfig[category.categoryId]?.color,
      }));
    }

    // Pegar top 7 categorias
    const top7 = data.categories.slice(0, 7);
    const others = data.categories.slice(7);

    // Somar o restante
    const othersTotal = others.reduce((sum, cat) => sum + cat.currentAmount, 0);
    const othersPercentage = others.reduce(
      (sum, cat) => sum + cat.percentageOfTotal,
      0
    );

    const top7Data = top7.map((category) => ({
      category: category.categoryId,
      name: category.categoryName,
      value: category.currentAmount,
      percentage: category.percentageOfTotal,
      fill: chartConfig[category.categoryId]?.color,
    }));

    // Adicionar "Outros" se houver
    if (others.length > 0) {
      top7Data.push({
        category: "outros",
        name: "Outros",
        value: othersTotal,
        percentage: othersPercentage,
        fill: chartConfig["outros"]?.color,
      });
    }

    return top7Data;
  }, [data.categories, chartConfig]);

  if (data.categories.length === 0) {
    return (
      <WidgetEmptyState
        icon={<RiPieChartLine className="size-6 text-muted-foreground" />}
        title="Nenhuma despesa encontrada"
        description="Quando houver despesas registradas, elas aparecerão aqui."
      />
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "list" | "chart")}
      className="w-full"
    >
      <div className="flex items-center justify-between">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="list" className="text-xs">
            <RiListUnordered className="size-3.5 mr-1" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">
            <RiPieChart2Line className="size-3.5 mr-1" />
            Gráfico
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="list" className="mt-0">
        <div className="flex flex-col px-0">
          {data.categories.map((category) => {
            const IconComponent = category.categoryIcon
              ? getIconComponent(category.categoryIcon)
              : null;
            const initials = buildInitials(category.categoryName);
            const hasIncrease =
              category.percentageChange !== null &&
              category.percentageChange > 0;
            const hasDecrease =
              category.percentageChange !== null &&
              category.percentageChange < 0;
            const hasBudget = category.budgetAmount !== null;
            const budgetExceeded =
              hasBudget &&
              category.budgetUsedPercentage !== null &&
              category.budgetUsedPercentage > 100;

            const exceededAmount =
              budgetExceeded && category.budgetAmount
                ? category.currentAmount - category.budgetAmount
                : 0;

            return (
              <div
                key={category.categoryId}
                className="flex flex-col py-2 border-b border-dashed last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {IconComponent ? (
                        <IconComponent className="size-4 text-foreground" />
                      ) : (
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/categorias/${category.categoryId}?periodo=${periodParam}`}
                          className="flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:underline"
                        >
                          <span className="truncate">
                            {category.categoryName}
                          </span>
                          <RiExternalLinkLine
                            className="size-3 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatPercentage(category.percentageOfTotal)} da
                          despesa total
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <MoneyValues
                      className="text-foreground"
                      amount={category.currentAmount}
                    />
                    {category.percentageChange !== null && (
                      <span
                        className={`flex items-center gap-0.5 text-xs ${
                          hasIncrease
                            ? "text-red-600 dark:text-red-500"
                            : hasDecrease
                            ? "text-green-600 dark:text-green-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {hasIncrease && <RiArrowUpLine className="size-3" />}
                        {hasDecrease && <RiArrowDownLine className="size-3" />}
                        {formatPercentage(category.percentageChange)}
                      </span>
                    )}
                  </div>
                </div>

                {hasBudget && category.budgetUsedPercentage !== null && (
                  <div className="ml-11 flex items-center gap-1.5 text-xs">
                    <RiWallet3Line
                      className={`size-3 ${
                        budgetExceeded
                          ? "text-red-600"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                    <span
                      className={
                        budgetExceeded
                          ? "text-red-600"
                          : "text-blue-600 dark:text-blue-400"
                      }
                    >
                      {budgetExceeded ? (
                        <>
                          {formatPercentage(category.budgetUsedPercentage)} do
                          limite - excedeu em {formatCurrency(exceededAmount)}
                        </>
                      ) : (
                        <>
                          {formatPercentage(category.budgetUsedPercentage)} do
                          limite
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="chart" className="mt-0">
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[280px] flex-1">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => formatPercentage(entry.percentage)}
                outerRadius={75}
                dataKey="value"
                nameKey="category"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {data.name}
                            </span>
                            <span className="font-bold text-foreground">
                              {formatCurrency(data.value)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatPercentage(data.percentage)} do total
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ChartContainer>

          <div className="flex flex-col gap-2 min-w-[140px]">
            {chartData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2">
                <div
                  className="size-3 rounded-sm shrink-0"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
