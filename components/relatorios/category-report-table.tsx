"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CategoryReportData } from "@/lib/relatorios/types";
import { formatCurrency, formatPeriodLabel } from "@/lib/relatorios/utils";
import { getIconComponent } from "@/lib/utils/icons";
import DotIcon from "../dot-icon";
import { Card } from "../ui/card";
import { CategoryCell } from "./category-cell";

interface CategoryReportTableProps {
  data: CategoryReportData;
}

export function CategoryReportTable({ data }: CategoryReportTableProps) {
  const { categories, periods, totals, grandTotal } = data;

  return (
    <Card className="px-6 py-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px] min-w-[280px] font-bold">
              Categoria
            </TableHead>
            {periods.map((period) => (
              <TableHead
                key={period}
                className="text-right min-w-[120px] font-bold"
              >
                {formatPeriodLabel(period)}
              </TableHead>
            ))}
            <TableHead className="text-right min-w-[120px] font-bold">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {categories.map((category) => {
            const Icon = category.icon ? getIconComponent(category.icon) : null;
            const isReceita = category.type.toLowerCase() === "receita";
            const dotColor = isReceita
              ? "bg-green-600 dark:bg-green-400"
              : "bg-red-600 dark:bg-red-400";

            return (
              <TableRow key={category.categoryId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DotIcon bg_dot={dotColor} />
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="font-bold truncate">{category.name}</span>
                  </div>
                </TableCell>
                {periods.map((period, periodIndex) => {
                  const monthData = category.monthlyData.get(period);
                  const isFirstMonth = periodIndex === 0;

                  return (
                    <TableCell key={period} className="text-right">
                      <CategoryCell
                        value={monthData?.amount ?? 0}
                        previousValue={monthData?.previousAmount ?? 0}
                        categoryType={category.type}
                        isFirstMonth={isFirstMonth}
                      />
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(category.total)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell className="min-h-[2.5rem]">Total Geral</TableCell>
            {periods.map((period) => {
              const periodTotal = totals.get(period) ?? 0;
              return (
                <TableCell
                  key={period}
                  className="text-right font-semibold min-h-8"
                >
                  {formatCurrency(periodTotal)}
                </TableCell>
              );
            })}
            <TableCell className="text-right font-semibold min-h-8">
              {formatCurrency(grandTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}
