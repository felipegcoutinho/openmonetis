import type { CSSProperties } from "react";
import MoneyValues from "@/shared/components/money-values";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import type { PayerMonthlyBreakdown } from "@/shared/lib/payers/details";
import { cn } from "@/shared/utils/ui";

const segmentConfig = {
	card: {
		label: "Cartões",
		color: "bg-violet-500",
	},
	boleto: {
		label: "Boletos",
		color: "bg-amber-500",
	},
	instant: {
		label: "Pix/Débito/Dinheiro",
		color: "bg-emerald-500",
	},
} as const;

type PagadorMonthlySummaryCardProps = {
	periodLabel: string;
	breakdown: PayerMonthlyBreakdown;
};

export function PayerMonthlySummaryCard({
	periodLabel,
	breakdown,
}: PagadorMonthlySummaryCardProps) {
	const splittableEntries = (
		Object.keys(segmentConfig) as Array<keyof typeof segmentConfig>
	).map((key) => ({
		key,
		...segmentConfig[key],
		value: breakdown.paymentSplits[key],
	}));

	const totalBase = splittableEntries.reduce(
		(sum, entry) => sum + entry.value,
		0,
	);

	let offset = 0;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-1.5">
				<CardTitle className="text-lg font-semibold">Totais do mês</CardTitle>
				<p className="text-xs text-muted-foreground">
					{periodLabel} - Despesas por forma de pagamento
				</p>
			</CardHeader>

			<CardContent className="space-y-4 pt-0">
				<div className="space-y-2">
					<div>
						<span className="text-xs tracking-wide text-muted-foreground">
							Total
						</span>
						<MoneyValues
							amount={breakdown.totalExpenses}
							className="block text-2xl font-semibold text-foreground"
						/>
					</div>

					<div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
						{splittableEntries.map((entry) => {
							const percent =
								totalBase > 0
									? Math.max((entry.value / totalBase) * 100, 0)
									: 0;
							const style: CSSProperties = {
								width: `${percent}%`,
								left: `${offset}%`,
							};
							offset += percent;
							return (
								<span
									key={entry.key}
									className={cn(
										"absolute inset-y-0 rounded-full transition-all",
										entry.color,
									)}
									style={style}
								/>
							);
						})}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-3">
					{splittableEntries.map((entry) => {
						const percent =
							totalBase > 0 ? Math.round((entry.value / totalBase) * 100) : 0;
						return (
							<div key={entry.key} className="space-y-1 rounded-lg border p-3">
								<span className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground/70">
									<span
										className={cn("size-2 rounded-full", entry.color)}
										aria-hidden
									/>
									{entry.label}
								</span>
								<MoneyValues
									amount={entry.value}
									className="block text-lg font-semibold text-foreground"
								/>
								<span className="text-xs text-muted-foreground">
									{percent}% das despesas
								</span>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
