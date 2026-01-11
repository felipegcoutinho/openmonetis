import MoneyValues from "@/components/money-values";
import type { PaymentMethodsData } from "@/lib/dashboard/payments/payment-methods";
import { getPaymentMethodIcon } from "@/lib/utils/icons";
import { RiBankCard2Line, RiMoneyDollarCircleLine } from "@remixicon/react";
import { Progress } from "../ui/progress";
import { WidgetEmptyState } from "../widget-empty-state";

type PaymentMethodsWidgetProps = {
  data: PaymentMethodsData;
};

const ICON_WRAPPER_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground";

const formatPercentage = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);

const resolveIcon = (paymentMethod: string | null | undefined) => {
  if (!paymentMethod) {
    return <RiMoneyDollarCircleLine className="size-5" aria-hidden />;
  }

  const icon = getPaymentMethodIcon(paymentMethod);
  if (icon) {
    return icon;
  }

  return <RiBankCard2Line className="size-5" aria-hidden />;
};

export function PaymentMethodsWidget({ data }: PaymentMethodsWidgetProps) {
  if (data.methods.length === 0) {
    return (
      <WidgetEmptyState
        icon={
          <RiMoneyDollarCircleLine className="size-6 text-muted-foreground" />
        }
        title="Nenhuma despesa encontrada"
        description="Cadastre despesas para visualizar a distribuição por forma de pagamento."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-0">
      <ul className="flex flex-col gap-2">
        {data.methods.map((method) => {
          const icon = resolveIcon(method.paymentMethod);
          const percentageLabel = formatPercentage(method.percentage);

          return (
            <li
              key={method.paymentMethod}
              className="flex items-center gap-3 border-b border-dashed pb-3 last:border-b-0 last:pb-0"
            >
              <div className={ICON_WRAPPER_CLASS}>{icon}</div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground text-sm">
                    {method.paymentMethod}
                  </p>
                  <MoneyValues amount={method.amount} />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {method.transactions}{" "}
                    {method.transactions === 1 ? "lançamento" : "lançamentos"}
                  </span>
                  <span>{percentageLabel}%</span>
                </div>

                <div className="mt-1">
                  <Progress value={method.percentage} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
