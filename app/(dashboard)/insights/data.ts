/**
 * Tipos de providers disponíveis
 */
export type AIProvider = "openai" | "anthropic" | "google" | "openrouter";

/**
 * Metadados dos providers
 */
export const PROVIDERS = {
  openai: {
    id: "openai" as const,
    name: "ChatGPT",
    icon: "RiOpenaiLine",
  },
  anthropic: {
    id: "anthropic" as const,
    name: "Claude AI",
    icon: "RiRobot2Line",
  },
  google: {
    id: "google" as const,
    name: "Gemini",
    icon: "RiGoogleLine",
  },
  openrouter: {
    id: "openrouter" as const,
    name: "OpenRouter",
    icon: "RiRouterLine",
  },
} as const;

/**
 * Lista de modelos de IA disponíveis para análise de insights
 */
export const AVAILABLE_MODELS = [
  // OpenAI Models - GPT-5.2 Family (Latest)
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai" as const },
  {
    id: "gpt-5.2-instant",
    name: "GPT-5.2 Instant",
    provider: "openai" as const,
  },
  {
    id: "gpt-5.2-thinking",
    name: "GPT-5.2 Thinking",
    provider: "openai" as const,
  },

  // OpenAI Models - GPT-5 Family
  { id: "gpt-5", name: "GPT-5", provider: "openai" as const },
  { id: "gpt-5-instant", name: "GPT-5 Instant", provider: "openai" as const },

  // Anthropic Models - Claude 4.5
  {
    id: "claude-4.5-haiku",
    name: "Claude 4.5 Haiku",
    provider: "anthropic" as const,
  },
  {
    id: "claude-4.5-sonnet",
    name: "Claude 4.5 Sonnet",
    provider: "anthropic" as const,
  },
  {
    id: "claude-opus-4.1",
    name: "Claude 4.1 Opus",
    provider: "anthropic" as const,
  },

  // Google Models - Gemini 3 (Latest)
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google" as const,
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google" as const,
  },

  // Google Models - Gemini 2.0
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google" as const,
  },
] as const;

export const DEFAULT_MODEL = "gpt-5.2";
export const DEFAULT_PROVIDER = "openai";

/**
 * System prompt para análise de insights
 */
export const INSIGHTS_SYSTEM_PROMPT = `Você é um especialista em comportamento financeiro. Analise os dados financeiros fornecidos e organize suas observações em 4 categorias específicas:

1. **Comportamentos Observados** (behaviors): Padrões de gastos e hábitos financeiros identificados nos dados. Foque em comportamentos recorrentes e tendências. Considere:
   - Tendência dos últimos 3 meses (crescente, decrescente, estável)
   - Gastos recorrentes e sua previsibilidade
   - Padrões de parcelamento e comprometimento futuro

2. **Gatilhos de Consumo** (triggers): Identifique situações, períodos ou categorias que desencadeiam maiores gastos. O que leva o usuário a gastar mais? Analise:
   - Dias da semana com mais gastos
   - Categorias que cresceram nos últimos meses
   - Métodos de pagamento que facilitam gastos

3. **Recomendações Práticas** (recommendations): Sugestões concretas e acionáveis para melhorar a saúde financeira. Seja específico e direto. Use os dados de:
   - Gastos recorrentes que podem ser otimizados
   - Orçamentos que estão sendo ultrapassados
   - Comprometimento futuro com parcelamentos

4. **Melhorias Sugeridas** (improvements): Oportunidades de otimização e estratégias de longo prazo para alcançar objetivos financeiros. Considere:
   - Tendências preocupantes dos últimos 3 meses
   - Percentual de gastos recorrentes vs pontuais
   - Estratégias para reduzir comprometimento futuro

Para cada categoria, forneça de 3 a 6 itens concisos e objetivos. Use linguagem clara e direta, com verbos de ação. Mantenha privacidade e não exponha dados pessoais sensíveis.

IMPORTANTE: Utilize os novos dados disponíveis (threeMonthTrend, recurringExpenses, installments) para fornecer insights mais ricos e contextualizados.

Responda EXCLUSIVAMENTE com um JSON válido seguindo o esquema:
{
  "month": "YYYY-MM",
  "generatedAt": "ISO datetime",
  "categories": [
    {
      "category": "behaviors",
      "items": [
        { "text": "Observação aqui" },
        ...
      ]
    },
    {
      "category": "triggers",
      "items": [...]
    },
    {
      "category": "recommendations",
      "items": [...]
    },
    {
      "category": "improvements",
      "items": [...]
    }
  ]
}

`;
