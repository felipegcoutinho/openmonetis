import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/ui";
import StatusDot from "./status-dot";

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
		? "text-info"
		: isReceita || isSaldoInicial
			? "text-success"
			: "text-destructive";

	const dotColor = isTransferencia
		? "bg-info"
		: isReceita || isSaldoInicial
			? "bg-success"
			: "bg-destructive";

	return (
		<Badge
			variant={"outline"}
			className={cn(
				"flex items-center gap-1 px-2 text-xs",
				colorClass,
				className,
			)}
		>
			<StatusDot color={dotColor} />
			{label}
		</Badge>
	);
}
