"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SetupTabs() {
	return (
		<Tabs defaultValue="docker" className="w-full">
			<TabsList className="justify-center mb-6">
				<TabsTrigger value="docker">Docker (Recomendado)</TabsTrigger>
				<TabsTrigger value="manual">Manual</TabsTrigger>
			</TabsList>

			<TabsContent value="docker">
				<div className="space-y-4 md:space-y-6">
					<StepCard step={1} title="Clone o repositório">
						<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded overflow-x-auto">
							git clone https://github.com/felipegcoutinho/openmonetis.git
						</code>
					</StepCard>

					<StepCard step={2} title="Configure as variáveis de ambiente">
						<p className="text-xs sm:text-sm text-muted-foreground">
							Copie o{" "}
							<code className="bg-muted px-1 rounded">.env.example</code> para{" "}
							<code className="bg-muted px-1 rounded">.env</code> e configure o
							banco de dados
						</p>
					</StepCard>

					<StepCard step={3} title="Suba tudo com Docker Compose">
						<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded">
							docker compose up -d
						</code>
						<p className="text-xs text-muted-foreground mt-2">
							Isso vai subir o banco PostgreSQL e a aplicação automaticamente
						</p>
					</StepCard>
				</div>
			</TabsContent>

			<TabsContent value="manual">
				<div className="space-y-4 md:space-y-6">
					<StepCard step={1} title="Clone o repositório">
						<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded overflow-x-auto">
							git clone https://github.com/felipegcoutinho/openmonetis.git
						</code>
					</StepCard>

					<StepCard step={2} title="Configure as variáveis de ambiente">
						<p className="text-xs sm:text-sm text-muted-foreground">
							Copie o{" "}
							<code className="bg-muted px-1 rounded">.env.example</code> para{" "}
							<code className="bg-muted px-1 rounded">.env</code> e configure o
							banco de dados
						</p>
					</StepCard>

					<StepCard step={3} title="Suba o banco via Docker">
						<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded">
							docker compose up db -d
						</code>
					</StepCard>

					<StepCard step={4} title="Instale e rode a aplicação">
						<div className="space-y-2">
							<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded">
								pnpm install
							</code>
							<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded">
								pnpm db:push
							</code>
							<code className="block text-xs sm:text-sm bg-muted px-2 py-1 rounded">
								pnpm dev
							</code>
						</div>
					</StepCard>
				</div>
			</TabsContent>
		</Tabs>
	);
}

function StepCard({
	step,
	title,
	children,
}: {
	step: number;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="border">
			<CardContent>
				<div className="flex gap-3 md:gap-4">
					<div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm md:text-base">
						{step}
					</div>
					<div className="min-w-0">
						<h3 className="font-semibold mb-1.5 md:mb-2">{title}</h3>
						{children}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
