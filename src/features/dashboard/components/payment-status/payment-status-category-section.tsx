import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import StatusDot from "@/shared/components/feedback/status-dot";
import MoneyValues from "@/shared/components/money-values";
import { Progress } from "@/shared/components/ui/progress";
import { formatPercentage } from "@/shared/utils/percentage";

type PaymentStatusCategorySectionProps = {
	type: "income" | "expenses";
	total: number;
	confirmed: number;
	pending: number;
};

export function PaymentStatusCategorySection({
	type,
	total,
	confirmed,
	pending,
}: PaymentStatusCategorySectionProps) {
	const absTotal = Math.abs(total);
	const absConfirmed = Math.abs(confirmed);
	const confirmedPercentage =
		absTotal > 0 ? (absConfirmed / absTotal) * 100 : 0;
	const income = type === "income";
	const title = income ? "A receber" : "A pagar";
	const confirmedLabel = income ? "recebidos" : "pagos";
	const pendingLabel = income ? "a receber" : "a pagar";
	const percentageLabel = income ? "recebido" : "pago";
	const TitleIcon = income ? RiArrowDownLine : RiArrowUpLine;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
					<TitleIcon className="size-4 text-primary" aria-hidden />
					{title}
				</span>
				<span className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">
						{formatPercentage(confirmedPercentage, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 0,
						})}{" "}
						{percentageLabel}
					</span>
					<MoneyValues amount={total} className="font-medium" />
				</span>
			</div>

			<Progress
				value={confirmedPercentage}
				className="h-2"
				indicatorClassName="bg-primary"
			/>

			<div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<div className="flex items-center gap-1.5">
					<StatusDot color="bg-primary" />
					<MoneyValues amount={confirmed} className="font-medium" />
					<span className="text-xs text-muted-foreground">
						{confirmedLabel}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					<StatusDot color="bg-warning/40" />
					<MoneyValues amount={pending} className="font-medium" />
					<span className="text-xs text-muted-foreground">{pendingLabel}</span>
				</div>
			</div>
		</div>
	);
}
