"use client";

import { RiCalendarCheckLine, RiLoader4Line } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getInstallmentAnticipationsAction } from "@/app/(dashboard)/lancamentos/anticipation-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { useControlledState } from "@/hooks/use-controlled-state";
import type { InstallmentAnticipationWithRelations } from "@/lib/installments/anticipation-types";
import { AnticipationCard } from "../../shared/anticipation-card";

interface AnticipationHistoryDialogProps {
	trigger?: React.ReactNode;
	seriesId: string;
	lancamentoName: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onViewLancamento?: (lancamentoId: string) => void;
}

export function AnticipationHistoryDialog({
	trigger,
	seriesId,
	lancamentoName,
	open,
	onOpenChange,
	onViewLancamento,
}: AnticipationHistoryDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [anticipations, setAnticipations] = useState<
		InstallmentAnticipationWithRelations[]
	>([]);

	// Use controlled state hook for dialog open state
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	// Define loadAnticipations before it's used in useEffect
	const loadAnticipations = useCallback(async () => {
		setIsLoading(true);

		try {
			const result = await getInstallmentAnticipationsAction(seriesId);

			if (!result.success) {
				toast.error(
					result.error || "Erro ao carregar histórico de antecipações",
				);
				setAnticipations([]);
				return;
			}

			setAnticipations(result.data ?? []);
		} catch (error) {
			console.error("Erro ao buscar antecipações:", error);
			toast.error("Erro ao carregar histórico de antecipações");
			setAnticipations([]);
		} finally {
			setIsLoading(false);
		}
	}, [seriesId]);

	// Buscar antecipações ao abrir o dialog
	useEffect(() => {
		if (dialogOpen) {
			loadAnticipations();
		}
	}, [dialogOpen, loadAnticipations]);

	const handleCanceled = () => {
		// Recarregar lista após cancelamento
		loadAnticipations();
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="max-w-3xl px-6 py-5 sm:px-8 sm:py-6">
				<DialogHeader>
					<DialogTitle>Histórico de Antecipações</DialogTitle>
					<DialogDescription>{lancamentoName}</DialogDescription>
				</DialogHeader>

				<div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
					{isLoading ? (
						<div className="flex items-center justify-center rounded-lg border border-dashed p-12">
							<RiLoader4Line className="size-6 animate-spin text-muted-foreground" />
							<span className="ml-2 text-sm text-muted-foreground">
								Carregando histórico...
							</span>
						</div>
					) : anticipations.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<RiCalendarCheckLine className="size-6 text-muted-foreground" />
								</EmptyMedia>
								<EmptyTitle>Nenhuma antecipação registrada</EmptyTitle>
								<EmptyDescription>
									As antecipações realizadas para esta compra parcelada
									aparecerão aqui.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						anticipations.map((anticipation) => (
							<AnticipationCard
								key={anticipation.id}
								anticipation={anticipation}
								onViewLancamento={onViewLancamento}
								onCanceled={handleCanceled}
							/>
						))
					)}
				</div>

				{!isLoading && anticipations.length > 0 && (
					<div className="border-t pt-4 text-center text-sm text-muted-foreground">
						{anticipations.length}{" "}
						{anticipations.length === 1
							? "antecipação encontrada"
							: "antecipações encontradas"}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
