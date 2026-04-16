"use client";

import { RiExternalLinkLine } from "@remixicon/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
	type AIProvider,
	AVAILABLE_MODELS,
	DEFAULT_PROVIDER,
	PROVIDERS,
} from "@/features/insights/constants";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";

interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
}

const PROVIDER_ICON_PATHS: Record<
	AIProvider,
	{ light: string; dark?: string }
> = {
	openai: {
		light: "/providers/chatgpt.svg",
		dark: "/providers/chatgpt_dark_mode.svg",
	},
	anthropic: {
		light: "/providers/claude.svg",
	},
	google: {
		light: "/providers/gemini.svg",
	},
	openrouter: {
		light: "/providers/openrouter_light.svg",
		dark: "/providers/openrouter_dark.svg",
	},
};

export function ModelSelector({
	value,
	onValueChange,
	disabled,
}: ModelSelectorProps) {
	// Estado para armazenar o provider selecionado manualmente
	const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
		null,
	);
	const [customModel, setCustomModel] = useState(value);

	// Sincronizar customModel quando value mudar (importante para pré-carregamento)
	useEffect(() => {
		// Se o value tem "/" é um modelo OpenRouter customizado
		if (value.includes("/")) {
			setCustomModel(value);
			setSelectedProvider("openrouter");
		} else {
			setCustomModel(value);
			// Limpar selectedProvider para deixar o useMemo detectar automaticamente
			setSelectedProvider(null);
		}
	}, [value]);

	// Determinar provider atual baseado no modelo selecionado ou provider manual
	const currentProvider = useMemo(() => {
		// Se há um provider selecionado manualmente, use-o
		if (selectedProvider) {
			return selectedProvider;
		}

		// Se o modelo tem "/" é OpenRouter
		if (value.includes("/")) {
			return "openrouter";
		}

		// Caso contrário, tente detectar baseado no modelo
		const model = AVAILABLE_MODELS.find((m) => m.id === value);
		return model?.provider ?? DEFAULT_PROVIDER;
	}, [value, selectedProvider]);

	// Agrupar modelos por provider
	const modelsByProvider = useMemo(() => {
		const grouped: Record<
			AIProvider,
			Array<(typeof AVAILABLE_MODELS)[number]>
		> = {
			openai: [],
			anthropic: [],
			google: [],
			openrouter: [],
		};

		AVAILABLE_MODELS.forEach((model) => {
			grouped[model.provider].push(model);
		});

		return grouped;
	}, []);

	// Atualizar provider (seleciona primeiro modelo daquele provider)
	const handleProviderChange = (newProvider: AIProvider) => {
		setSelectedProvider(newProvider);

		if (newProvider === "openrouter") {
			// Para OpenRouter, usa o modelo customizado ou limpa o valor
			onValueChange(customModel || "");
			return;
		}

		const firstModel = modelsByProvider[newProvider][0];
		if (firstModel) {
			onValueChange(firstModel.id);
		}
	};

	// Atualizar modelo customizado do OpenRouter
	const handleCustomModelChange = (modelName: string) => {
		setCustomModel(modelName);
		onValueChange(modelName);
	};

	return (
		<Card className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 items-start p-6">
			{/* Descrição */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold">Definir modelo de análise</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					Escolha o provedor de IA e o modelo específico que será utilizado para
					gerar insights sobre seus dados financeiros. <br />
					Diferentes modelos podem oferecer perspectivas variadas na análise.
				</p>
			</div>

			{/* Seletor */}
			<div className="flex flex-col gap-4 min-w-xs">
				<RadioGroup
					value={currentProvider}
					onValueChange={(v) => handleProviderChange(v as AIProvider)}
					disabled={disabled}
					className="gap-3"
				>
					{(Object.keys(PROVIDERS) as AIProvider[]).map((providerId) => {
						const provider = PROVIDERS[providerId];
						const iconPaths = PROVIDER_ICON_PATHS[providerId];

						return (
							<div key={providerId} className="flex items-center gap-3">
								<RadioGroupItem
									value={providerId}
									id={`provider-${providerId}`}
									disabled={disabled}
								/>
								<div className="size-6 relative">
									<Image
										src={iconPaths.light}
										alt={provider.name}
										width={22}
										height={22}
										className={iconPaths.dark ? "dark:hidden" : ""}
									/>
									{iconPaths.dark && (
										<Image
											src={iconPaths.dark}
											alt={provider.name}
											width={22}
											height={22}
											className="hidden dark:block"
										/>
									)}
								</div>
								<Label
									htmlFor={`provider-${providerId}`}
									className="text-sm font-medium cursor-pointer flex-1"
								>
									{provider.name}
								</Label>
							</div>
						);
					})}
				</RadioGroup>

				{/* Seletor de Modelo */}
				{currentProvider === "openrouter" ? (
					<div className="space-y-2">
						<Input
							value={customModel}
							onChange={(e) => handleCustomModelChange(e.target.value)}
							placeholder="Ex: anthropic/claude-3.5-sonnet"
							disabled={disabled}
							className="border-none bg-neutral-200 dark:bg-neutral-800"
						/>
						<a
							href="https://openrouter.ai/models"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							<RiExternalLinkLine className="h-3 w-3" />
							Ver modelos disponíveis no OpenRouter
						</a>
					</div>
				) : (
					<Select
						value={value}
						onValueChange={onValueChange}
						disabled={disabled}
					>
						<SelectTrigger
							disabled={disabled}
							className="border-none bg-neutral-200 dark:bg-neutral-800"
						>
							<SelectValue placeholder="Selecione um modelo" />
						</SelectTrigger>
						<SelectContent>
							{modelsByProvider[currentProvider].map((model) => (
								<SelectItem key={model.id} value={model.id}>
									{model.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
		</Card>
	);
}
