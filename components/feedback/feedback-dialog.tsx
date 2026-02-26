"use client";

import {
	RiBugLine,
	RiExternalLinkLine,
	RiLightbulbLine,
	RiMessageLine,
	RiQuestionLine,
	RiStarLine,
} from "@remixicon/react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const GITHUB_REPO_BASE = "https://github.com/felipegcoutinho/openmonetis";
const GITHUB_DISCUSSIONS_BASE = `${GITHUB_REPO_BASE}/discussions/new`;
const GITHUB_ISSUES_URL = `${GITHUB_REPO_BASE}/issues/new`;

const feedbackCategories = [
	{
		id: "bug",
		title: "Reportar Bug",
		icon: RiBugLine,
		description: "Encontrou algo que não está funcionando?",
		color: "text-destructive",
		url: GITHUB_ISSUES_URL,
	},
	{
		id: "idea",
		title: "Sugerir Feature",
		icon: RiLightbulbLine,
		description: "Tem uma ideia para melhorar o app?",
		color: "text-warning",
		url: `${GITHUB_DISCUSSIONS_BASE}?category=ideias`,
	},
	{
		id: "question",
		title: "Dúvidas/Suporte",
		icon: RiQuestionLine,
		description: "Precisa de ajuda com alguma coisa?",
		color: "text-info",
		url: `${GITHUB_DISCUSSIONS_BASE}?category=q-a`,
	},
	{
		id: "experience",
		title: "Compartilhar Experiência",
		icon: RiStarLine,
		description: "Como o OpenMonetis tem ajudado você?",
		color: "text-purple-500 dark:text-purple-400",
		url: `${GITHUB_DISCUSSIONS_BASE}?category=sua-experiencia`,
	},
];

export function FeedbackDialogBody({ onClose }: { onClose?: () => void }) {
	const handleCategoryClick = (url: string) => {
		window.open(url, "_blank", "noopener,noreferrer");
		onClose?.();
	};

	return (
		<DialogContent className="sm:max-w-[500px]">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<RiMessageLine className="h-5 w-5" />
					Enviar Feedback
				</DialogTitle>
				<DialogDescription>
					Sua opinião é muito importante! Escolha o tipo de feedback que deseja
					compartilhar.
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-3 py-4">
				{feedbackCategories.map((item) => {
					const Icon = item.icon;
					return (
						<button
							key={item.id}
							onClick={() => handleCategoryClick(item.url)}
							className={cn(
								"flex items-start gap-3 p-4 rounded-lg border transition-all",
								"hover:border-primary hover:bg-accent/50",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
							)}
						>
							<div
								className={cn(
									"flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
									"bg-muted",
								)}
							>
								<Icon className={cn("h-5 w-5", item.color)} />
							</div>
							<div className="flex-1 text-left space-y-1">
								<h3 className="font-semibold text-sm flex items-center gap-2">
									{item.title}
									<RiExternalLinkLine className="h-3.5 w-3.5 text-muted-foreground" />
								</h3>
								<p className="text-sm text-muted-foreground">
									{item.description}
								</p>
							</div>
						</button>
					);
				})}
			</div>

			<div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
				<RiExternalLinkLine className="h-4 w-4 shrink-0 mt-0.5" />
				<p>
					Você será redirecionado para o GitHub Discussions onde poderá escrever
					seu feedback. É necessário ter uma conta no GitHub.
				</p>
			</div>
		</DialogContent>
	);
}

export function FeedbackDialog() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								buttonVariants({ variant: "ghost", size: "icon-sm" }),
								"group relative text-muted-foreground transition-all duration-200",
								"hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
								"data-[state=open]:bg-accent/60 data-[state=open]:text-foreground border",
							)}
						>
							<RiMessageLine className="h-5 w-5" />
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>Enviar Feedback</TooltipContent>
			</Tooltip>
			<FeedbackDialogBody onClose={() => setOpen(false)} />
		</Dialog>
	);
}
