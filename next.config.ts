import dotenv from "dotenv";
import type { NextConfig } from "next";

// Carregar variáveis de ambiente explicitamente
dotenv.config();

const nextConfig: NextConfig = {
	output: "standalone",
	experimental: {
		turbopackFileSystemCacheForDev: true,
	},
	reactCompiler: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
	},
	devIndicators: {
		position: "bottom-right",
	},
	async redirects() {
		return [
			{ source: "/ajustes", destination: "/settings", permanent: true },
			{ source: "/anotacoes", destination: "/notes", permanent: true },
			{ source: "/calendario", destination: "/calendar", permanent: true },
			{ source: "/cartoes", destination: "/cards", permanent: true },
			{
				source: "/accounts/:accountId/extrato",
				destination: "/accounts/:accountId/statement",
				permanent: true,
			},
			{
				source: "/cartoes/:cartaoId/fatura",
				destination: "/cards/:cartaoId/invoice",
				permanent: true,
			},
			{
				source: "/cards/:cardId/fatura",
				destination: "/cards/:cardId/invoice",
				permanent: true,
			},
			{
				source: "/categorias/historico",
				destination: "/categories/history",
				permanent: true,
			},
			{
				source: "/categorias/:categoryId",
				destination: "/categories/:categoryId",
				permanent: true,
			},
			{ source: "/categorias", destination: "/categories", permanent: true },
			{ source: "/contas", destination: "/accounts", permanent: true },
			{
				source: "/contas/:contaId/extrato",
				destination: "/accounts/:contaId/statement",
				permanent: true,
			},
			{ source: "/lancamentos", destination: "/transactions", permanent: true },
			{ source: "/orcamentos", destination: "/budgets", permanent: true },
			{ source: "/pagadores", destination: "/payers", permanent: true },
			{
				source: "/pagadores/:pagadorId",
				destination: "/payers/:pagadorId",
				permanent: true,
			},
			{ source: "/pre-lancamentos", destination: "/inbox", permanent: true },
			{
				source: "/relatorios",
				destination: "/reports/category-trends",
				permanent: true,
			},
			{
				source: "/relatorios/analise-parcelas",
				destination: "/reports/installment-analysis",
				permanent: true,
			},
			{
				source: "/relatorios/estabelecimentos",
				destination: "/reports/establishments",
				permanent: true,
			},
			{
				source: "/relatorios/tendencias",
				destination: "/reports/category-trends",
				permanent: true,
			},
			{
				source: "/relatorios/uso-cartoes",
				destination: "/reports/card-usage",
				permanent: true,
			},
			{
				source: "/changelog",
				destination: "/settings/changelog",
				permanent: true,
			},
		];
	},
	// Headers for Safari compatibility
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Content-Security-Policy",
						value: "frame-ancestors 'none';",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
};

export default nextConfig;
