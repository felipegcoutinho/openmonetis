"use client";

import {
	RiPauseCircleLine,
	RiPlayCircleLine,
	RiRefreshLine,
	RiStopCircleLine,
} from "@remixicon/react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { RecurringSeriesData } from "@/features/dashboard/recurring/recurring-series-queries";
import {
	cancelRecurringSeriesAction,
	pauseRecurringSeriesAction,
	resumeRecurringSeriesAction,
} from "@/features/recurring/actions";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { WidgetEmptyState } from "@/shared/components/widget-empty-state";
import { formatMonthYearLabel } from "@/shared/utils/period";

type RecurringSeriesWidgetProps = {
	data: RecurringSeriesData;
};

export function RecurringSeriesWidget({ data }: RecurringSeriesWidgetProps) {
	const [isPending, startTransition] = useTransition();

	if (data.series.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiRefreshLine className="size-6 text-muted-foreground" />}
				title="Nenhuma série recorrente"
				description="Séries recorrentes aparecerão aqui quando forem criadas."
			/>
		);
	}

	const handlePause = (seriesId: string) => {
		startTransition(async () => {
			const result = await pauseRecurringSeriesAction({ seriesId });
			if (result.success) {
				toast.success(result.message);
			} else {
				toast.error(result.error);
			}
		});
	};

	const handleResume = (seriesId: string) => {
		startTransition(async () => {
			const result = await resumeRecurringSeriesAction({ seriesId });
			if (result.success) {
				toast.success(result.message);
			} else {
				toast.error(result.error);
			}
		});
	};

	const handleCancel = (seriesId: string) => {
		if (
			!confirm(
				"Tem certeza que deseja cancelar esta série recorrente? Lançamentos passados serão mantidos.",
			)
		) {
			return;
		}
		startTransition(async () => {
			const result = await cancelRecurringSeriesAction({ seriesId });
			if (result.success) {
				toast.success(result.message);
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<div className="flex flex-col gap-4 px-0">
			<ul className="flex flex-col gap-2">
				{data.series.map((item) => (
					<li
						key={item.id}
						className="flex items-center gap-3 border-b border-dashed pb-2 last:border-b-0 last:pb-0"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<p className="truncate text-foreground text-sm font-medium">
										{item.name}
									</p>
									<Badge
										variant={item.status === "active" ? "default" : "secondary"}
										className="shrink-0 text-[10px] px-1.5 py-0"
									>
										{item.status === "active" ? "Ativo" : "Pausado"}
									</Badge>
								</div>
								<MoneyValues amount={item.amount} />
							</div>

							<div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
								<span>
									Dia {item.dayOfMonth} · {item.paymentMethod}
									{item.categoryName ? ` · ${item.categoryName}` : ""}
								</span>
								<span>Próx: {formatMonthYearLabel(item.nextPeriod)}</span>
							</div>

							<div className="flex items-center gap-1 mt-1.5">
								{item.status === "active" ? (
									<Button
										variant="ghost"
										size="sm"
										className="h-6 px-2 text-xs"
										disabled={isPending}
										onClick={() => handlePause(item.id)}
									>
										<RiPauseCircleLine className="size-3.5 mr-1" />
										Pausar
									</Button>
								) : (
									<Button
										variant="ghost"
										size="sm"
										className="h-6 px-2 text-xs"
										disabled={isPending}
										onClick={() => handleResume(item.id)}
									>
										<RiPlayCircleLine className="size-3.5 mr-1" />
										Continuar
									</Button>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs text-destructive hover:text-destructive"
									disabled={isPending}
									onClick={() => handleCancel(item.id)}
								>
									<RiStopCircleLine className="size-3.5 mr-1" />
									Cancelar
								</Button>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
