"use client";

import {
	RiArrowGoBackLine,
	RiCheckLine,
	RiDeleteBinLine,
	RiFileList2Line,
} from "@remixicon/react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import { memo } from "react";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { resolveLogoSrc } from "@/shared/lib/logo";
import type { InboxItem } from "./types";

const DEFAULT_INBOX_APP_LOGO = "/avatars/default_icon.png";

function findMatchingLogo(
	sourceAppName: string | null,
	appLogoMap: Record<string, string>,
): string | null {
	if (!sourceAppName) return null;

	const appName = sourceAppName.toLowerCase();

	if (appLogoMap[appName]) return resolveLogoSrc(appLogoMap[appName]);

	for (const [name, logo] of Object.entries(appLogoMap)) {
		if (name.includes(appName) || appName.includes(name)) {
			return resolveLogoSrc(logo);
		}
	}

	return null;
}

interface InboxCardProps {
	item: InboxItem;
	readonly?: boolean;
	appLogoMap?: Record<string, string>;
	onProcess?: (item: InboxItem) => void;
	onDiscard?: (item: InboxItem) => void;
	onViewDetails?: (item: InboxItem) => void;
	onDelete?: (item: InboxItem) => void;
	onRestoreToPending?: (item: InboxItem) => void | Promise<void>;
	selected?: boolean;
	onSelectToggle?: (id: string) => void;
}

export const InboxCard = memo(function InboxCard({
	item,
	readonly,
	appLogoMap,
	onProcess,
	onDiscard,
	onViewDetails,
	onDelete,
	onRestoreToPending,
	selected,
	onSelectToggle,
}: InboxCardProps) {
	const matchedLogo = appLogoMap
		? findMatchingLogo(item.sourceAppName, appLogoMap)
		: null;
	const displayLogo = matchedLogo ?? DEFAULT_INBOX_APP_LOGO;

	const amount = item.parsedAmount ? parseFloat(item.parsedAmount) : null;

	const createdAtDate = new Date(item.createdAt);

	const timeAgo = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
		locale: ptBR,
	});

	const fullDate = format(createdAtDate, "PPpp", { locale: ptBR });

	const statusDate =
		item.status === "processed"
			? item.processedAt
			: item.status === "discarded"
				? item.discardedAt
				: null;

	const formattedStatusDate = statusDate
		? format(new Date(statusDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
		: null;

	return (
		<Card
			className={`flex h-54 flex-col gap-0 py-0 transition-colors ${selected ? "ring-2 ring-primary/30" : ""}`}
		>
			<CardHeader className="pt-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex min-w-0 items-center gap-3 text-sm">
						{onSelectToggle && (
							<Checkbox
								checked={!!selected}
								onCheckedChange={() => onSelectToggle(item.id)}
								aria-label="Selecionar item"
								className="shrink-0"
							/>
						)}
						<div className="relative shrink-0 overflow-hidden ">
							<Image
								src={displayLogo}
								alt={item.sourceAppName || item.sourceApp}
								width={40}
								height={40}
								className="size-10 rounded-full object-cover"
							/>
						</div>
						<div className="flex min-w-0 flex-col">
							<span className="truncate font-semibold text-base">
								{item.sourceAppName || item.sourceApp}
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="cursor-default text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
										{timeAgo}
									</span>
								</TooltipTrigger>
								<TooltipContent>{fullDate}</TooltipContent>
							</Tooltip>
						</div>
					</CardTitle>
					{amount !== null && (
						<MoneyValues
							amount={amount}
							className="shrink-0 text-base font-semibold"
						/>
					)}
				</div>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 overflow-hidden py-2">
				{item.originalTitle && (
					<p className="mb-1 line-clamp-2 text-sm font-medium">{item.originalTitle}</p>
				)}
				<p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
					{item.originalText}
				</p>
			</CardContent>

			{readonly ? (
				<CardFooter className="gap-2 pb-4 pt-3">
					<Badge
						variant={item.status === "processed" ? "default" : "secondary"}
					>
						{item.status === "processed" ? "Processado" : "Descartado"}
					</Badge>
					{formattedStatusDate && (
						<span className="text-xs text-muted-foreground">
							{formattedStatusDate}
						</span>
					)}
					<div className="ml-auto flex items-center gap-2">
						{item.status === "discarded" && onRestoreToPending && (
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-muted-foreground hover:text-foreground"
								onClick={() => onRestoreToPending(item)}
								aria-label="Voltar para pendente"
								title="Voltar para pendente"
							>
								<RiArrowGoBackLine className="size-4" />
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-muted-foreground hover:text-destructive"
								onClick={() => onDelete(item)}
								aria-label="Excluir notificação"
							>
								<RiDeleteBinLine className="size-4" />
							</Button>
						)}
					</div>
				</CardFooter>
			) : (
				<CardFooter className="gap-2 pb-4 pt-3">
					<Button
						size="sm"
						className="flex-1"
						onClick={() => onProcess?.(item)}
					>
						<RiCheckLine className="mr-1.5 size-4" />
						Processar
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => onViewDetails?.(item)}
						className="text-muted-foreground hover:text-foreground"
						aria-label="Ver detalhes"
						title="Ver detalhes"
					>
						<RiFileList2Line className="size-4" />
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => onDiscard?.(item)}
						className="text-muted-foreground hover:text-destructive"
						aria-label="Descartar notificação"
						title="Descartar notificação"
					>
						<RiDeleteBinLine className="size-4" />
					</Button>
				</CardFooter>
			)}
		</Card>
	);
});
