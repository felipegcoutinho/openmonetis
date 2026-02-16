"use client";

import {
	RiAndroidLine,
	RiDownload2Line,
	RiExternalLinkLine,
	RiNotification3Line,
	RiQrCodeLine,
	RiShieldCheckLine,
} from "@remixicon/react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ApiTokensForm } from "./api-tokens-form";

interface ApiToken {
	id: string;
	name: string;
	tokenPrefix: string;
	lastUsedAt: Date | null;
	lastUsedIp: string | null;
	createdAt: Date;
	expiresAt: Date | null;
	revokedAt: Date | null;
}

interface CompanionTabProps {
	tokens: ApiToken[];
}

const steps: {
	icon: typeof RiDownload2Line;
	title: string;
	description: ReactNode;
}[] = [
	{
		icon: RiDownload2Line,
		title: "Instale o app",
		description: (
			<>
				Baixe o APK no{" "}
				<a
					href="https://github.com/felipegcoutinho/openmonetis-companion"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-0.5 text-primary hover:underline"
				>
					GitHub
					<RiExternalLinkLine className="h-3 w-3" />
				</a>
			</>
		),
	},
	{
		icon: RiQrCodeLine,
		title: "Gere um token",
		description: "Crie um token abaixo para autenticar.",
	},
	{
		icon: RiNotification3Line,
		title: "Configure permissões",
		description: "Conceda acesso às notificações.",
	},
	{
		icon: RiShieldCheckLine,
		title: "Pronto!",
		description: "Notificações serão enviadas ao OpenMonetis.",
	},
];

export function CompanionTab({ tokens }: CompanionTabProps) {
	return (
		<Card className="p-6">
			<div className="space-y-6">
				{/* Header */}
				<div>
					<div className="flex items-center gap-2 mb-1">
						<h2 className="text-lg font-bold">OpenMonetis Companion</h2>
						<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success dark:bg-success/10">
							<RiAndroidLine className="h-3 w-3" />
							Android
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						Capture notificações de transações dos seus apps de banco (Nubank,
						Itaú, Bradesco, Inter, C6 e outros) e envie para sua caixa de
						entrada.
					</p>
				</div>

				{/* Steps */}
				<div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
					{steps.map((step, index) => (
						<div key={step.title} className="flex items-start gap-2">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
								<step.icon className="h-4 w-4" />
							</div>
							<div className="min-w-0">
								<p className="text-sm font-medium leading-tight">
									{index + 1}. {step.title}
								</p>
								<p className="text-xs text-muted-foreground">
									{step.description}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Divider */}
				<div className="border-t" />

				{/* Devices */}
				<ApiTokensForm tokens={tokens} />
			</div>
		</Card>
	);
}
