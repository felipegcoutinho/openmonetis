"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { minimax } from "vercel-minimax-ai-provider";
import { generateObject } from "ai";
import { getUser } from "@/shared/lib/auth/server";
import {
	type InsightsResponse,
	InsightsResponseSchema,
} from "@/shared/lib/schemas/insights";
import { AVAILABLE_MODELS, INSIGHTS_SYSTEM_PROMPT } from "../constants";
import { aggregateMonthData } from "./aggregate";
import type { ActionResult } from "./types";

const PERIOD_REGEX = /^\d{4}-\d{2}$/;

export async function generateInsightsAction(
	period: string,
	modelId: string,
): Promise<ActionResult<InsightsResponse>> {
  try {
    const user = await getUser();

    if (!PERIOD_REGEX.test(period)) {
      return {
        success: false,
        error: "Período inválido (formato esperado: YYYY-MM)",
      };
    }

    const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);
		const isOpenRouterFormat = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/.test(
			modelId,
		);
    if (!selectedModel && !isOpenRouterFormat) {
      return {
        success: false,
        error: "Modelo inválido.",
      };
    }

    const aggregatedData = await aggregateMonthData(user.id, period);

    let model: ReturnType<typeof google>;

    if (isOpenRouterFormat && !selectedModel) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return {
          success: false,
					error:
						"OPENROUTER_API_KEY não configurada. Adicione a chave no arquivo .env",
        };
      }

      const openrouter = createOpenRouter({
        apiKey,
      });
      model = openrouter.chat(modelId);
    } else if (selectedModel?.provider === "openai") {
      model = openai(modelId);
    } else if (selectedModel?.provider === "anthropic") {
      model = anthropic(modelId);
    } else if (selectedModel?.provider === "google") {
      model = google(modelId);
    } else if (selectedModel?.provider === "minimax") {
      model = minimax(modelId);
    } else {
      return {
        success: false,
        error: "Provider de modelo não suportado.",
      };
    }

    const result = await generateObject({
      model,
      schema: InsightsResponseSchema,
      system: INSIGHTS_SYSTEM_PROMPT,
      prompt: `Analise os seguintes dados financeiros agregados do período ${period}.

Dados agregados:
${JSON.stringify(aggregatedData, null, 2)}

DADOS IMPORTANTES PARA SUA ANÁLISE:

**Tendência de 3 meses:**
- Os dados incluem tendência dos últimos 3 meses (threeMonthTrend)
- Use isso para identificar padrões crescentes, decrescentes ou estáveis
- Compare o mês atual com a média dos 3 meses

**Análise de Recorrência:**
- Gastos recorrentes representam ${aggregatedData.recurringExpenses.percentageOfTotal.toFixed(1)}% das despesas
- ${aggregatedData.recurringExpenses.count} gastos identificados como recorrentes
- Use isso para avaliar previsibilidade e oportunidades de otimização

**Gastos Parcelados:**
- ${aggregatedData.installments.currentMonthInstallments} parcelas ativas no mês
- Comprometimento futuro de R$ ${aggregatedData.installments.futureCommitment.toFixed(2)}
- Use isso para alertas sobre comprometimento de renda futura

Organize suas observações nas 4 categories especificadas no prompt do sistema:
1. Comportamentos Observados (behaviors): 3-6 itens
2. Gatilhos de Consumo (triggers): 3-6 itens
3. Recomendações Práticas (recommendations): 3-6 itens
4. Melhorias Sugeridas (improvements): 3-6 itens

Cada item deve ser conciso, direto e acionável. Use os novos dados para dar contexto temporal e identificar padrões mais profundos.

Responda APENAS com um JSON válido seguindo exatamente o schema especificado.`,
    });

    const validatedData = InsightsResponseSchema.parse(result.object);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      success: false,
      error: "Erro ao gerar insights. Tente novamente.",
    };
  }
}
