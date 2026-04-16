"use client";

import {
	RiAlertLine,
	RiDeleteBinLine,
	RiSaveLine,
	RiSparklingLine,
} from "@remixicon/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteSavedInsightsAction,
	generateInsightsAction,
	saveInsightsAction,
} from "@/features/insights/actions";
import { DEFAULT_MODEL } from "@/features/insights/constants";
import {
	savedInsightsQueryKey,
	useSavedInsights,
} from "@/features/insights/hooks/use-saved-insights";
import { EmptyState } from "@/shared/components/empty-state";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { InsightsResponse } from "@/shared/lib/schemas/insights";
import { InsightsGrid } from "./insights-grid";
import { ModelSelector } from "./model-selector";

interface InsightsPageProps {
	period: string;
	onAnalyze?: () => void;
}

export function InsightsPage({ period, onAnalyze }: InsightsPageProps) {
	const queryClient = useQueryClient();
	const savedInsightsQuery = useSavedInsights(period);
	const [isPending, startTransition] = useTransition();
	const [isSaving, startSaveTransition] = useTransition();
	const [draftInsights, setDraftInsights] = useState<InsightsResponse | null>(
		null,
	);
	const [selectedModelOverride, setSelectedModelOverride] = useState<
		string | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const savedInsights = savedInsightsQuery.data ?? null;
	const insights = draftInsights ?? savedInsights?.insights ?? null;
	const selectedModel =
		selectedModelOverride ?? savedInsights?.modelId ?? DEFAULT_MODEL;
	const isSaved = draftInsights === null && savedInsights !== null;
	const savedDate = isSaved ? (savedInsights?.createdAt ?? null) : null;
	const isLoadingSavedInsights =
		savedInsightsQuery.isLoading && draftInsights === null;
	const savedInsightsError =
		draftInsights === null && savedInsightsQuery.error instanceof Error
			? savedInsightsQuery.error.message
			: null;

	useEffect(() => {
		void period;
		setDraftInsights(null);
		setSelectedModelOverride(null);
		setError(null);
	}, [period]);

	const handleAnalyze = () => {
		setError(null);
		onAnalyze?.();
		startTransition(async () => {
			try {
				const result = await generateInsightsAction(period, selectedModel);

				if (result.success) {
					setDraftInsights(result.data);
					setSelectedModelOverride(selectedModel);
					toast.success("Insights gerados com sucesso!");
				} else {
					setError(result.error);
					toast.error(result.error);
				}
			} catch (err) {
				const errorMessage = "Erro inesperado ao gerar insights.";
				setError(errorMessage);
				toast.error(errorMessage);
				console.error("Error generating insights:", err);
			}
		});
	};

	const handleSave = () => {
		if (!insights) return;

		startSaveTransition(async () => {
			try {
				const result = await saveInsightsAction(
					period,
					selectedModel,
					insights,
				);

				if (result.success) {
					queryClient.setQueryData(savedInsightsQueryKey(period), {
						insights,
						modelId: selectedModel,
						createdAt: result.data.createdAt.toISOString(),
					});
					setDraftInsights(null);
					setSelectedModelOverride(null);
					toast.success("Análise salva com sucesso!");
				} else {
					toast.error(result.error);
				}
			} catch (err) {
				toast.error("Erro ao salvar análise.");
				console.error("Error saving insights:", err);
			}
		});
	};

	const handleDelete = () => {
		if (!insights) return;

		startSaveTransition(async () => {
			try {
				const result = await deleteSavedInsightsAction(period);

				if (result.success) {
					queryClient.setQueryData(savedInsightsQueryKey(period), null);
					setDraftInsights(insights);
					setSelectedModelOverride(selectedModel);
					toast.success("Análise removida com sucesso!");
				} else {
					toast.error(result.error);
				}
			} catch (err) {
				toast.error("Erro ao remover análise.");
				console.error("Error deleting insights:", err);
			}
		});
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Privacy Warning */}
			<Alert className="border-none bg-primary/15">
				<RiAlertLine className="size-4" color="red" />
				<AlertDescription className="text-sm text-card-foreground">
					<strong>Aviso de privacidade:</strong> Ao gerar insights, seus dados
					financeiros serão enviados para o provedor de IA selecionado
					(Anthropic, OpenAI, Google ou OpenRouter) para processamento.
					Certifique-se de que você confia no provedor escolhido antes de
					prosseguir.
				</AlertDescription>
			</Alert>

			{/* Model Selector */}
			<ModelSelector
				value={selectedModel}
				onValueChange={setSelectedModelOverride}
				disabled={isPending}
			/>

			{/* Analyze Button */}
			<div className="flex items-center gap-3 flex-wrap">
				<Button
					onClick={handleAnalyze}
					disabled={isPending || isLoadingSavedInsights}
					className="bg-linear-to-r from-primary via-violet-400 to-cyan-400 dark:from-primary-dark dark:to-cyan-600"
				>
					<RiSparklingLine className="mr-2 size-5" aria-hidden="true" />
					{isPending ? "Analisando..." : "Gerar análise inteligente"}
				</Button>

				{insights && !error && (
					<Button
						onClick={isSaved ? handleDelete : handleSave}
						disabled={isSaving || isPending || isLoadingSavedInsights}
						variant={isSaved ? "destructive" : "outline"}
					>
						{isSaved ? (
							<>
								<RiDeleteBinLine className="mr-2 size-4" />
								{isSaving ? "Removendo..." : "Remover análise"}
							</>
						) : (
							<>
								<RiSaveLine className="mr-2 size-4" />
								{isSaving ? "Salvando..." : "Salvar análise"}
							</>
						)}
					</Button>
				)}

				{isSaved && savedDate && (
					<span className="text-sm text-muted-foreground">
						Salva em{" "}
						{format(new Date(savedDate), "dd/MM/yyyy 'às' HH:mm", {
							locale: ptBR,
						})}
					</span>
				)}
			</div>

			{/* Content Area */}
			<div className="min-h-[400px]">
				{(isPending || isLoadingSavedInsights) && <LoadingState />}
				{!isPending &&
					!isLoadingSavedInsights &&
					!insights &&
					!error &&
					!savedInsightsError && (
						<Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
							<EmptyState
								media={<RiSparklingLine className="size-6 text-primary" />}
								title="Nenhuma análise realizada"
								description="Clique no botão acima para gerar insights inteligentes sobre seus
          dados financeiros do mês selecionado."
							/>
						</Card>
					)}
				{!isPending && !isLoadingSavedInsights && error && (
					<ErrorState
						title="Erro ao gerar insights"
						error={error}
						onRetry={handleAnalyze}
					/>
				)}
				{!isPending &&
					!isLoadingSavedInsights &&
					!error &&
					savedInsightsError && (
						<ErrorState
							title="Erro ao carregar insights salvos"
							error={savedInsightsError}
							onRetry={() => void savedInsightsQuery.refetch()}
						/>
					)}
				{!isPending &&
					!isLoadingSavedInsights &&
					insights &&
					!error &&
					!savedInsightsError && <InsightsGrid insights={insights} />}
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			{/* Intro text skeleton */}
			<div className="space-y-2 px-1">
				<Skeleton className="h-5 w-full max-w-2xl" />
				<Skeleton className="h-5 w-full max-w-md" />
			</div>

			{/* Grid de Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i} className="relative overflow-hidden">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Skeleton className="size-5 rounded" />
								<Skeleton className="h-5 w-32" />
							</div>
						</CardHeader>
						<CardContent>
							{Array.from({ length: 4 }).map((_, j) => (
								<div
									key={j}
									className="flex flex-1 border-b border-dashed py-2.5 gap-2 items-start last:border-0"
								>
									<Skeleton className="size-4 shrink-0 rounded" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-3/4" />
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

function ErrorState({
	title,
	error,
	onRetry,
}: {
	title: string;
	error: string;
	onRetry: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center">
			<div className="flex flex-col gap-2">
				<h3 className="text-lg font-semibold text-destructive">{title}</h3>
				<p className="text-sm text-muted-foreground max-w-md">{error}</p>
			</div>
			<Button onClick={onRetry} variant="outline">
				Tentar novamente
			</Button>
		</div>
	);
}
