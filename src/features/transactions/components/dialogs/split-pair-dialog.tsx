"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";

export type SplitPairScope = "current" | "both";

type SplitPairDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (scope: SplitPairScope) => void;
};

export function SplitPairDialog({
	open,
	onOpenChange,
	onConfirm,
}: SplitPairDialogProps) {
	const [scope, setScope] = useState<SplitPairScope>("current");

	const handleConfirm = () => {
		onConfirm(scope);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Editar lançamento dividido</DialogTitle>
					<DialogDescription>
						Este lançamento está dividido com outra pessoa. Escolha o que deseja
						editar:
					</DialogDescription>
				</DialogHeader>

				<RadioGroup
					value={scope}
					onValueChange={(v) => setScope(v as SplitPairScope)}
				>
					<div className="space-y-4">
						<div className="flex items-start space-x-3">
							<RadioGroupItem
								value="current"
								id="split-current"
								className="mt-0.5"
							/>
							<div className="flex-1">
								<Label
									htmlFor="split-current"
									className="text-sm cursor-pointer font-medium"
								>
									Apenas este lançamento
								</Label>
								<p className="text-xs text-muted-foreground">
									Aplica a alteração somente neste lado da divisão
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3">
							<RadioGroupItem value="both" id="split-both" className="mt-0.5" />
							<div className="flex-1">
								<Label
									htmlFor="split-both"
									className="text-sm cursor-pointer font-medium"
								>
									Atualizar os dois lançamentos
								</Label>
								<p className="text-xs text-muted-foreground">
									Aplica nome, data, categoria e outros campos compartilhados
									nos dois lados da divisão
								</p>
							</div>
						</div>
					</div>
				</RadioGroup>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancelar
					</Button>
					<Button type="button" onClick={handleConfirm}>
						Confirmar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
