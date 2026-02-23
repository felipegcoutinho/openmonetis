"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type BulkActionScope = "current" | "future" | "all";

type BulkActionDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	actionType: "edit" | "delete";
	seriesType: "installment" | "recurring";
	currentNumber?: number;
	totalCount?: number;
	onConfirm: (scope: BulkActionScope) => void;
};

export function BulkActionDialog({
	open,
	onOpenChange,
	actionType,
	seriesType,
	currentNumber,
	totalCount,
	onConfirm,
}: BulkActionDialogProps) {
	const [scope, setScope] = useState<BulkActionScope>("current");

	const handleConfirm = () => {
		onConfirm(scope);
		onOpenChange(false);
	};

	const seriesLabel =
		seriesType === "installment" ? "parcelado" : "recorrente";
	const actionLabel = actionType === "edit" ? "Editar" : "Remover";

	const getDescription = () => {
		if (seriesType === "installment" && currentNumber && totalCount) {
			return `Este lançamento faz parte de um parcelamento (${currentNumber}/${totalCount}). Escolha o que deseja ${actionLabel.toLowerCase()}:`;
		}
		if (seriesType === "recurring" && currentNumber && totalCount) {
			return `Este lançamento faz parte de uma recorrência (${currentNumber}/${totalCount}). Escolha o que deseja ${actionLabel.toLowerCase()}:`;
		}
		return `Este lançamento faz parte de um ${seriesLabel}. Escolha o que deseja ${actionLabel.toLowerCase()}:`;
	};

	const getCurrentLabel = () => {
		if (seriesType === "installment") {
			return "Apenas esta parcela";
		}
		return "Apenas esta dívida recorrente";
	};

	const getFutureLabel = () => {
		if (seriesType === "installment") {
			return "Esta e as próximas parcelas";
		}
		return "Esta e as próximas recorrentes";
	};

	const getAllLabel = () => {
		if (seriesType === "installment") {
			return "Todas as parcelas";
		}
		return "Todos os lançamentos recorrentes";
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{actionLabel} {seriesLabel}
					</DialogTitle>
					<DialogDescription>{getDescription()}</DialogDescription>
				</DialogHeader>

				<RadioGroup
					value={scope}
					onValueChange={(v) => setScope(v as BulkActionScope)}
				>
					<div className="space-y-4">
						<div className="flex items-start space-x-3">
							<RadioGroupItem value="current" id="current" className="mt-0.5" />
							<div className="flex-1">
								<Label
									htmlFor="current"
									className="text-sm cursor-pointer font-medium"
								>
									{getCurrentLabel()}
								</Label>
								<p className="text-xs text-muted-foreground">
									Aplica a alteração apenas neste lançamento
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3">
							<RadioGroupItem value="future" id="future" className="mt-0.5" />
							<div className="flex-1">
								<Label
									htmlFor="future"
									className="text-sm cursor-pointer font-medium"
								>
									{getFutureLabel()}
								</Label>
								<p className="text-xs text-muted-foreground">
									Aplica a alteração neste e nos próximos lançamentos da série
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3">
							<RadioGroupItem value="all" id="all" className="mt-0.5" />
							<div className="flex-1">
								<Label
									htmlFor="all"
									className="text-sm cursor-pointer font-medium"
								>
									{getAllLabel()}
								</Label>
								<p className="text-xs text-muted-foreground">
									Aplica a alteração em todos os lançamentos da série
								</p>
							</div>
						</div>
					</div>
				</RadioGroup>

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						variant={actionType === "delete" ? "destructive" : "default"}
					>
						Confirmar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
