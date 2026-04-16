import {
	RiAndroidLine,
	RiGithubFill,
	RiShieldCheckLine,
	RiSmartphoneLine,
} from "@remixicon/react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import { MobileNav } from "@/features/landing/components/mobile-nav";
import { ScreenshotTabs } from "@/features/landing/components/screenshot-tabs";
import { SetupTabs } from "@/features/landing/components/setup-tabs";
import {
	companionBanks,
	companionSteps,
	extraFeatures,
	getMetricsItems,
	mainFeatures,
	navLinks,
	pwaHighlights,
	stackItems,
	whoIsItForItems,
} from "@/features/landing/constants";
import { landingImages } from "@/features/landing/images";
import { fetchGitHubStats } from "@/features/landing/queries";
import { AnimatedThemeToggler } from "@/shared/components/animated-theme-toggler";
import { Logo } from "@/shared/components/logo";
import { NavbarShell } from "@/shared/components/navigation/navbar/navbar-shell";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { DotPattern } from "@/shared/components/ui/dot-pattern";
import { getOptionalUserSession } from "@/shared/lib/auth/server";

export default async function Page() {
	const [session, headersList, githubStats] = await Promise.all([
		getOptionalUserSession(),
		headers(),
		fetchGitHubStats(),
	]);
	const hostname = headersList.get("host")?.replace(/:\d+$/, "");
	const publicDomain = process.env.PUBLIC_DOMAIN?.replace(
		/^https?:\/\//,
		"",
	).replace(/:\d+$/, "");
	const isPublicDomain = !!(publicDomain && hostname === publicDomain);
	const metricsItems = getMetricsItems(githubStats.stars, githubStats.forks);

	return (
		<div className="flex min-h-screen flex-col">
			{/* Navigation */}
			<NavbarShell>
				{/* Center Navigation Links */}
				<nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
					{navLinks.map(({ href, label }) => (
						<a
							key={href}
							href={href}
							className="rounded-md px-2 py-1.5 text-sm font-medium text-black/75 hover:text-black hover:bg-black/10 transition-colors"
						>
							{label}
						</a>
					))}
				</nav>

				<nav className="ml-auto flex items-center gap-2 md:gap-3">
					<AnimatedThemeToggler variant="navbar" />
					{!isPublicDomain &&
						(session?.user ? (
							<Link prefetch href="/dashboard" className="hidden md:block">
								<Button
									variant="outline"
									size="sm"
									className="border-black/20 text-black/80 bg-transparent hover:bg-black/10 hover:text-black shadow-none"
								>
									Dashboard
								</Button>
							</Link>
						) : (
							<div className="hidden md:flex items-center gap-2">
								<Link href="/login">
									<Button
										variant="ghost"
										size="sm"
										className="text-black/75 hover:bg-black/10 hover:text-black shadow-none"
									>
										Entrar
									</Button>
								</Link>
								<Link href="/signup">
									<Button
										size="sm"
										className="bg-black/10 border border-black/20 text-black shadow-none hover:bg-black/20 gap-2"
									>
										Começar
									</Button>
								</Link>
							</div>
						))}
					<MobileNav
						isPublicDomain={isPublicDomain}
						isLoggedIn={!!session?.user}
					/>
				</nav>
			</NavbarShell>

			{/* Hero Section */}
			<section className="relative overflow-hidden pt-14 md:pt-20 lg:pt-24 pb-0">
				<div className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
					<DotPattern
						width={20}
						height={20}
						cx={1.25}
						cy={1.25}
						cr={1.25}
						className="text-primary/10 mask-[linear-gradient(to_bottom,black_0%,transparent_100%)]"
					/>
					<div className="absolute inset-0 bg-linear-to-b from-primary/6 to-transparent" />
				</div>

				<div className="max-w-8xl mx-auto px-4 relative">
					<div className="mx-auto flex max-w-4xl flex-col items-center text-center gap-5 md:gap-6 pb-10 md:pb-14">
						<Badge variant="outline">
							<RiGithubFill className="size-4 mr-1" />
							Projeto Open Source
						</Badge>

						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
							Suas finanças,
							<span className="text-primary"> do seu jeito</span>
						</h1>

						<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl px-4 sm:px-0">
							Gestão financeira self-hosted e open source. Lance manualmente ou
							capture notificações bancárias direto pelo{" "}
							<span className="text-foreground font-medium">
								Companion para Android
							</span>
							. Seus dados, seu servidor.
						</p>

						<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
							<Link
								href="https://github.com/felipegcoutinho/openmonetis"
								target="_blank"
								className="w-full sm:w-auto"
							>
								<Button size="lg" className="gap-2 w-full sm:w-auto">
									<RiGithubFill className="size-5" />
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
					</div>

					<div className="mx-auto max-w-6xl">
						<div className="rounded-t-xl overflow-hidden border-x border-t bg-card">
							<div className="flex items-center gap-1.5 px-3 h-8 border-b bg-muted/50">
								<div className="size-2.5 rounded-full bg-muted-foreground/20" />
								<div className="size-2.5 rounded-full bg-muted-foreground/20" />
								<div className="size-2.5 rounded-full bg-muted-foreground/20" />
								<div className="ml-2 flex-1 max-w-52 h-4 rounded bg-muted-foreground/10" />
							</div>
							<Image
								src={landingImages.hero.light}
								alt="openmonetis Dashboard Preview"
								width={1920}
								height={1080}
								className="w-full h-auto dark:hidden"
								priority
							/>
							<Image
								src={landingImages.hero.dark}
								alt="openmonetis Dashboard Preview"
								width={1920}
								height={1080}
								className="w-full h-auto hidden dark:block"
								priority
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Metrics Bar */}
			<section className="py-8 md:py-12 border-y">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
							{metricsItems.map(({ icon: Icon, value, label, colorVar }) => (
								<div
									key={label}
									className="flex flex-col items-center text-center gap-1.5"
								>
									<Icon className="size-5" style={{ color: colorVar }} />
									<span className="text-2xl md:text-3xl font-semibold">
										{value}
									</span>
									<span className="text-xs md:text-sm text-muted-foreground">
										{label}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Screenshots Gallery Section */}
			<section id="telas" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									Conheça as telas
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Veja o que você pode fazer
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Explore as principais telas do OpenMonetis
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<ScreenshotTabs />
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="funcionalidades" className="py-12 md:py-24 bg-muted/40">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									O que tem aqui
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Funcionalidades que importam
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Ferramentas simples para organizar suas contas, cartões,
									gastos e receitas
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{mainFeatures.map((feature) => (
									<Card key={feature.title}>
										<CardContent className="pt-5 pb-5 md:pt-6">
											<div className="flex flex-col gap-3 md:gap-4">
												<div
													className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-lg"
													style={{
														backgroundColor: `color-mix(in oklch, ${feature.colorVar} 14%, transparent)`,
													}}
												>
													<feature.icon
														className="size-[22px] md:size-6"
														style={{ color: feature.colorVar }}
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

						<AnimateOnScroll>
							<div className="mt-8 md:mt-12">
								<h3 className="text-sm font-semibold text-center mb-4 md:mb-6 text-muted-foreground">
									Também inclui
								</h3>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{extraFeatures.map((feature) => (
										<div
											key={feature.title}
											className="flex items-start gap-3 rounded-lg border bg-card p-3 md:p-4"
										>
											<div
												className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
												style={{
													backgroundColor: `color-mix(in oklch, ${feature.colorVar} 14%, transparent)`,
												}}
											>
												<feature.icon
													className="size-[18px]"
													style={{ color: feature.colorVar }}
												/>
											</div>
											<div className="min-w-0">
												<h4 className="font-semibold text-sm mb-0.5">
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

			{/* Mobile Section */}
			<section id="mobile" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						{/* Header */}
						<AnimateOnScroll>
							<div className="text-center mb-12 md:mb-20">
								<Badge variant="outline" className="mb-4">
									<RiSmartphoneLine className="size-3.5 mr-1" />
									Mobile
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Use o OpenMonetis no celular sem perder o fluxo
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Instale como PWA para acesso rápido no dia a dia. No Android,
									use o Companion para capturar notificações bancárias
									automaticamente.
								</p>
							</div>
						</AnimateOnScroll>

						{/* PWA — imagem esquerda, texto direita */}
						<AnimateOnScroll>
							<div className="grid gap-10 lg:gap-16 lg:grid-cols-2 items-center mb-16 md:mb-24">
								<div className="flex justify-center">
									<div className="relative">
										<div className="absolute inset-0 bg-primary/8 rounded-3xl blur-3xl scale-90" />
										<Image
											src={landingImages.pwa.light}
											alt="Preview PWA"
											width={390}
											height={844}
											className="relative h-auto w-56 md:w-64 rounded-3xl shadow-lg dark:hidden"
										/>
										<Image
											src={landingImages.pwa.dark}
											alt="Preview PWA"
											width={390}
											height={844}
											className="relative h-auto w-56 md:w-64 rounded-3xl shadow-lg hidden dark:block"
										/>
									</div>
								</div>
								<div>
									<Badge variant="outline" className="mb-4">
										<RiSmartphoneLine className="size-3.5 mr-1" />
										PWA instalável
									</Badge>
									<h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
										Leve o OpenMonetis para a tela inicial
									</h3>
									<p className="text-muted-foreground mb-6 leading-relaxed">
										Adicione à tela inicial e abra direto, como um app. Sem
										depender de uma aba perdida no navegador. Funciona em
										Android, iOS e desktop.
									</p>
									<ul className="space-y-3">
										{pwaHighlights.map((item) => (
											<li key={item.title} className="flex items-start gap-3">
												<div
													className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
													style={{
														backgroundColor: `color-mix(in oklch, ${item.colorVar} 14%, transparent)`,
													}}
												>
													<item.icon
														className="size-[15px]"
														style={{ color: item.colorVar }}
													/>
												</div>
												<p className="text-sm">
													<span className="font-medium">{item.title}</span>
													<span className="text-muted-foreground">
														{" "}
														— {item.description}
													</span>
												</p>
											</li>
										))}
									</ul>
								</div>
							</div>
						</AnimateOnScroll>

						{/* Companion — texto esquerda, imagem direita */}
						<AnimateOnScroll>
							<div className="grid gap-10 lg:gap-16 lg:grid-cols-2 items-center border-t pt-16 md:pt-24">
								<div>
									<div className="mb-4">
										<Badge variant="outline">
											<RiAndroidLine className="size-3.5 mr-1" />
											Companion Android
										</Badge>
									</div>
									<h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
										Capture, envie e revise no mesmo fluxo
									</h3>
									<p className="text-muted-foreground mb-6 leading-relaxed">
										O Companion captura notificações de apps bancários e cria
										pré-lançamentos automaticamente para você revisar na inbox.
									</p>
									<ol className="space-y-3 mb-6">
										{companionSteps.map((step, index) => (
											<li key={step.title} className="flex items-start gap-3">
												<span
													className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium"
													style={{
														backgroundColor: `color-mix(in oklch, ${step.colorVar} 14%, transparent)`,
														color: step.colorVar,
													}}
												>
													{index + 1}
												</span>
												<p className="text-sm">
													<span className="font-medium">{step.title}</span>
													<span className="text-muted-foreground">
														{" "}
														— {step.description}
													</span>
												</p>
											</li>
										))}
									</ol>
									<div>
										<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
											Bancos testados
										</p>
										<div className="flex flex-wrap gap-2">
											{companionBanks.map((bank) => (
												<span
													key={bank.name}
													className="inline-flex items-center gap-1.5 rounded-full border py-1 pr-3 text-xs font-medium"
													style={{
														paddingLeft: bank.logo ? "4px" : "12px",
													}}
												>
													{bank.logo && (
														<Image
															src={bank.logo}
															alt={bank.name}
															width={18}
															height={18}
															className="rounded-full"
														/>
													)}
													{bank.name}
												</span>
											))}
										</div>
										<Link
											href="https://github.com/felipegcoutinho/openmonetis-companion"
											target="_blank"
											className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
										>
											<RiGithubFill className="size-3.5" />
											Ver no GitHub
										</Link>
									</div>
								</div>
								<div className="flex justify-center order-first lg:order-last">
									<div className="relative">
										<div className="absolute inset-0 bg-primary/8 rounded-3xl blur-3xl scale-90" />
										<Image
											src={landingImages.companion.light}
											alt="Preview Companion"
											width={390}
											height={844}
											className="relative h-auto w-56 md:w-64 rounded-3xl shadow-lg dark:hidden"
										/>
										<Image
											src={landingImages.companion.dark}
											alt="Preview Companion"
											width={390}
											height={844}
											className="relative h-auto w-56 md:w-64 rounded-3xl shadow-lg hidden dark:block"
										/>
									</div>
								</div>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Tech Stack Section */}
			<section id="stack" className="py-12 md:py-24 bg-muted/40">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									Stack técnica
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									O que roda por baixo
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Self-hosted, open source, type-safe do banco ao frontend
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="grid gap-4 md:gap-6 sm:grid-cols-2">
								{stackItems.map((item) => (
									<Card key={item.title}>
										<CardContent>
											<div className="flex items-start gap-4">
												<div
													className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
													style={{
														backgroundColor: `color-mix(in oklch, ${item.colorVar} 14%, transparent)`,
													}}
												>
													<item.icon
														className="size-6"
														style={{ color: item.colorVar }}
													/>
												</div>
												<div>
													<h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">
														{item.title}
													</h3>
													<p className="text-sm text-muted-foreground mb-2 md:mb-3">
														{item.subtitle}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* How to run Section */}
			<section id="como-usar" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									Como usar
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
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
			<section id="para-quem-e" className="py-12 md:py-24 bg-muted/40">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									Para quem é?
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Feito para quem gosta de controle
								</h2>
								<p className="text-base md:text-lg text-muted-foreground px-4 sm:px-0">
									O OpenMonetis não é para todo mundo.
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="space-y-3 md:space-y-4">
								{whoIsItForItems.map((item) => (
									<Card key={item.title}>
										<CardContent>
											<div className="flex gap-3 md:gap-4">
												<div
													className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg"
													style={{
														backgroundColor: `color-mix(in oklch, ${item.colorVar} 14%, transparent)`,
													}}
												>
													<item.icon
														className="size-[18px] md:size-5"
														style={{ color: item.colorVar }}
													/>
												</div>
												<div>
													<h3 className="font-semibold mb-1">{item.title}</h3>
													<p className="text-xs sm:text-sm text-muted-foreground">
														{item.description}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<AnimateOnScroll>
						<div className="mx-auto max-w-4xl rounded-2xl border bg-card px-8 py-12 md:py-16 text-center">
							<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
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
										<RiGithubFill className="size-[18px]" />
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
								<Logo variant="compact" colorIcon />
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
											<RiGithubFill className="size-4" />
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
											<RiGithubFill className="size-4" />
											GitHub
										</Link>
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
								<RiShieldCheckLine className="size-4 text-primary" />
								<span>Seus dados, seu servidor</span>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
