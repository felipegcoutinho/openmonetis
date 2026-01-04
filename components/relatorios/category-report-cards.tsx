"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/type-badge";
import { getIconComponent } from "@/lib/utils/icons";
import { formatPeriodLabel, formatCurrency } from "@/lib/relatorios/utils";
import type { CategoryReportData } from "@/lib/relatorios/types";
import { CategoryCell } from "./category-cell";

interface CategoryReportCardsProps {
    data: CategoryReportData;
}

export function CategoryReportCards({ data }: CategoryReportCardsProps) {
    const { categories, periods } = data;

    return (
        <div className="md:hidden space-y-4">
            {categories.map((category) => {
                const Icon = category.icon ? getIconComponent(category.icon) : null;

                return (
                    <Card key={category.categoryId}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                                <span className="flex-1 truncate">{category.name}</span>
                                <TypeBadge type={category.type} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {periods.map((period, periodIndex) => {
                                const monthData = category.monthlyData.get(period);
                                const isFirstMonth = periodIndex === 0;

                                return (
                                    <div
                                        key={period}
                                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                                    >
                                        <span className="text-sm text-muted-foreground">
                                            {formatPeriodLabel(period)}
                                        </span>
                                        <CategoryCell
                                            value={monthData?.amount ?? 0}
                                            previousValue={monthData?.previousAmount ?? 0}
                                            categoryType={category.type}
                                            isFirstMonth={isFirstMonth}
                                        />
                                    </div>
                                );
                            })}
                            <div className="flex items-center justify-between pt-2 font-semibold">
                                <span>Total</span>
                                <span>{formatCurrency(category.total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
