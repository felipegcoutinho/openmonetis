import {
	type RemixiconComponentType,
	RiArrowLeftRightLine,
	RiArrowRightDownLine,
	RiArrowRightUpLine,
} from "@remixicon/react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/ui";

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
	Icon: RemixiconComponentType;
};

const BADGE_CONFIG: Record<FinancialKindKey, BadgeConfig> = {
	receita: {
		label: "Receita",
		className:
			"border-success/30 bg-success/5 text-success dark:saturate-90 dark:border-success/50 dark:bg-transparent",
		Icon: RiArrowRightDownLine,
	},
	despesa: {
		label: "Despesa",
		className:
			"border-destructive/30 bg-destructive/5 text-destructive dark:saturate-90 dark:border-destructive/50 dark:bg-transparent",
		Icon: RiArrowRightUpLine,
	},
	transferência: {
		label: "Transf.",
		className:
			"border-info/30 bg-info/5 text-info dark:saturate-90 dark:border-info/50 dark:bg-transparent",
		Icon: RiArrowLeftRightLine,
	},
	"saldo inicial": {
		label: "Saldo Inicial",
		className:
			"border-success/30 bg-success/5 text-success dark:saturate-90 dark:border-success/50 dark:bg-transparent",
		Icon: RiArrowRightDownLine,
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
	const Icon = config?.Icon;

	return (
		<Badge
			variant="outline"
			data-kind={normalizedKind ?? "custom"}
			className={cn(
				"h-6 gap-1 rounded-sm border px-2 py-0 text-xs font-medium shadow-xs",
				config?.className ??
					"border-muted-foreground/30 bg-muted/20 text-muted-foreground dark:bg-transparent",
				className,
			)}
		>
			{Icon ? <Icon className="size-3.5" /> : null}
			<span>{label}</span>
		</Badge>
	);
}
