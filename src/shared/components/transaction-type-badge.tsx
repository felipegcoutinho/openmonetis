import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/ui";
import StatusDot from "./status-dot";

type FinancialKind =
	| "receita"
	| "despesa"
	| "Receita"
	| "Despesa"
	| "Transferência"
	| "transferência"
	| "Saldo inicial"
	| "Saldo Inicial";

type FinancialKindKey =
	| "receita"
	| "despesa"
	| "transferência"
	| "saldo inicial";

type TransactionTypeBadgeProps = {
	kind: FinancialKind | string;
	className?: string;
};

type BadgeConfig = {
	label: string;
	className: string;
	dotClassName: string;
};

const BADGE_CONFIG: Record<FinancialKindKey, BadgeConfig> = {
	receita: {
		label: "Receita",
		className: "bg-success/10 text-success dark:bg-success/10",
		dotClassName: "bg-success/80",
	},
	despesa: {
		label: "Despesa",
		className: "bg-destructive/10 text-destructive dark:bg-destructive/10",
		dotClassName: "bg-destructive/80",
	},
	transferência: {
		label: "Transferência",
		className: "bg-info/10 text-info dark:bg-info/10",
		dotClassName: "bg-info/80",
	},
	"saldo inicial": {
		label: "Saldo Inicial",
		className: "bg-success/10 text-success dark:bg-success/10",
		dotClassName: "bg-success/80",
	},
};

function normalizeKind(value: string): FinancialKindKey | null {
	const normalizedValue = value.trim().toLowerCase();
	return normalizedValue in BADGE_CONFIG
		? (normalizedValue as FinancialKindKey)
		: null;
}

export function TransactionTypeBadge({
	kind,
	className,
}: TransactionTypeBadgeProps) {
	const normalizedKind = normalizeKind(kind);
	const config = normalizedKind ? BADGE_CONFIG[normalizedKind] : null;
	const label = config?.label ?? kind;

	return (
		<Badge
			variant="outline"
			data-kind={normalizedKind ?? "custom"}
			className={cn(
				"h-6 gap-1.5 rounded-full border-transparent px-2 py-0 text-xs font-medium shadow-none",
				config?.className ??
					"bg-muted/30 text-muted-foreground dark:bg-muted/20",
				className,
			)}
		>
			<StatusDot
				color={config?.dotClassName ?? "bg-muted-foreground/60"}
				className="size-1.5"
			/>
			<span>{label}</span>
		</Badge>
	);
}
