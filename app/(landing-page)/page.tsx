import {
	RiArrowRightSLine,
	RiBankCard2Line,
	RiBarChartBoxLine,
	RiCalendarLine,
	RiCheckLine,
	RiCodeSSlashLine,
	RiDatabase2Line,
	RiDeviceLine,
	RiDownloadCloudLine,
	RiEyeOffLine,
	RiFileTextLine,
	RiFlashlightLine,
	RiGitBranchLine,
	RiGithubFill,
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
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { AnimateOnScroll } from "@/components/landing/animate-on-scroll";
import { MobileNav } from "@/components/landing/mobile-nav";
import { SetupTabs } from "@/components/landing/setup-tabs";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOptionalUserSession } from "@/lib/auth/server";

const mainFeatures = [
	{
		icon: RiWalletLine,
		title: "Contas e transações",
		description:
			"Registre suas contas bancárias, cartões e dinheiro. Adicione receitas, despesas e transferências. Organize por categorias. Extratos detalhados por conta.",
	},
	{
		icon: RiPercentLine,
		title: "Parcelamentos avançados",
		description:
			"Controle completo de compras parceladas. Antecipe parcelas com cálculo automático de desconto. Veja análise consolidada de todas as parcelas em aberto.",
	},
	{
		icon: RiRobot2Line,
		title: "Insights com IA",
		description:
			"Análises financeiras geradas por IA (Claude, GPT, Gemini). Insights personalizados sobre seus padrões de gastos e recomendações inteligentes.",
	},
	{
		icon: RiBarChartBoxLine,
		title: "Relatórios e gráficos",
		description:
			"Dashboard com 20+ widgets interativos. Relatórios detalhados por categoria. Gráficos de evolução e comparativos. Exportação em PDF e Excel.",
	},
	{
		icon: RiBankCard2Line,
		title: "Faturas de cartão",
		description:
			"Cadastre seus cartões e acompanhe as faturas por período. Veja o que ainda não foi fechado. Controle limites, vencimentos e fechamentos.",
	},
	{
		icon: RiTeamLine,
		title: "Gestão colaborativa",
		description:
			"Compartilhe pagadores com permissões granulares (admin/viewer). Notificações automáticas por e-mail. Colabore em lançamentos compartilhados.",
	},
];

const extraFeatures = [
	{
		icon: RiPieChartLine,
		title: "Categorias e orçamentos",
		description:
			"Crie categorias personalizadas e defina orçamentos mensais com indicadores visuais.",
	},
	{
		icon: RiFileTextLine,
		title: "Anotações e tarefas",
		description:
			"Notas de texto e listas de tarefas com checkboxes. Arquivamento para manter histórico.",
	},
	{
		icon: RiCalendarLine,
		title: "Calendário financeiro",
		description:
			"Visualize transações em calendário mensal. Nunca perca prazos de pagamentos.",
	},
	{
		icon: RiDownloadCloudLine,
		title: "Importação em massa",
		description: "Lance múltiplos lançamentos de uma vez",
	},
	{
		icon: RiEyeOffLine,
		title: "Modo privacidade",
		description:
			"Oculte valores sensíveis com um clique. Tema dark/light. Calculadora integrada.",
	},
	{
		icon: RiFlashlightLine,
		title: "Performance otimizada",
		description: "Sistema rápido e com alta performance",
	},
];

const screenshotSections = [
	{
		title: "Lançamentos",
		description: "Registre e organize todas as suas transações financeiras",
		lightSrc: "/preview-lancamentos-light.webp",
		darkSrc: "/preview-lancamentos-dark.webp",
	},
	{
		title: "Calendário",
		description: "Visualize suas finanças no calendário mensal",
		lightSrc: "/preview-calendario-light.webp",
		darkSrc: "/preview-calendario-dark.webp",
	},
	{
		title: "Cartões",
		description: "Acompanhe faturas, limites e vencimentos dos seus cartões",
		lightSrc: "/preview-cartao-light.webp",
		darkSrc: "/preview-cartao-dark.webp",
	},
];

const companionBanks = ["Nubank", "Itaú", "Inter", "Mercado Pago", "Outros"];

export default async function Page() {
	const [session, headersList] = await Promise.all([
		getOptionalUserSession(),
		headers(),
	]);
	const hostname = headersList.get("host")?.replace(/:\d+$/, "");
	const publicDomain = process.env.PUBLIC_DOMAIN?.replace(
		/^https?:\/\//,
		"",
	).replace(/:\d+$/, "");
	const isPublicDomain = !!(publicDomain && hostname === publicDomain);

	return (
		<div className="flex min-h-screen flex-col">
			{/* Navigation */}
			<header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="max-w-8xl mx-auto px-4 flex h-14 items-center justify-between">
					<Logo variant="compact" />

					{/* Center Navigation Links */}
					<nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
						<a
							href="#telas"
							className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						>
							Conheça as telas
						</a>
						<a
							href="#funcionalidades"
							className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						>
							Funcionalidades
						</a>
						<a
							href="#companion"
							className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						>
							Companion
						</a>
						<a
							href="#stack"
							className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						>
							Stack
						</a>
						<a
							href="#como-usar"
							className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
						>
							Como usar
						</a>
					</nav>

					<nav className="flex items-center gap-2 md:gap-4">
						<AnimatedThemeToggler />
						{!isPublicDomain &&
							(session?.user ? (
								<Link prefetch href="/dashboard" className="hidden md:block">
									<Button variant="outline" size="sm">
										Dashboard
									</Button>
								</Link>
							) : (
								<div className="hidden md:flex items-center gap-2">
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
								</div>
							))}
						<MobileNav
							isPublicDomain={isPublicDomain}
							isLoggedIn={!!session?.user}
						/>
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative overflow-hidden py-12 md:py-24 lg:py-32">
				{/* Background gradient */}
				<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />

				<div className="max-w-8xl mx-auto px-4 relative">
					<div className="mx-auto flex max-w-5xl flex-col items-center text-center gap-5 md:gap-6">
						<Logo variant="small" className="h-12 w-12 mb-1" />

						<Badge variant="primary">
							<RiGithubFill size={14} className="mr-1" />
							Projeto Open Source
						</Badge>

						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
							Suas finanças,
							<span className="text-primary"> do seu jeito</span>
						</h1>

						<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl px-4 sm:px-0">
							Um projeto pessoal de gestão financeira. Self-hosted, sem Open
							Finance, sem sincronização automática. Rode no seu computador ou
							servidor e tenha controle total sobre suas finanças.
						</p>

						<div className="rounded-lg border bg-muted/30 p-3 sm:p-4 max-w-2xl mx-4 sm:mx-0">
							<p className="text-xs sm:text-sm text-muted-foreground">
								<span className="font-semibold text-foreground">
									Aviso importante:
								</span>{" "}
								Este sistema requer disciplina. Você precisa registrar
								manualmente cada transação. Se prefere algo automático, este
								projeto não é pra você.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto px-4 sm:px-0">
							<Link
								href="https://github.com/felipegcoutinho/openmonetis"
								target="_blank"
								className="w-full sm:w-auto"
							>
								<Button size="lg" className="gap-2 w-full sm:w-auto">
									<RiGithubFill size={18} />
									Baixar no GitHub
								</Button>
							</Link>
							<Link
								href="https://github.com/felipegcoutinho/openmonetis#readme"
								target="_blank"
								className="w-full sm:w-auto"
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

						<div className="mt-4 md:mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
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

			{/* Metrics Bar */}
			<section className="py-8 md:py-12 border-y">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
							<div className="flex flex-col items-center text-center gap-1.5">
								<div className="flex items-center gap-2 text-primary">
									<RiLayoutGridLine size={20} />
								</div>
								<span className="text-2xl md:text-3xl font-bold">20+</span>
								<span className="text-xs md:text-sm text-muted-foreground">
									Widgets no dashboard
								</span>
							</div>
							<div className="flex flex-col items-center text-center gap-1.5">
								<div className="flex items-center gap-2 text-primary">
									<RiShieldCheckLine size={20} />
								</div>
								<span className="text-2xl md:text-3xl font-bold">100%</span>
								<span className="text-xs md:text-sm text-muted-foreground">
									Self-hosted
								</span>
							</div>
							<div className="flex flex-col items-center text-center gap-1.5">
								<div className="flex items-center gap-2 text-primary">
									<RiStarLine size={20} />
								</div>
								<span className="text-2xl md:text-3xl font-bold">+200</span>
								<span className="text-xs md:text-sm text-muted-foreground">
									Stars no GitHub
								</span>
							</div>
							<div className="flex flex-col items-center text-center gap-1.5">
								<div className="flex items-center gap-2 text-primary">
									<RiGitBranchLine size={20} />
								</div>
								<span className="text-2xl md:text-3xl font-bold">+60</span>
								<span className="text-xs md:text-sm text-muted-foreground">
									Forks no GitHub
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Dashboard Preview Section */}
			<section className="py-6 md:py-16">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div>
								<Image
									src="/dashboard-preview-light.webp"
									alt="openmonetis Dashboard Preview"
									width={1920}
									height={1080}
									className="w-full h-auto dark:hidden"
									priority
								/>
								<Image
									src="/dashboard-preview-dark.webp"
									alt="openmonetis Dashboard Preview"
									width={1920}
									height={1080}
									className="w-full h-auto hidden dark:block"
									priority
								/>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Screenshots Gallery Section */}
			<section id="telas" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="primary" className="mb-4">
									Conheça as telas
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
									Veja o que você pode fazer
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Explore as principais telas do OpenMonetis
								</p>
							</div>
						</AnimateOnScroll>

						<div className="space-y-10 md:space-y-14">
							{screenshotSections.map((section) => (
								<AnimateOnScroll key={section.title}>
									<div className="mb-3 text-center">
										<h3 className="font-semibold text-base md:text-lg">
											{section.title}
										</h3>
										<p className="text-sm text-muted-foreground">
											{section.description}
										</p>
									</div>
									<div>
										<Image
											src={section.lightSrc}
											alt={`Preview ${section.title}`}
											width={1920}
											height={1080}
											className="w-full h-auto dark:hidden"
										/>
										<Image
											src={section.darkSrc}
											alt={`Preview ${section.title}`}
											width={1920}
											height={1080}
											className="w-full h-auto hidden dark:block"
										/>
									</div>
								</AnimateOnScroll>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="funcionalidades" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="primary" className="mb-4">
									O que tem aqui
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
									Funcionalidades que importam
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Ferramentas simples para organizar suas contas, cartões,
									gastos e receitas
								</p>
							</div>
						</AnimateOnScroll>

						{/* Main Features - larger cards */}
						<AnimateOnScroll>
							<div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{mainFeatures.map((feature) => (
									<Card
										key={feature.title}
										className="border hover:border-primary/50 transition-colors"
									>
										<CardContent className="pt-5 pb-5 md:pt-6">
											<div className="flex flex-col gap-3 md:gap-4">
												<div className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/10">
													<feature.icon
														size={22}
														className="text-primary md:size-6"
													/>
												</div>
												<div>
													<h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">
														{feature.title}
													</h3>
													<p className="text-sm text-muted-foreground leading-relaxed">
														{feature.description}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</AnimateOnScroll>

						{/* Extra Features - compact list */}
						<AnimateOnScroll>
							<div className="mt-8 md:mt-12">
								<h3 className="text-lg font-semibold text-center mb-4 md:mb-6 text-muted-foreground">
									E mais...
								</h3>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{extraFeatures.map((feature) => (
										<div
											key={feature.title}
											className="flex items-start gap-3 rounded-lg border bg-background p-3 md:p-4"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
												<feature.icon size={18} className="text-primary" />
											</div>
											<div className="min-w-0">
												<h4 className="font-medium text-sm mb-0.5">
													{feature.title}
												</h4>
												<p className="text-xs text-muted-foreground leading-relaxed">
													{feature.description}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Companion Section */}
			<section id="companion" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<AnimateOnScroll>
							<div className="grid gap-8 md:gap-12 md:grid-cols-2 items-center">
								{/* Text content */}
								<div className="order-2 md:order-1">
									<Badge variant="primary" className="mb-4">
										<RiSmartphoneLine size={14} className="mr-1" />
										App Android
									</Badge>
									<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
										Capture automaticamente do seu celular
									</h2>
									<p className="text-base md:text-lg text-muted-foreground mb-6">
										O OpenMonetis Companion captura notificações de apps
										bancários e cria pré-lançamentos automaticamente para você
										revisar.
									</p>

									{/* Flow steps */}
									<div className="space-y-3 mb-6">
										<div className="flex items-start gap-3">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
												<RiNotification3Line
													size={16}
													className="text-primary"
												/>
											</div>
											<div>
												<p className="text-sm font-medium">
													Notificação bancária chega
												</p>
												<p className="text-xs text-muted-foreground">
													O Companion intercepta automaticamente
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
												<RiSmartphoneLine size={16} className="text-primary" />
											</div>
											<div>
												<p className="text-sm font-medium">
													Dados extraídos e enviados
												</p>
												<p className="text-xs text-muted-foreground">
													Valor, descrição e banco são identificados
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
												<RiCheckLine size={16} className="text-primary" />
											</div>
											<div>
												<p className="text-sm font-medium">
													Revise e confirme no OpenMonetis
												</p>
												<p className="text-xs text-muted-foreground">
													Pré-lançamentos ficam na inbox para sua aprovação
												</p>
											</div>
										</div>
									</div>

									{/* Supported banks */}
									<div className="mb-6">
										<p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
											Bancos suportados
										</p>
										<div className="flex flex-wrap gap-2">
											{companionBanks.map((bank) => (
												<span
													key={bank}
													className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium"
												>
													{bank}
												</span>
											))}
										</div>
									</div>

									<Link
										href="https://github.com/felipegcoutinho/openmonetis-companion"
										target="_blank"
									>
										<Button variant="outline" className="gap-2">
											<RiGithubFill size={16} />
											Ver no GitHub
										</Button>
									</Link>
								</div>

								{/* Companion Screenshot */}
								<div className="order-1 md:order-2 flex items-center justify-center">
									<div className="w-full max-w-[220px] md:max-w-[260px]">
										<Image
											src="/openmonetis_companion.webp"
											alt="OpenMonetis Companion App"
											width={1080}
											height={2217}
											className="w-full h-auto rounded-2xl"
										/>
									</div>
								</div>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Tech Stack Section */}
			<section id="stack" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="primary" className="mb-4">
									Stack técnica
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
									Construído com tecnologias modernas
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Open source, self-hosted e fácil de customizar
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="grid gap-4 md:gap-6 sm:grid-cols-2">
								<Card className="border">
									<CardContent>
										<div className="flex items-start gap-4">
											<RiCodeSSlashLine
												size={28}
												className="text-primary shrink-0 md:size-8"
											/>
											<div>
												<h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">
													Frontend
												</h3>
												<p className="text-sm text-muted-foreground mb-2 md:mb-3">
													Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
												</p>
												<p className="text-xs text-muted-foreground">
													Interface moderna e responsiva com React 19 e App
													Router
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="border">
									<CardContent>
										<div className="flex items-start gap-4">
											<RiDatabase2Line
												size={28}
												className="text-primary shrink-0 md:size-8"
											/>
											<div>
												<h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">
													Backend
												</h3>
												<p className="text-sm text-muted-foreground mb-2 md:mb-3">
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
												size={28}
												className="text-primary shrink-0 md:size-8"
											/>
											<div>
												<h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">
													Segurança
												</h3>
												<p className="text-sm text-muted-foreground mb-2 md:mb-3">
													Better Auth com OAuth (Google) e autenticação por
													email
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
											<RiDeviceLine
												size={28}
												className="text-primary shrink-0 md:size-8"
											/>
											<div>
												<h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">
													Deploy
												</h3>
												<p className="text-sm text-muted-foreground mb-2 md:mb-3">
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
						</AnimateOnScroll>

						<div className="mt-6 md:mt-8 text-center">
							<p className="text-sm text-muted-foreground">
								Seus dados ficam no seu controle. Pode rodar localmente ou no
								seu próprio servidor.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How to run Section */}
			<section id="como-usar" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-3xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="primary" className="mb-4">
									Como usar
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
									Rode no seu computador
								</h2>
								<p className="text-base md:text-lg text-muted-foreground px-4 sm:px-0">
									Não há versão hospedada online. Você precisa rodar localmente.
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<SetupTabs />
						</AnimateOnScroll>

						<div className="mt-6 md:mt-8 text-center">
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
			<section className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-3xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
									Para quem funciona?
								</h2>
								<p className="text-base md:text-lg text-muted-foreground px-4 sm:px-0">
									O openmonetis funciona melhor se você:
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="space-y-3 md:space-y-4">
								<Card className="border">
									<CardContent>
										<div className="flex gap-3 md:gap-4">
											<div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
												<RiTimeLine
													size={18}
													className="text-primary md:size-5"
												/>
											</div>
											<div>
												<h3 className="font-semibold mb-1">
													Tem disciplina de registrar gastos
												</h3>
												<p className="text-xs sm:text-sm text-muted-foreground">
													Não se importa em dedicar alguns minutos por dia ou
													semana para manter tudo atualizado
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="border">
									<CardContent>
										<div className="flex gap-3 md:gap-4">
											<div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
												<RiLockLine
													size={18}
													className="text-primary md:size-5"
												/>
											</div>
											<div>
												<h3 className="font-semibold mb-1">
													Quer controle total sobre seus dados
												</h3>
												<p className="text-xs sm:text-sm text-muted-foreground">
													Prefere hospedar seus próprios dados ao invés de
													depender de serviços terceiros
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="border">
									<CardContent>
										<div className="flex gap-3 md:gap-4">
											<div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
												<RiLineChartLine
													size={18}
													className="text-primary md:size-5"
												/>
											</div>
											<div>
												<h3 className="font-semibold mb-1">
													Gosta de entender exatamente onde o dinheiro vai
												</h3>
												<p className="text-xs sm:text-sm text-muted-foreground">
													Quer visualizar padrões de gastos e tomar decisões
													informadas
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="mt-6 md:mt-8 rounded-lg border bg-background p-4 md:p-6 text-center">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Se você não se encaixa nisso, provavelmente vai abandonar
									depois de uma semana. E tudo bem! Existem outras ferramentas
									com sincronização automática que podem funcionar melhor pra
									você.
								</p>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<AnimateOnScroll>
						<div className="mx-auto max-w-3xl text-center px-4 sm:px-0">
							<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
								Pronto para testar?
							</h2>
							<p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
								Clone o repositório, rode localmente e veja se faz sentido pra
								você. É open source e gratuito.
							</p>
							<div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
								<Link
									href="https://github.com/felipegcoutinho/openmonetis"
									target="_blank"
									className="w-full sm:w-auto"
								>
									<Button size="lg" className="gap-2 w-full sm:w-auto">
										<RiGithubFill size={18} />
										Baixar Projeto
									</Button>
								</Link>
								<Link
									href="https://github.com/felipegcoutinho/openmonetis#-início-rápido"
									target="_blank"
									className="w-full sm:w-auto"
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
					</AnimateOnScroll>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-8 md:py-12 mt-auto">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
							<div className="sm:col-span-2 md:col-span-1">
								<Logo variant="compact" />
								<p className="text-sm text-muted-foreground mt-3 md:mt-4">
									Projeto pessoal de gestão financeira. Open source e
									self-hosted.
								</p>
							</div>

							<div>
								<h3 className="font-semibold mb-3 md:mb-4">Projeto</h3>
								<ul className="space-y-2.5 md:space-y-3 text-sm text-muted-foreground">
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
								<h3 className="font-semibold mb-3 md:mb-4">Companion</h3>
								<ul className="space-y-2.5 md:space-y-3 text-sm text-muted-foreground">
									<li>
										<Link
											href="https://github.com/felipegcoutinho/openmonetis-companion"
											target="_blank"
											className="hover:text-foreground transition-colors flex items-center gap-2"
										>
											<RiGithubFill size={16} />
											GitHub
										</Link>
									</li>
									<li>
										<span className="flex items-center gap-2">
											<RiSmartphoneLine size={16} />
											App Android
										</span>
									</li>
								</ul>
							</div>
						</div>

						<div className="border-t mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-sm text-muted-foreground">
							<p>
								© {new Date().getFullYear()} openmonetis. Projeto open source
								sob licença.
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
