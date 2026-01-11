import MoneyValues from "@/components/money-values";
import { WidgetEmptyState } from "@/components/widget-empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PagadorCardUsageItem } from "@/lib/pagadores/details";
import { RiBankCard2Line } from "@remixicon/react";
import Image from "next/image";

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

type PagadorCardUsageCardProps = {
  items: PagadorCardUsageItem[];
};

export function PagadorCardUsageCard({ items }: PagadorCardUsageCardProps) {
  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Cartões utilizados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Valores por cartão neste período (inclui logo quando disponível).
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        {items.length === 0 ? (
          <WidgetEmptyState
            icon={<RiBankCard2Line className="size-6 text-muted-foreground" />}
            title="Nenhum lançamento com cartão de crédito"
            description="Quando houver despesas registradas com cartão, elas aparecerão aqui."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const logoPath = resolveLogoPath(item.logo);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {logoPath ? (
                      <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background">
                        <Image
                          src={logoPath}
                          alt={`Logo ${item.name}`}
                          width={40}
                          height={40}
                          className="h-full w-full object-contain"
                        />
                      </span>
                    ) : (
                      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-xs font-semibold uppercase text-muted-foreground">
                        {item.name.slice(0, 2)}
                      </span>
                    )}

                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Despesas no mês
                      </span>
                    </div>
                  </div>
                  <MoneyValues
                    amount={item.amount}
                    className="text-lg font-semibold text-foreground"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
