"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/ui";
import type { SplitAndSettlementSectionProps } from "./lancamento-dialog-types";

export function SplitAndSettlementSection({
	formState,
	onFieldChange,
	showSettledToggle,
}: SplitAndSettlementSectionProps) {
	return (
		<div className="flex w-full flex-col gap-2 md:flex-row">
			<div
				className={cn(
					"space-y-1",
					showSettledToggle ? "md:w-1/2 md:pr-2" : "md:w-full",
				)}
			>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-foreground">Dividir lançamento</p>
						<p className="text-xs text-muted-foreground">
							Selecione para atribuir parte do valor a outro pagador.
						</p>
					</div>
					<Checkbox
						checked={formState.isSplit}
						onCheckedChange={(checked) =>
							onFieldChange("isSplit", Boolean(checked))
						}
						aria-label="Dividir lançamento"
					/>
				</div>
			</div>

			{showSettledToggle ? (
				<div className="space-y-1 md:w-1/2 md:pr-2">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-foreground">Marcar como pago</p>
							<p className="text-xs text-muted-foreground">
								Indica que o lançamento já foi pago ou recebido.
							</p>
						</div>
						<Checkbox
							checked={Boolean(formState.isSettled)}
							onCheckedChange={(checked) =>
								onFieldChange("isSettled", Boolean(checked))
							}
							aria-label="Marcar como concluído"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
