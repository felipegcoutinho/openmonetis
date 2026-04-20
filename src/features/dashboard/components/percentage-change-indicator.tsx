import {
	RiArrowDownSFill,
	RiArrowUpSFill,
	RiSubtractLine,
} from "@remixicon/react";
import { formatPercentage } from "@/shared/utils/percentage";
import { cn } from "@/shared/utils/ui";

export type PercentageChangeTrend = "up" | "down" | "flat";

type PercentageChangeIndicatorProps = {
	value?: number | null;
	label?: string;
	trend?: PercentageChangeTrend;
	positiveTrend?: Exclude<PercentageChangeTrend, "flat">;
	showFlatIcon?: boolean;
	className?: string;
	iconClassName?: string;
};

export function PercentageChangeIndicator({
	value,
	label,
	trend,
	positiveTrend = "down",
	showFlatIcon = false,
	className,
	iconClassName,
}: PercentageChangeIndicatorProps) {
	const hasNumericValue = typeof value === "number" && Number.isFinite(value);
	const resolvedTrend =
		trend ??
		(hasNumericValue
			? value > 0
				? "up"
				: value < 0
					? "down"
					: "flat"
			: "flat");
	const resolvedLabel =
		label ?? (hasNumericValue ? formatPercentage(value) : null);

	if (!resolvedLabel) {
		return null;
	}

	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 text-xs font-medium",
				resolvedTrend === "flat"
					? "text-muted-foreground"
					: resolvedTrend === positiveTrend
						? "text-success"
						: "text-destructive",
				className,
			)}
		>
			{resolvedTrend === "up" ? (
				<RiArrowUpSFill className={cn("size-3", iconClassName)} />
			) : null}
			{resolvedTrend === "down" ? (
				<RiArrowDownSFill className={cn("size-3", iconClassName)} />
			) : null}
			{resolvedTrend === "flat" && showFlatIcon ? (
				<RiSubtractLine className={cn("size-3", iconClassName)} />
			) : null}
			{resolvedLabel}
		</span>
	);
}
