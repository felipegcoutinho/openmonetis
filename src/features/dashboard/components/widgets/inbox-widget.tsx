"use client";

import {
	RiCheckboxCircleFill,
	RiCheckLine,
	RiDeleteBinLine,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { DashboardInboxSnapshot } from "@/features/dashboard/lib/inbox-snapshot-queries";
import type { DashboardWidgetQuickActionOptions } from "@/features/dashboard/widget-registry/widget-config";
import {
	discardInboxItemAction,
	markInboxAsProcessedAction,
} from "@/features/inbox/actions";
import { TransactionDialog } from "@/features/transactions/components/dialogs/transaction-dialog/transaction-dialog";
import { ConfirmActionDialog } from "@/shared/components/confirm-action-dialog";
import MoneyValues from "@/shared/components/money-values";
import { Button } from "@/shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import { resolveLogoSrc } from "@/shared/lib/logo";

const DEFAULT_INBOX_APP_LOGO = "/avatars/default_icon.png";

function relativeTime(date: Date): string {
	const diff = Date.now() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "agora";
	if (minutes < 60) return `há ${minutes}min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `há ${hours}h`;
	const days = Math.floor(hours / 24);
	return `há ${days}d`;
}

type InboxWidgetProps = {
	snapshot: DashboardInboxSnapshot;
	quickActionOptions: DashboardWidgetQuickActionOptions;
};

function getDateString(date: Date | string | null | undefined): string | null {
	if (!date) return null;
	if (typeof date === "string") return date.slice(0, 10);
	return date.toISOString().slice(0, 10);
}

function findMatchingLogo(
	sourceAppName: string | null,
	logoMap: Record<string, string>,
): string | null {
	if (!sourceAppName) return null;

	const appName = sourceAppName.toLowerCase();
	if (logoMap[appName]) return resolveLogoSrc(logoMap[appName]);

	for (const [name, logo] of Object.entries(logoMap)) {
		if (name.includes(appName) || appName.includes(name)) {
			return resolveLogoSrc(logo);
		}
	}

	return null;
}

export function InboxWidget({
	snapshot,
	quickActionOptions,
}: InboxWidgetProps) {
	const router = useRouter();
	const [processOpen, setProcessOpen] = useState(false);
	const [discardOpen, setDiscardOpen] = useState(false);
	const [itemToProcess, setItemToProcess] = useState<
		DashboardInboxSnapshot["recentItems"][number] | null
	>(null);
	const [itemToDiscard, setItemToDiscard] = useState<
		DashboardInboxSnapshot["recentItems"][number] | null
	>(null);

	const handleProcessOpenChange = (open: boolean) => {
		setProcessOpen(open);
		if (!open) setItemToProcess(null);
	};

	const handleDiscardOpenChange = (open: boolean) => {
		setDiscardOpen(open);
		if (!open) setItemToDiscard(null);
	};

	const handleProcessRequest = (
		item: DashboardInboxSnapshot["recentItems"][number],
	) => {
		setItemToProcess(item);
		setProcessOpen(true);
	};

	const handleDiscardRequest = (
		item: DashboardInboxSnapshot["recentItems"][number],
	) => {
		setItemToDiscard(item);
		setDiscardOpen(true);
	};

	const refreshWidget = () => {
		router.refresh();
	};

	const handleDiscardConfirm = async () => {
		if (!itemToDiscard) return;

		const result = await discardInboxItemAction({
			inboxItemId: itemToDiscard.id,
		});

		if (result.success) {
			toast.success(result.message);
			refreshWidget();
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const handleLancamentoSuccess = async () => {
		if (!itemToProcess) return;

		const result = await markInboxAsProcessedAction({
			inboxItemId: itemToProcess.id,
		});

		if (result.success) {
			toast.success("Notificação processada!");
			refreshWidget();
			return;
		}

		toast.error(result.error);
	};

	const defaultPurchaseDate =
		getDateString(itemToProcess?.notificationTimestamp) ?? null;
	const defaultName = itemToProcess?.parsedName
		? itemToProcess.parsedName
				.toLowerCase()
				.replace(/\b\w/g, (char) => char.toUpperCase())
		: null;
	const defaultAmount = itemToProcess?.parsedAmount
		? String(Math.abs(Number(itemToProcess.parsedAmount)))
		: null;

	const matchedCardId = useMemo(() => {
		const appName = itemToProcess?.sourceAppName?.toLowerCase();
		if (!appName) return null;

		for (const option of quickActionOptions.cardOptions) {
			const label = option.label.toLowerCase();
			if (label.includes(appName) || appName.includes(label)) {
				return option.value;
			}
		}

		return null;
	}, [itemToProcess?.sourceAppName, quickActionOptions.cardOptions]);

	if (snapshot.pendingCount === 0) {
		return (
			<WidgetEmptyState
				icon={<RiCheckboxCircleFill className="size-6 text-success" />}
				title="Tudo em dia"
				description="Nenhum pré-lançamento aguardando revisão."
			/>
		);
	}

	const remainingCount = Math.max(
		snapshot.pendingCount - snapshot.recentItems.length,
		0,
	);

	return (
		<div className="flex flex-col">
			{snapshot.recentItems.map((item) => {
				const displayName = item.parsedName ?? item.originalText.slice(0, 40);
				const parsedAmount =
					item.parsedAmount !== null
						? Number.parseFloat(item.parsedAmount)
						: null;
				const amount =
					parsedAmount !== null && Number.isFinite(parsedAmount)
						? parsedAmount
						: null;
				const logoSrc = findMatchingLogo(item.sourceAppName, snapshot.logoMap);
				const displayLogo = logoSrc ?? DEFAULT_INBOX_APP_LOGO;

				return (
					<div key={item.id} className="flex items-center justify-between py-2">
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<Image
								src={displayLogo}
								alt={item.sourceAppName ?? ""}
								width={38}
								height={38}
								className="size-9.5 shrink-0 rounded-full object-contain"
								unoptimized
							/>

							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-foreground">
									{displayName}
								</p>
								<div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
									{item.sourceAppName && (
										<span className="truncate">{item.sourceAppName}</span>
									)}
									<span className="text-muted-foreground/60">
										{relativeTime(item.notificationTimestamp)}
									</span>
								</div>
							</div>
						</div>

						<div className="ml-2 flex shrink-0 items-center gap-1">
							{amount !== null && (
								<MoneyValues className="font-medium" amount={amount} />
							)}
							{amount === null && (
								<span className="max-w-20 text-right text-xs leading-tight text-muted-foreground">
									Valor não identificado
								</span>
							)}
							<div className="flex items-center">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon-sm"
											variant="ghost"
											className="text-muted-foreground hover:text-foreground"
											onClick={() => handleProcessRequest(item)}
											aria-label="Lançar notificação"
										>
											<RiCheckLine className="size-3.5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top">Lançar</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon-sm"
											variant="ghost"
											className="text-muted-foreground hover:text-destructive"
											onClick={() => handleDiscardRequest(item)}
											aria-label="Descartar notificação"
										>
											<RiDeleteBinLine className="size-3.5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top">Descartar</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</div>
				);
			})}

			{remainingCount > 0 && (
				<Link
					href="/inbox"
					className="mt-2 inline-flex items-center justify-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
				>
					+ {remainingCount} pendentes · Revisar todos
				</Link>
			)}

			<TransactionDialog
				mode="create"
				open={processOpen}
				onOpenChange={handleProcessOpenChange}
				payerOptions={quickActionOptions.payerOptions}
				splitPayerOptions={quickActionOptions.splitPayerOptions}
				defaultPayerId={quickActionOptions.defaultPayerId}
				accountOptions={quickActionOptions.accountOptions}
				cardOptions={quickActionOptions.cardOptions}
				categoryOptions={quickActionOptions.categoryOptions}
				estabelecimentos={quickActionOptions.estabelecimentos}
				defaultPurchaseDate={defaultPurchaseDate}
				defaultName={defaultName}
				defaultAmount={defaultAmount}
				defaultCardId={matchedCardId}
				defaultPaymentMethod={matchedCardId ? "Cartão de crédito" : null}
				defaultTransactionType="Despesa"
				forceShowTransactionType
				onSuccess={handleLancamentoSuccess}
			/>

			<ConfirmActionDialog
				open={discardOpen}
				onOpenChange={handleDiscardOpenChange}
				title="Descartar notificação?"
				description="A notificação será marcada como descartada e não aparecerá mais na lista de pendentes."
				confirmLabel="Descartar"
				confirmVariant="destructive"
				pendingLabel="Descartando..."
				onConfirm={handleDiscardConfirm}
			/>
		</div>
	);
}
