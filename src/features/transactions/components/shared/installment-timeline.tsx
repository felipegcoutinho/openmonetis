import { RiArrowDownFill, RiCheckLine } from "@remixicon/react";
import {
	calculateLastInstallmentDate,
	formatCurrentInstallment,
	formatLastInstallmentDate,
	formatPurchaseDate,
} from "@/shared/lib/installments/utils";

type InstallmentTimelineProps = {
	purchaseDate: Date;
	currentInstallment: number;
	totalInstallments: number;
	period: string;
};

export function InstallmentTimeline({
	purchaseDate,
	currentInstallment,
	totalInstallments,
	period,
}: InstallmentTimelineProps) {
	const lastInstallmentDate = calculateLastInstallmentDate(
		period,
		currentInstallment,
		totalInstallments,
	);

	return (
		<div className="relative flex items-center justify-between px-4 py-4">
			{/* Linha de conexão */}
			<div className="absolute left-0 right-0 top-6 h-0.5 bg-border">
				<div
					className="h-full bg-success transition-all duration-300"
					style={{
						width: `${
							((currentInstallment - 1) / (totalInstallments - 1)) * 100
						}%`,
					}}
				/>
			</div>

			{/* Ponto 1: Data de Compra */}
			<div className="relative z-10 flex flex-col items-center gap-2">
				<div className="flex size-4 items-center justify-center rounded-full border-2 border-success bg-success shadow-sm">
					<RiCheckLine className="size-5 text-white" />
				</div>
				<div className="flex flex-col items-center">
					<span className="text-xs font-medium text-foreground">
						Data de Compra
					</span>
					<span className="text-xs text-muted-foreground">
						{formatPurchaseDate(purchaseDate)}
					</span>
				</div>
			</div>

			{/* Ponto 2: Parcela Atual */}
			<div className="relative z-10 flex flex-col items-center gap-2">
				<div
					className={`flex size-4 items-center justify-center rounded-full border-2 shadow-sm border-warning bg-warning`}
				>
					<RiArrowDownFill className="size-5 text-white" />
				</div>
				<div className="flex flex-col items-center">
					<span className="text-xs font-medium text-foreground">
						Parcela Atual
					</span>
					<span className="text-xs text-muted-foreground">
						{formatCurrentInstallment(currentInstallment, totalInstallments)}
					</span>
				</div>
			</div>

			{/* Ponto 3: Última Parcela */}
			<div className="relative z-10 flex flex-col items-center gap-2">
				<div
					className={`flex size-4 items-center justify-center rounded-full border-2 shadow-sm border-success bg-success`}
				>
					<RiCheckLine className="size-5 text-white" />
				</div>
				<div className="flex flex-col items-center">
					<span className="text-xs font-medium text-foreground">
						Última Parcela
					</span>
					<span className="text-xs text-muted-foreground">
						{formatLastInstallmentDate(lastInstallmentDate)}
					</span>
				</div>
			</div>
		</div>
	);
}
