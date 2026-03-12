import MoneyValues from "@/shared/components/money-values";
import StatusDot from "@/shared/components/status-dot";
import { Progress } from "@/shared/components/ui/progress";

type PaymentStatusCategorySectionProps = {
	title: string;
	total: number;
	confirmed: number;
	pending: number;
};

export function PaymentStatusCategorySection({
	title,
	total,
	confirmed,
	pending,
}: PaymentStatusCategorySectionProps) {
	const absTotal = Math.abs(total);
	const absConfirmed = Math.abs(confirmed);
	const confirmedPercentage =
		absTotal > 0 ? (absConfirmed / absTotal) * 100 : 0;

	return (
		<div className="mt-4 space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-foreground">{title}</span>
				<MoneyValues
					amount={total}
					className="text-sm font-medium tabular-nums"
				/>
			</div>

			<Progress value={confirmedPercentage} className="h-2" />

			<div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<div className="flex items-center gap-1.5">
					<StatusDot color="bg-primary" />
					<MoneyValues amount={confirmed} className="tabular-nums" />
					<span className="text-xs text-muted-foreground">confirmados</span>
				</div>

				<div className="flex items-center gap-1.5">
					<StatusDot color="bg-warning/40" />
					<MoneyValues amount={pending} className="tabular-nums" />
					<span className="text-xs text-muted-foreground">pendentes</span>
				</div>
			</div>
		</div>
	);
}
