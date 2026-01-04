"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { RiPieChartLine } from "@remixicon/react";
import type { CategoryChartData } from "@/lib/relatorios/fetch-category-chart-data";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { currencyFormatter } from "@/lib/lancamentos/formatting-helpers";
import { useMemo } from "react";

interface CategoryReportChartProps {
  data: CategoryChartData;
}

const CHART_COLORS = [
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
];

const MAX_CATEGORIES_IN_CHART = 15;

export function CategoryReportChart({ data }: CategoryReportChartProps) {
  const { chartData, categories } = data;

  // Check if there's no data
  if (categories.length === 0 || chartData.length === 0) {
    return (
      <EmptyState
        title="Nenhum dado disponível"
        description="Não há transações no período selecionado para as categorias filtradas."
        media={<RiPieChartLine className="h-12 w-12" />}
        mediaVariant="icon"
      />
    );
  }

  // Get top 10 categories by total spending
  const { topCategories, filteredChartData } = useMemo(() => {
    // Calculate total for each category across all periods
    const categoriesWithTotal = categories.map((category) => {
      const total = chartData.reduce((sum, dataPoint) => {
        const value = dataPoint[category.name];
        return sum + (typeof value === "number" ? value : 0);
      }, 0);

      return { ...category, total };
    });

    // Sort by total (descending) and take top 10
    const sorted = categoriesWithTotal
      .sort((a, b) => b.total - a.total)
      .slice(0, MAX_CATEGORIES_IN_CHART);

    // Filter chartData to include only top categories
    const topCategoryNames = new Set(sorted.map((cat) => cat.name));
    const filtered = chartData.map((dataPoint) => {
      const filteredPoint: { month: string; [key: string]: number | string } = {
        month: dataPoint.month,
      };

      // Only include data for top categories
      for (const cat of sorted) {
        if (dataPoint[cat.name] !== undefined) {
          filteredPoint[cat.name] = dataPoint[cat.name];
        }
      }

      return filteredPoint;
    });

    return { topCategories: sorted, filteredChartData: filtered };
  }, [categories, chartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução por Categoria - Top {topCategories.length}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredChartData}>
              <defs>
                {topCategories.map((category, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <linearGradient
                      key={category.id}
                      id={`gradient-${category.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }

                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <div className="mb-2 font-semibold">
                        {payload[0]?.payload?.month}
                      </div>
                      <div className="space-y-1">
                        {payload.map((entry, index) => {
                          if (entry.dataKey === "month") return null;

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-4 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">
                                  {entry.name}
                                </span>
                              </div>
                              <span className="font-medium">
                                {currencyFormatter.format(
                                  Number(entry.value) || 0
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              {topCategories.map((category, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <Area
                    key={category.id}
                    type="monotone"
                    dataKey={category.name}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#gradient-${category.id})`}
                    fillOpacity={1}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {topCategories.map((category, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            return (
              <div key={category.id} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-muted-foreground">
                  {category.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
