import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/ui";
import DotIcon from "./dot-icon";

type TypeBadgeType =
  | "receita"
  | "despesa"
  | "Receita"
  | "Despesa"
  | "Transferência"
  | "transferência"
  | "Saldo inicial"
  | "Saldo Inicial";

interface TypeBadgeProps {
  type: TypeBadgeType | string;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  Receita: "Receita",
  Despesa: "Despesa",
  Transferência: "Transferência",
  transferência: "Transferência",
  "Saldo inicial": "Saldo Inicial",
  "Saldo Inicial": "Saldo Inicial",
};

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const normalizedType = type.toLowerCase();
  const isReceita = normalizedType === "receita";
  const isTransferencia = normalizedType === "transferência";
  const isSaldoInicial = normalizedType === "saldo inicial";
  const label = TYPE_LABELS[type] || type;

  const colorClass = isTransferencia
    ? "text-blue-700 dark:text-blue-400"
    : isReceita || isSaldoInicial
    ? "text-green-700  dark:text-green-400"
    : "text-red-700 dark:text-red-400";

  const dotColor = isTransferencia
    ? "bg-blue-700 dark:bg-blue-400"
    : isReceita || isSaldoInicial
    ? "bg-green-600 dark:bg-green-400"
    : "bg-red-600 dark:bg-red-400";

  return (
    <Badge
      variant={"outline"}
      className={cn(
        "flex items-center gap-1 px-2 text-xs",
        colorClass,
        className
      )}
    >
      <DotIcon bg_dot={dotColor} />
      {label}
    </Badge>
  );
}
