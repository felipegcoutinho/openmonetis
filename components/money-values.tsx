"use client";

import { cn } from "@/lib/utils/ui";
import { money_font } from "@/public/fonts/font_index";
import { usePrivacyMode } from "./privacy-provider";

type Props = {
  amount: number;
  className?: string;
  showPositiveSign?: boolean;
};

function MoneyValues({ amount, className, showPositiveSign = false }: Props) {
  const { privacyMode } = usePrivacyMode();

  const formattedValue = amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

  const displayValue = showPositiveSign && amount > 0
    ? `+${formattedValue}`
    : formattedValue;

  return (
    <span
      className={cn(
        money_font.className,
        "inline-flex items-baseline transition-all duration-200 tracking-tighter",
        privacyMode &&
          "blur-[6px] select-none hover:blur-none focus-within:blur-none",
        className
      )}
      aria-label={privacyMode ? "Valor oculto" : displayValue}
      data-privacy={privacyMode ? "hidden" : undefined}
      title={
        privacyMode ? "Valor oculto - passe o mouse para revelar" : undefined
      }
    >
      {displayValue}
    </span>
  );
}

export default MoneyValues;
