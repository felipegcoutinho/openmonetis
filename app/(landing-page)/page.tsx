import {
	RiArrowRightSLine,
	RiBankCard2Line,
	RiBarChartBoxLine,
	RiCalendarLine,
	RiCodeSSlashLine,
	RiDatabase2Line,
	RiDeviceLine,
	RiDownloadCloudLine,
	RiEyeOffLine,
	RiFileTextLine,
	RiFlashlightLine,
	RiGithubFill,
	RiLineChartLine,
	RiLockLine,
	RiPercentLine,
	RiPieChartLine,
	RiRobot2Line,
	RiShieldCheckLine,
	RiTeamLine,
	RiTimeLine,
	RiWalletLine,
} from "@remixicon/react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOptionalUserSession } from "@/lib/auth/server";

export default async function Page() {
	const session = await getOptionalUserSession();
	const headersList = await headers();
	const hostname = headersList.get("host")?.replace(/:\d+$/, "");
	const publicDomain = process.env.PUBLIC_DOMAIN?.replace(
		/^https?:\/\//,
		"",
	).replace(/:\d+$/, "");
	const isPublicDomain = publicDomain && hostname === publicDomain;

	return (
		<div className="flex min-h-screen flex-col">
			{/* Navigation */}
			<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="container flex h-16 items-center justify-between">
					<div className="flex items-center">
						<Logo />
					</div>

					{/* Center Navigation Links */}
					<nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
						<a
							href="#funcionalidades"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Funcionalidades
						</a>
						<a
							href="#stack"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Stack
						</a>
						<a
							href="#como-usar"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Como usar
						</a>
					</nav>

					<nav className="flex items-center gap-2 md:gap-4">
						<AnimatedThemeToggler />
						{!isPublicDomain &&
							(session?.user ? (
								<Link prefetch href="/dashboard">
									<Button variant="outline" size="sm">
										Dashboard
									</Button>
								</Link>
							) : (
								<>
									<Link href="/login">
										<Button variant="ghost" size="sm">
											Entrar
										</Button>
									</Link>
									<Link href="/signup">
										<Button size="sm" className="gap-2">
											Começar
											<RiArrowRightSLine size={16} />
										</Button>
									</Link>
								</>
							))}
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative py-16 md:py-24 lg:py-32">
				<div className="container">
					<div className="mx-auto flex max-w-5xl flex-col items-center text-center gap-6">
						<Badge variant="primary" className="mb-2">
							<RiGithubFill size={14} className="mr-1" />
							Projeto Open Source
						</Badge>

						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
							Suas finanças,
							<span className="text-primary"> do seu jeito</span>
						</h1>

						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
							Um projeto pessoal de gestão financeira. Self-hosted, sem Open
							Finance, sem sincronização automática. Rode no seu computador ou
							servidor e tenha controle total sobre suas finanças.
						</p>

						<div className="rounded-lg border bg-muted/30 p-4 max-w-2xl">
							<p className="text-sm text-muted-foreground">
								<span className="font-semibold text-foreground">
									⚠️ Aviso importante:
								</span>{" "}
								Este sistema requer disciplina. Você precisa registrar
								manualmente cada transação. Se prefere algo automático, este
								projeto não é pra você.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 mt-4">
							<Link
								href="https://github.com/felipegcoutinho/openmonetis"
								target="_blank"
							>
								<Button size="lg" className="gap-2 w-full sm:w-auto">
									<RiGithubFill size={18} />
									Baixar no GitHub
								</Button>
							</Link>
							<Link
								href="https://github.com/felipegcoutinho/openmonetis#readme"
								target="_blank"
							>
								<Button
									size="lg"
									variant="outline"
									className="w-full sm:w-auto gap-2"
								>
									Ver Documentação
								</Button>
							</Link>
						</div>

						<div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<RiLockLine size={18} className="text-primary" />
								Seus dados, seu servidor
							</div>
							<div className="flex items-center gap-2">
								<RiGithubFill size={18} className="text-primary" />
								100% Open Source
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Dashboard Preview Section */}
			<section className="py-8 md:py-16">
				<div className="container">
					<div className="mx-auto max-w-6xl">
						<Image
							src="/dashboard-preview-light.png"
							alt="openmonetis Dashboard Preview"
							width={1920}
							height={1080}
							className="w-full h-auto dark:hidden"
							priority
						/>
						<Image
							src="/dashboard-preview-dark.png"
							alt="openmonetis Dashboard Preview"
							width={1920}
							height={1080}
							className="w-full h-auto hidden dark:block"
							priority
						/>
					</div>
				</div>
			</section>

			{/* What's Here Section */}
			<section id="funcionalidades" className="py-16 md:py-24 bg-muted/30">
				<div className="container">
					<div className="mx-auto max-w-5xl">
						<div className="text-center mb-12">
							<Badge variant="primary" className="mb-4">
								O que tem aqui
							</Badge>
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
								Funcionalidades que importam
							</h2>
							<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
								Ferramentas simples para organizar suas contas, cartões, gastos
								e receitas
							</p>
						</div>

						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiWalletLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Contas e transações
											</h3>
											<p className="text-sm text-muted-foreground">
												Registre suas contas bancárias, cartões e dinheiro.
												Adicione receitas, despesas e transferências. Organize
												por categorias. Extratos detalhados por conta.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiPercentLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Parcelamentos avançados
											</h3>
											<p className="text-sm text-muted-foreground">
												Controle completo de compras parceladas. Antecipe
												parcelas com cálculo automático de desconto. Veja
												análise consolidada de todas as parcelas em aberto.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiRobot2Line size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Insights com IA
											</h3>
											<p className="text-sm text-muted-foreground">
												Análises financeiras geradas por IA (Claude, GPT,
												Gemini). Insights personalizados sobre seus padrões de
												gastos e recomendações inteligentes.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiBarChartBoxLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Relatórios e gráficos
											</h3>
											<p className="text-sm text-muted-foreground">
												Dashboard com 20+ widgets interativos. Relatórios
												detalhados por categoria. Gráficos de evolução e
												comparativos. Exportação em PDF e Excel.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiBankCard2Line size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Faturas de cartão
											</h3>
											<p className="text-sm text-muted-foreground">
												Cadastre seus cartões e acompanhe as faturas por
												período. Veja o que ainda não foi fechado. Controle
												limites, vencimentos e fechamentos.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiTeamLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Gestão colaborativa
											</h3>
											<p className="text-sm text-muted-foreground">
												Compartilhe pagadores com permissões granulares (admin/
												viewer). Notificações automáticas por e-mail. Colabore
												em lançamentos compartilhados.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiPieChartLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Categorias e orçamentos
											</h3>
											<p className="text-sm text-muted-foreground">
												Crie categorias personalizadas. Defina orçamentos
												mensais e acompanhe o quanto gastou vs. planejado com
												indicadores visuais.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiFileTextLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Anotações e tarefas
											</h3>
											<p className="text-sm text-muted-foreground">
												Crie notas de texto e listas de tarefas com checkboxes.
												Sistema de arquivamento para manter histórico. Organize
												seus planejamentos financeiros.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiCalendarLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Calendário financeiro
											</h3>
											<p className="text-sm text-muted-foreground">
												Visualize todas as transações em calendário mensal.
												Navegação intuitiva por data. Nunca perca prazos de
												pagamentos importantes.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiDownloadCloudLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Importação em massa
											</h3>
											<p className="text-sm text-muted-foreground">
												Cole múltiplos lançamentos de uma vez. Economize tempo
												ao registrar várias transações. Formatação inteligente
												para facilitar a entrada de dados.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiEyeOffLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Modo privacidade
											</h3>
											<p className="text-sm text-muted-foreground">
												Oculte valores sensíveis com um clique. Tema dark/light
												adaptável. Preferências personalizáveis. Calculadora
												integrada para planejamento.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border hover:border-primary/50 transition-colors">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
											<RiFlashlightLine size={24} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg mb-2">
												Performance otimizada
											</h3>
											<p className="text-sm text-muted-foreground">
												Dashboard carrega em ~200-500ms com 18+ queries
												paralelas. Índices otimizados. Type-safe em toda
												codebase. Isolamento completo de dados por usuário.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Tech Stack Section */}
			<section id="stack" className="py-16 md:py-24">
				<div className="container">
					<div className="mx-auto max-w-5xl">
						<div className="text-center mb-12">
							<Badge variant="primary" className="mb-4">
								Stack técnica
							</Badge>
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
								Construído com tecnologias modernas
							</h2>
							<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
								Open source, self-hosted e fácil de customizar
							</p>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							<Card className="border">
								<CardContent>
									<div className="flex items-start gap-4">
										<RiCodeSSlashLine
											size={32}
											className="text-primary shrink-0"
										/>
										<div>
											<h3 className="font-semibold text-lg mb-2">Frontend</h3>
											<p className="text-sm text-muted-foreground mb-3">
												Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
											</p>
											<p className="text-xs text-muted-foreground">
												Interface moderna e responsiva com React 19 e App Router
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex items-start gap-4">
										<RiDatabase2Line
											size={32}
											className="text-primary shrink-0"
										/>
										<div>
											<h3 className="font-semibold text-lg mb-2">Backend</h3>
											<p className="text-sm text-muted-foreground mb-3">
												PostgreSQL 18, Drizzle ORM, Better Auth
											</p>
											<p className="text-xs text-muted-foreground">
												Banco relacional robusto com type-safe ORM
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex items-start gap-4">
										<RiShieldCheckLine
											size={32}
											className="text-primary shrink-0"
										/>
										<div>
											<h3 className="font-semibold text-lg mb-2">Segurança</h3>
											<p className="text-sm text-muted-foreground mb-3">
												Better Auth com OAuth (Google) e autenticação por email
											</p>
											<p className="text-xs text-muted-foreground">
												Sessões seguras e proteção de rotas por middleware
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex items-start gap-4">
										<RiDeviceLine size={32} className="text-primary shrink-0" />
										<div>
											<h3 className="font-semibold text-lg mb-2">Deploy</h3>
											<p className="text-sm text-muted-foreground mb-3">
												Docker com multi-stage build, health checks e volumes
												persistentes
											</p>
											<p className="text-xs text-muted-foreground">
												Fácil de rodar localmente ou em qualquer servidor
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="mt-8 text-center">
							<p className="text-sm text-muted-foreground">
								Seus dados ficam no seu controle. Pode rodar localmente ou no
								seu próprio servidor.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How to run Section */}
			<section id="como-usar" className="py-16 md:py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl">
						<div className="text-center mb-12">
							<Badge variant="primary" className="mb-4">
								Como usar
							</Badge>
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
								Rode no seu computador
							</h2>
							<p className="text-lg text-muted-foreground">
								Não há versão hospedada online. Você precisa rodar localmente.
							</p>
						</div>

						<div className="space-y-6">
							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
											1
										</div>
										<div>
											<h3 className="font-semibold mb-2">
												Clone o repositório
											</h3>
											<code className="text-sm bg-muted px-2 py-1 rounded">
												git clone
												https://github.com/felipegcoutinho/openmonetis.git
											</code>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
											2
										</div>
										<div>
											<h3 className="font-semibold mb-2">
												Configure as variáveis de ambiente
											</h3>
											<p className="text-sm text-muted-foreground">
												Copie o{" "}
												<code className="bg-muted px-1 rounded">
													.env.example
												</code>{" "}
												para <code className="bg-muted px-1 rounded">.env</code>{" "}
												e configure o banco de dados
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
											3
										</div>
										<div>
											<h3 className="font-semibold mb-2">
												Suba o banco via Docker
											</h3>
											<code className="text-sm bg-muted px-2 py-1 rounded">
												docker compose up db -d
											</code>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
											4
										</div>
										<div>
											<h3 className="font-semibold mb-2">
												Rode a aplicação localmente
											</h3>
											<div className="space-y-2">
												<code className="block text-sm bg-muted px-2 py-1 rounded">
													pnpm install
												</code>
												<code className="block text-sm bg-muted px-2 py-1 rounded">
													pnpm db:push
												</code>
												<code className="block text-sm bg-muted px-2 py-1 rounded">
													pnpm dev
												</code>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="mt-8 text-center">
							<Link
								href="https://github.com/felipegcoutinho/openmonetis#-início-rápido"
								target="_blank"
								className="text-sm text-primary hover:underline"
							>
								Ver documentação completa →
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Who is this for Section */}
			<section className="py-16 md:py-24 bg-muted/30">
				<div className="container">
					<div className="mx-auto max-w-3xl">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
								Para quem funciona?
							</h2>
							<p className="text-lg text-muted-foreground">
								O openmonetis funciona melhor se você:
							</p>
						</div>

						<div className="space-y-4">
							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
											<RiTimeLine size={20} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">
												Tem disciplina de registrar gastos
											</h3>
											<p className="text-sm text-muted-foreground">
												Não se importa em dedicar alguns minutos por dia ou
												semana para manter tudo atualizado
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
											<RiLockLine size={20} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">
												Quer controle total sobre seus dados
											</h3>
											<p className="text-sm text-muted-foreground">
												Prefere hospedar seus próprios dados ao invés de
												depender de serviços terceiros
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border">
								<CardContent>
									<div className="flex gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
											<RiLineChartLine size={20} className="text-primary" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">
												Gosta de entender exatamente onde o dinheiro vai
											</h3>
											<p className="text-sm text-muted-foreground">
												Quer visualizar padrões de gastos e tomar decisões
												informadas
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="mt-8 rounded-lg border bg-background p-6 text-center">
							<p className="text-sm text-muted-foreground">
								Se você não se encaixa nisso, provavelmente vai abandonar depois
								de uma semana. E tudo bem! Existem outras ferramentas com
								sincronização automática que podem funcionar melhor pra você.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 md:py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
							Pronto para testar?
						</h2>
						<p className="text-lg text-muted-foreground mb-8">
							Clone o repositório, rode localmente e veja se faz sentido pra
							você. É open source e gratuito.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								href="https://github.com/felipegcoutinho/openmonetis"
								target="_blank"
							>
								<Button size="lg" className="gap-2 w-full sm:w-auto">
									<RiGithubFill size={18} />
									Baixar Projeto
								</Button>
							</Link>
							<Link
								href="https://github.com/felipegcoutinho/openmonetis#-início-rápido"
								target="_blank"
							>
								<Button
									size="lg"
									variant="outline"
									className="w-full sm:w-auto gap-2"
								>
									Como Instalar
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-12 mt-auto">
				<div className="container">
					<div className="mx-auto max-w-5xl">
						<div className="grid gap-8 md:grid-cols-3">
							<div>
								<Logo />
								<p className="text-sm text-muted-foreground mt-4">
									Projeto pessoal de gestão financeira. Open source e
									self-hosted.
								</p>
							</div>

							<div>
								<h3 className="font-semibold mb-4">Projeto</h3>
								<ul className="space-y-3 text-sm text-muted-foreground">
									<li>
										<Link
											href="https://github.com/felipegcoutinho/openmonetis"
											target="_blank"
											className="hover:text-foreground transition-colors flex items-center gap-2"
										>
											<RiGithubFill size={16} />
											GitHub
										</Link>
									</li>
									<li>
										<Link
											href="https://github.com/felipegcoutinho/openmonetis#readme"
											target="_blank"
											className="hover:text-foreground transition-colors"
										>
											Documentação
										</Link>
									</li>
									<li>
										<Link
											href="https://github.com/felipegcoutinho/openmonetis/issues"
											target="_blank"
											className="hover:text-foreground transition-colors"
										>
											Reportar Bug
										</Link>
									</li>
								</ul>
							</div>

							<div>
								<h3 className="font-semibold mb-4">Stack</h3>
								<ul className="space-y-3 text-sm text-muted-foreground">
									<li>Next.js 16 + TypeScript</li>
									<li>PostgreSQL 18 + Drizzle ORM</li>
									<li>Better Auth + shadcn/ui</li>
									<li>Docker + Docker Compose</li>
								</ul>
							</div>
						</div>

						<div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
							<p>
								© {new Date().getFullYear()} openmonetis. Projeto open source
								sob licença MIT.
							</p>
							<div className="flex items-center gap-2">
								<RiShieldCheckLine size={16} className="text-primary" />
								<span>Seus dados, seu servidor</span>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
