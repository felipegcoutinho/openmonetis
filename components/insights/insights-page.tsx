"use client";

import {
  deleteSavedInsightsAction,
  generateInsightsAction,
  loadSavedInsightsAction,
  saveInsightsAction,
} from "@/app/(dashboard)/insights/actions";
import { DEFAULT_MODEL } from "@/app/(dashboard)/insights/data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsightsResponse } from "@/lib/schemas/insights";
import {
  RiAlertLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiSparklingLine,
} from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "../empty-state";
import { InsightsGrid } from "./insights-grid";
import { ModelSelector } from "./model-selector";

interface InsightsPageProps {
  period: string;
  onAnalyze?: () => void;
}

export function InsightsPage({ period, onAnalyze }: InsightsPageProps) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDate, setSavedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar insights salvos ao montar o componente
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const result = await loadSavedInsightsAction(period);
        if (result.success && result.data) {
          setInsights(result.data.insights);
          setSelectedModel(result.data.modelId);
          setIsSaved(true);
          setSavedDate(result.data.createdAt);
        }
      } catch (err) {
        console.error("Error loading saved insights:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSaved();
  }, [period]);

  const handleAnalyze = () => {
    setError(null);
    setIsSaved(false);
    setSavedDate(null);
    onAnalyze?.();
    startTransition(async () => {
      try {
        const result = await generateInsightsAction(period, selectedModel);

        if (result.success) {
          setInsights(result.data);
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
          insights
        );

        if (result.success) {
          setIsSaved(true);
          setSavedDate(result.data.createdAt);
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
    startSaveTransition(async () => {
      try {
        const result = await deleteSavedInsightsAction(period);

        if (result.success) {
          setIsSaved(false);
          setSavedDate(null);
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
      <Alert className="border-none">
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
        onValueChange={setSelectedModel}
        disabled={isPending}
      />

      {/* Analyze Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleAnalyze}
          disabled={isPending || isLoading}
          className="bg-linear-to-r from-primary to-violet-500 dark:from-primary-dark dark:to-emerald-600"
        >
          <RiSparklingLine className="mr-2 size-5" aria-hidden="true" />
          {isPending ? "Analisando..." : "Gerar análise inteligente"}
        </Button>

        {insights && !error && (
          <Button
            onClick={isSaved ? handleDelete : handleSave}
            disabled={isSaving || isPending || isLoading}
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
        {(isPending || isLoading) && <LoadingState />}
        {!isPending && !isLoading && !insights && !error && (
          <Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
            <EmptyState
              media={<RiSparklingLine className="size-6 text-primary" />}
              title="Nenhuma análise realizada"
              description="Clique no botão acima para gerar insights inteligentes sobre seus
          dados financeiros do mês selecionado."
            />
          </Card>
        )}
        {!isPending && !isLoading && error && (
          <ErrorState error={error} onRetry={handleAnalyze} />
        )}
        {!isPending && !isLoading && insights && !error && (
          <InsightsGrid insights={insights} />
        )}
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
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-destructive">
          Erro ao gerar insights
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
      </div>
      <Button onClick={onRetry} variant="outline">
        Tentar novamente
      </Button>
    </div>
  );
}
