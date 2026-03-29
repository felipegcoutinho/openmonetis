import {
	RiBankCard2Line,
	RiBarChartBoxLine,
	RiCalendarLine,
	RiCheckLine,
	RiCodeSSlashLine,
	RiDatabase2Line,
	RiDeviceLine,
	RiDownloadCloudLine,
	RiErrorWarningLine,
	RiEyeOffLine,
	RiFileTextLine,
	RiFlashlightLine,
	RiGitBranchLine,
	RiLayoutGridLine,
	RiLineChartLine,
	RiLockLine,
	RiNotification3Line,
	RiPercentLine,
	RiPieChartLine,
	RiRobot2Line,
	RiShieldCheckLine,
	RiSmartphoneLine,
	RiStarLine,
	RiTeamLine,
	RiTimeLine,
	RiWalletLine,
} from "@remixicon/react";
import type { ComponentType } from "react";

export type FeatureItem = {
	icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
	title: string;
	description: string;
	colorVar: string;
};

export const navLinks = [
	{ href: "#telas", label: "conheça as telas" },
	{ href: "#funcionalidades", label: "funcionalidades" },
	{ href: "#mobile", label: "mobile" },
	{ href: "#stack", label: "stack" },
	{ href: "#como-usar", label: "como usar" },
	{ href: "#para-quem-e", label: "para quem é" },
] as const;

export const mainFeatures: FeatureItem[] = [
	{
		icon: RiWalletLine,
		title: "Contas e transações",
		description:
			"Registre suas contas bancárias, cartões e dinheiro. Adicione receitas, despesas e transferências. Organize por categorias. Extratos detalhados por conta.",
		colorVar: "var(--data-9)",
	},
	{
		icon: RiPercentLine,
		title: "Parcelamentos avançados",
		description:
			"Controle completo de compras parceladas. Antecipe parcelas com cálculo automático de desconto. Veja análise consolidada de todas as parcelas em aberto.",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiRobot2Line,
		title: "Insights com IA",
		description:
			"Análises financeiras geradas por IA (Claude, GPT, Gemini). Insights personalizados sobre seus padrões de gastos e recomendações inteligentes.",
		colorVar: "var(--data-8)",
	},
	{
		icon: RiBarChartBoxLine,
		title: "Relatórios e gráficos",
		description:
			"Dashboard com 20+ widgets interativos. Relatórios detalhados por categoria. Gráficos de evolução e comparativos. Exportação em PDF e Excel.",
		colorVar: "var(--data-5)",
	},
	{
		icon: RiBankCard2Line,
		title: "Faturas de cartão",
		description:
			"Cadastre seus cartões e acompanhe as faturas por período. Veja o que ainda não foi fechado. Controle limites, vencimentos e fechamentos.",
		colorVar: "var(--data-1)",
	},
	{
		icon: RiTeamLine,
		title: "Gestão colaborativa",
		description:
			"Compartilhe pagadores com permissões granulares (admin/viewer). Notificações automáticas por e-mail. Colabore em lançamentos compartilhados.",
		colorVar: "var(--data-3)",
	},
];

export const extraFeatures: FeatureItem[] = [
	{
		icon: RiPieChartLine,
		title: "Categorias e orçamentos",
		description:
			"Crie categorias personalizadas e defina orçamentos mensais com indicadores visuais.",
		colorVar: "var(--data-7)",
	},
	{
		icon: RiFileTextLine,
		title: "Anotações e tarefas",
		description:
			"Notas de texto e listas de tarefas com checkboxes. Arquivamento para manter histórico.",
		colorVar: "var(--data-6)",
	},
	{
		icon: RiCalendarLine,
		title: "Calendário financeiro",
		description:
			"Visualize transações em calendário mensal. Nunca perca prazos de pagamentos.",
		colorVar: "var(--data-2)",
	},
	{
		icon: RiDownloadCloudLine,
		title: "Importação em massa",
		description: "Lance múltiplos lançamentos de uma vez",
		colorVar: "var(--data-9)",
	},
	{
		icon: RiEyeOffLine,
		title: "Modo privacidade",
		description:
			"Oculte valores sensíveis com um clique. Tema dark/light. Calculadora integrada.",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiFlashlightLine,
		title: "Performance otimizada",
		description: "Sistema rápido e com alta performance",
		colorVar: "var(--data-5)",
	},
];

export const companionBanks = [
	{ name: "Nubank", logo: "/logos/nubank.png" },
	{ name: "Itaú", logo: "/logos/itau.png" },
	{ name: "Inter", logo: "/logos/intermedium.png" },
	{ name: "Mercado Pago", logo: "/logos/mercadopagocartao.png" },
];

export const pwaHighlights: FeatureItem[] = [
	{
		icon: RiSmartphoneLine,
		title: "Instale direto da web",
		description: "Adicione à tela inicial e abra como app, sem loja.",
		colorVar: "var(--data-3)",
	},
	{
		icon: RiLayoutGridLine,
		title: "Acesso rápido ao que importa",
		description: "Dashboard, inbox e lançamentos a um toque.",
		colorVar: "var(--data-9)",
	},
	{
		icon: RiFlashlightLine,
		title: "Experiência mobile mais direta",
		description: "Modo standalone com navegação limpa e fluida.",
		colorVar: "var(--data-4)",
	},
];

export const pwaCompatList = [
	{
		label: "Android",
		description:
			"Chrome e Edge — instale pelo banner ou pelo menu do navegador",
	},
	{
		label: "iOS / iPadOS",
		description: "Safari — adicione à tela inicial pelo menu compartilhar",
	},
	{
		label: "Desktop",
		description: "Chrome, Edge e outros — instale pela barra de endereço",
	},
] as const;

export const companionSteps: FeatureItem[] = [
	{
		icon: RiNotification3Line,
		title: "Notificação bancária chega",
		description: "O Companion intercepta automaticamente",
		colorVar: "var(--data-1)",
	},
	{
		icon: RiSmartphoneLine,
		title: "Dados extraídos e enviados",
		description: "Valor, descrição e banco são identificados",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiCheckLine,
		title: "Revise e confirme no OpenMonetis",
		description: "Pré-lançamentos ficam na inbox para sua aprovação",
		colorVar: "var(--data-9)",
	},
];

export const stackItems = [
	{
		icon: RiCodeSSlashLine,
		title: "Frontend",
		subtitle: "Next.js, TypeScript, Tailwind CSS, shadcn/ui",
		description: "Interface moderna e responsiva com React 19 e App Router",
		colorVar: "var(--data-3)",
	},
	{
		icon: RiDatabase2Line,
		title: "Backend",
		subtitle: "PostgreSQL, Drizzle ORM, Better Auth",
		description: "Banco relacional robusto com type-safe ORM",
		colorVar: "var(--data-9)",
	},
	{
		icon: RiShieldCheckLine,
		title: "Segurança",
		subtitle: "Better Auth com OAuth (Google) e autenticação por email",
		description: "Sessões seguras e proteção de rotas por middleware",
		colorVar: "var(--data-1)",
	},
	{
		icon: RiDeviceLine,
		title: "Deploy",
		subtitle:
			"Docker com multi-stage build, health checks e volumes persistentes",
		description: "Fácil de rodar localmente ou em qualquer servidor",
		colorVar: "var(--data-5)",
	},
];

export const whoIsItForItems: FeatureItem[] = [
	{
		icon: RiTimeLine,
		title: "Tem disciplina de registrar gastos",
		description:
			"Não se importa em dedicar alguns minutos por dia ou semana para manter tudo atualizado",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiLockLine,
		title: "Quer controle total sobre seus dados",
		description:
			"Prefere hospedar seus próprios dados ao invés de depender de serviços terceiros",
		colorVar: "var(--data-9)",
	},
	{
		icon: RiLineChartLine,
		title: "Gosta de entender exatamente onde o dinheiro vai",
		description:
			"Quer visualizar padrões de gastos e tomar decisões informadas",
		colorVar: "var(--data-3)",
	},
	{
		icon: RiTimeLine,
		title: "Não é plug and play",
		description:
			"Você vai precisar configurar as coisas, conectar suas contas e ajustar o sistema para o seu jeito de usar.",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiShieldCheckLine,
		title: "Não é para qualquer um",
		description:
			"Não é uma empresa, não é um SaaS, não é uma plataforma. É um projeto pessoal.",
		colorVar: "var(--data-1)",
	},
	{
		icon: RiErrorWarningLine,
		title: "Não sou responsável por nada",
		description:
			"Não sou responsável por nada que aconteça com você ou com seus dados.",
		colorVar: "var(--data-9)",
	},
];

export function getMetricsItems(stars: number, forks: number) {
	return [
		{
			icon: RiLayoutGridLine,
			value: "20+",
			label: "Widgets no dashboard",
			colorVar: "var(--data-9)",
		},
		{
			icon: RiShieldCheckLine,
			value: "100%",
			label: "Self-hosted",
			colorVar: "var(--data-1)",
		},
		{
			icon: RiStarLine,
			value: `${stars}`,
			label: "Stars no GitHub",
			colorVar: "var(--data-4)",
		},
		{
			icon: RiGitBranchLine,
			value: `${forks}`,
			label: "Forks no GitHub",
			colorVar: "var(--data-3)",
		},
	];
}
