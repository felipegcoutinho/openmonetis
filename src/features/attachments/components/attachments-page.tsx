"use client";

import {
	RiAttachmentLine,
	RiFilePdf2Line,
	RiImageLine,
} from "@remixicon/react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";
import { AttachmentGridItem } from "@/features/attachments/components/attachment-grid-item";
import { AttachmentPreview } from "@/features/attachments/components/attachment-preview";
import { useAttachmentUrl } from "@/features/attachments/hooks/use-attachment-url";
import type { AttachmentForPeriod } from "@/features/attachments/queries";
import { fetchTransactionByIdAction } from "@/features/transactions/actions/fetch-by-id";
import type { TransactionDialogOptions } from "@/features/transactions/actions/fetch-dialog-options";
import { fetchTransactionDialogOptionsAction } from "@/features/transactions/actions/fetch-dialog-options";
import { TransactionDetailsDialog } from "@/features/transactions/components/dialogs/transaction-details-dialog";
import { TransactionDialog } from "@/features/transactions/components/dialogs/transaction-dialog/transaction-dialog";
import type { TransactionItem } from "@/features/transactions/components/types";
import { EmptyState } from "@/shared/components/empty-state";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import PageDescription from "@/shared/components/page-description";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/ui";

type FilterType = "all" | "images" | "pdfs";

function AttachmentGridItemWithUrl({
	attachment,
	onClick,
	onDetails,
	isLoadingDetails,
}: {
	attachment: AttachmentForPeriod;
	onClick: () => void;
	onDetails: () => void;
	isLoadingDetails: boolean;
}) {
	const { url, containerRef } = useAttachmentUrl(attachment.attachmentId);
	return (
		<div ref={containerRef}>
			<AttachmentGridItem
				attachment={attachment}
				url={url ?? undefined}
				onClick={onClick}
				onDetails={onDetails}
				isLoadingDetails={isLoadingDetails}
			/>
		</div>
	);
}

const FILTERS: {
	value: FilterType;
	label: string;
	icon: React.ReactNode;
}[] = [
	{
		value: "all",
		label: "Todos",
		icon: <RiAttachmentLine className="size-3.5" />,
	},
	{
		value: "images",
		label: "Imagens",
		icon: <RiImageLine className="size-3.5 text-blue-500" />,
	},
	{
		value: "pdfs",
		label: "PDFs",
		icon: <RiFilePdf2Line className="size-3.5 text-red-500" />,
	},
];

interface AttachmentsPageProps {
	attachments: AttachmentForPeriod[];
}

export function AttachmentsPage({ attachments }: AttachmentsPageProps) {
	const router = useRouter();
	const [filter, setFilter] = useState<FilterType>("all");
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [transactionDetails, setTransactionDetails] =
		useState<TransactionItem | null>(null);
	const [loadingTransactionId, setLoadingTransactionId] = useState<
		string | null
	>(null);
	const [isPending, startTransition] = useTransition();

	// Edit dialog state
	const [editOpen, setEditOpen] = useState(false);
	const [transactionToEdit, setTransactionToEdit] =
		useState<TransactionItem | null>(null);
	const [dialogOptions, setDialogOptions] =
		useState<TransactionDialogOptions | null>(null);

	const filteredAttachments = attachments.filter((a) => {
		if (filter === "images") return a.mimeType.startsWith("image/");
		if (filter === "pdfs") return a.mimeType === "application/pdf";
		return true;
	});

	const imageCount = attachments.filter((a) =>
		a.mimeType.startsWith("image/"),
	).length;
	const pdfCount = attachments.filter(
		(a) => a.mimeType === "application/pdf",
	).length;

	const counts: Record<FilterType, number> = {
		all: attachments.length,
		images: imageCount,
		pdfs: pdfCount,
	};

	function handleSelect(attachment: AttachmentForPeriod) {
		const idx = filteredAttachments.findIndex(
			(a) =>
				a.attachmentId === attachment.attachmentId &&
				a.transactionId === attachment.transactionId,
		);
		setSelectedIndex(idx);
	}

	function handleDetails(transactionId: string) {
		setLoadingTransactionId(transactionId);
		startTransition(async () => {
			const transaction = await fetchTransactionByIdAction(transactionId);
			setLoadingTransactionId(null);
			if (transaction) setTransactionDetails(transaction);
		});
	}

	function handleEdit(transaction: TransactionItem) {
		setTransactionToEdit(transaction);
		startTransition(async () => {
			const options = await fetchTransactionDialogOptionsAction();
			setDialogOptions(options);
			setEditOpen(true);
		});
	}

	return (
		<div className="w-full space-y-6">
			<PageDescription
				icon={<RiAttachmentLine className="size-5" />}
				title="Anexos"
				subtitle="Comprovantes e documentos dos seus lançamentos no mês."
			/>

			<MonthNavigation />

			<Card>
				<CardContent>
					{attachments.length === 0 ? (
						<div className="flex w-full items-center justify-center py-12">
							<EmptyState
								media={<RiAttachmentLine className="size-6 text-primary" />}
								title="Nenhum anexo neste mês"
								description="Adicione comprovantes nos seus lançamentos para vê-los aqui."
							/>
						</div>
					) : (
						<div className="space-y-4">
							{/* Header: filtros + contagem */}
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-muted-foreground">
									{filteredAttachments.length}{" "}
									{filteredAttachments.length === 1 ? "anexo" : "anexos"}
									{filter !== "all" &&
										` · ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()}`}
								</p>
								<div className="flex items-center gap-1 rounded-lg border p-1">
									{FILTERS.map(({ value, label, icon }) => (
										<button
											key={value}
											type="button"
											onClick={() => {
												setFilter(value);
												setSelectedIndex(-1);
											}}
											className={cn(
												"flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
												filter === value
													? "bg-primary text-primary-foreground [&_svg]:opacity-100"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											<span className={cn(filter !== value && "opacity-60")}>
												{icon}
											</span>
											{label}{" "}
											<span
												className={cn(
													"tabular-nums",
													filter === value ? "opacity-80" : "opacity-60",
												)}
											>
												({counts[value]})
											</span>
										</button>
									))}
								</div>
							</div>

							{filteredAttachments.length === 0 ? (
								<div className="flex w-full items-center justify-center py-12">
									<EmptyState
										media={<RiAttachmentLine className="size-6 text-primary" />}
										title="Nenhum anexo encontrado"
										description="Não há anexos do tipo selecionado neste mês."
									/>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
									{filteredAttachments.map((attachment) => (
										<AttachmentGridItemWithUrl
											key={`${attachment.attachmentId}-${attachment.transactionId}`}
											attachment={attachment}
											onClick={() => handleSelect(attachment)}
											onDetails={() => handleDetails(attachment.transactionId)}
											isLoadingDetails={
												isPending &&
												loadingTransactionId === attachment.transactionId
											}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<AttachmentPreview
				attachments={filteredAttachments}
				selectedIndex={selectedIndex}
				onClose={() => setSelectedIndex(-1)}
			/>

			<TransactionDetailsDialog
				open={!!transactionDetails}
				onOpenChange={(open) => {
					if (!open) setTransactionDetails(null);
				}}
				transaction={transactionDetails}
				onEdit={handleEdit}
			/>

			{dialogOptions && transactionToEdit && (
				<TransactionDialog
					mode="update"
					open={editOpen}
					onOpenChange={(open) => {
						setEditOpen(open);
						if (!open) {
							setTransactionToEdit(null);
							setDialogOptions(null);
							router.refresh();
						}
					}}
					transaction={transactionToEdit}
					payerOptions={dialogOptions.payerOptions}
					splitPayerOptions={dialogOptions.splitPayerOptions}
					defaultPayerId={dialogOptions.defaultPayerId}
					accountOptions={dialogOptions.accountOptions}
					cardOptions={dialogOptions.cardOptions}
					categoryOptions={dialogOptions.categoryOptions}
					estabelecimentos={dialogOptions.estabelecimentos}
				/>
			)}
		</div>
	);
}
