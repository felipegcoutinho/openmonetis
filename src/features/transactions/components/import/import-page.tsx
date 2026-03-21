"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	fetchCategoryMappings,
	saveCategoryMappings,
} from "@/features/transactions/actions/category-memory-action";
import { normalizeDescriptionKey } from "@/features/transactions/lib/import-utils";
import {
	checkDuplicateFitIds,
	deleteTransactionByFitId,
	importTransactionsAction,
	undoImportAction,
} from "@/features/transactions/actions/import-action";
import {
	decodeAccountCard,
	encodeAccountCard,
	GlobalFields,
} from "@/features/transactions/components/import/global-fields";
import { ImportSteps } from "@/features/transactions/components/import/import-steps";
import { ImportSummary } from "@/features/transactions/components/import/import-summary";
import {
	type ReviewRow,
	ReviewTable,
} from "@/features/transactions/components/import/review-table";
import { UploadZone } from "@/features/transactions/components/import/upload-zone";
import type { SelectOption } from "@/features/transactions/components/types";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { ImportStatement } from "@/shared/lib/import/types";

interface ImportPageProps {
	payerOptions: SelectOption[];
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	defaultPayerId: string | null;
}

export function ImportPage({
	payerOptions,
	accountOptions,
	cardOptions,
	categoryOptions,
	defaultPayerId,
}: ImportPageProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isChecking, setIsChecking] = useState(false);

	const [statement, setStatement] = useState<ImportStatement | null>(null);
	const [rows, setRows] = useState<ReviewRow[]>([]);
	const [payerId, setPayerId] = useState<string | null>(defaultPayerId);
	const [accountCardValue, setAccountCardValue] = useState<string | null>(null);
	const [invoicePeriod, setInvoicePeriod] = useState<string | null>(null);

	const handleParsed = useCallback(async (stmt: ImportStatement) => {
		setStatement(stmt);
		setIsChecking(true);

		try {
			const fitIds = stmt.transactions
				.map((t) => t.externalId)
				.filter((id): id is string => id !== null);

			const [duplicates, categoryMappings] = await Promise.all([
				checkDuplicateFitIds(fitIds).then((ids) => new Set(ids)),
				fetchCategoryMappings(stmt.transactions.map((t) => t.description)),
			]);

			setRows(
				stmt.transactions.map((t) => ({
					...t,
					isDuplicate: t.externalId ? duplicates.has(t.externalId) : false,
					selected: t.externalId ? !duplicates.has(t.externalId) : true,
					categoryId: categoryMappings[normalizeDescriptionKey(t.description)] ?? null,
				})),
			);
		} finally {
			setIsChecking(false);
		}
	}, []);

	// Pré-seleciona cartão ou conta com base no tipo detectado no OFX
	useEffect(() => {
		if (!statement || accountCardValue) return;
		if (statement.isCreditCard && cardOptions[0]) {
			setAccountCardValue(encodeAccountCard("card", cardOptions[0].value));
		} else if (!statement.isCreditCard && accountOptions[0]) {
			setAccountCardValue(
				encodeAccountCard("account", accountOptions[0].value),
			);
		}
	}, [statement, cardOptions, accountOptions, accountCardValue]);

	const toggleRow = (index: number) => {
		setRows((prev) =>
			prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)),
		);
	};

	const toggleAll = (selected: boolean) => {
		setRows((prev) => prev.map((r) => ({ ...r, selected })));
	};

	const handleCategoryChange = (index: number, categoryId: string | null) => {
		setRows((prev) =>
			prev.map((r, i) => (i === index ? { ...r, categoryId } : r)),
		);
	};

	const handleUndoDuplicate = async (index: number) => {
		const row = rows[index];
		if (!row?.externalId) return;

		const result = await deleteTransactionByFitId(row.externalId);
		if (!result.success) {
			toast.error("Não foi possível desfazer a importação anterior.");
			return;
		}

		setRows((prev) =>
			prev.map((r, i) =>
				i === index ? { ...r, isDuplicate: false, selected: true } : r,
			),
		);
		toast.success("Importação anterior removida.");
	};

	const handleDescriptionChange = (index: number, description: string) => {
		setRows((prev) =>
			prev.map((r, i) => (i === index ? { ...r, description } : r)),
		);
	};

	const handleBulkCategoryChange = (categoryId: string) => {
		setRows((prev) => prev.map((r) => (r.selected ? { ...r, categoryId } : r)));
	};

	const isCard = accountCardValue?.startsWith("card:") ?? false;

	const { selectedRows, duplicateCount, uncategorizedCount } = useMemo(() => {
		const selected = rows.filter((r) => r.selected);
		return {
			selectedRows: selected,
			duplicateCount: rows.filter((r) => r.isDuplicate).length,
			uncategorizedCount: selected.filter((r) => !r.categoryId).length,
		};
	}, [rows]);

	const canImport =
		selectedRows.length > 0 &&
		!!accountCardValue &&
		uncategorizedCount === 0 &&
		(!isCard || !!invoicePeriod) &&
		!isPending;

	const handleImport = () => {
		if (!statement || !canImport) return;

		const decoded = decodeAccountCard(accountCardValue!);
		const cardId = decoded?.type === "card" ? decoded.id : null;
		const accountId = decoded?.type === "account" ? decoded.id : null;
		const paymentMethod =
			decoded?.type === "card" ? "Cartão de crédito" : "Pix";

		startTransition(async () => {
			const result = await importTransactionsAction({
				rows: selectedRows.map((r) => ({
					externalId: r.externalId,
					date: r.date,
					amount: r.amount,
					description: r.description,
					transactionType: r.transactionType,
					categoryId: r.categoryId,
				})),
				payerId,
				accountId,
				cardId,
				paymentMethod,
				invoicePeriod,
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			// Salva mapeamentos description → category (fire-and-forget)
			saveCategoryMappings(
				selectedRows.map((r) => ({ description: r.description, categoryId: r.categoryId })),
			);

			const { importBatchId } = result;
			const msg =
				result.skipped > 0
					? `${result.imported} importados, ${result.skipped} duplicatas ignoradas.`
					: `${result.imported} lançamentos importados.`;

			router.push("/transactions");

			toast.success(msg, {
				duration: 8000,
				action: importBatchId
					? {
							label: "Desfazer",
							onClick: async () => {
								const undo = await undoImportAction(importBatchId);
								if (undo.success) {
									toast.success("Importação desfeita.");
								} else {
									toast.error("Não foi possível desfazer.");
								}
							},
						}
					: undefined,
			});
		});
	};

	const currentStep = !statement ? "upload" : isPending ? "done" : "review";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-4">
					<div>
						<CardTitle>Importar extrato</CardTitle>
						<CardDescription>
							Importe transações a partir de um arquivo .ofx ou planilha .xlsx exportado pelo seu banco.
						</CardDescription>
					</div>
					<ImportSteps current={currentStep} />
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-6">
					{!statement || isChecking ? (
						<>
							{!statement && <UploadZone onParsed={handleParsed} />}
							{isChecking && (
								<div className="flex flex-col gap-3">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<div className="flex flex-col gap-2 rounded-lg border p-4">
										{Array.from({ length: 6 }).map((_, i) => (
											<Skeleton key={i} className="h-8 w-full" />
										))}
									</div>
								</div>
							)}
						</>
					) : (
						<>
							<ImportSummary
								statement={statement}
								total={rows.length}
								selected={selectedRows.length}
								duplicates={duplicateCount}
								uncategorized={uncategorizedCount}
							/>

							<GlobalFields
								accountOptions={accountOptions}
								cardOptions={cardOptions}
								payerOptions={payerOptions}
								categoryOptions={categoryOptions}
								accountCardValue={accountCardValue}
								payerId={payerId}
								invoicePeriod={invoicePeriod}
								onAccountCardChange={setAccountCardValue}
								onPayerChange={setPayerId}
								onInvoicePeriodChange={setInvoicePeriod}
								onBulkCategoryChange={handleBulkCategoryChange}
							/>

							<ReviewTable
								rows={rows}
								categoryOptions={categoryOptions}
								onToggle={toggleRow}
								onToggleAll={toggleAll}
								onCategoryChange={handleCategoryChange}
								onDescriptionChange={handleDescriptionChange}
								onUndoDuplicate={handleUndoDuplicate}
							/>

							{/* Sticky footer */}
							<div className="sticky bottom-0 -mx-6 border-t bg-background px-6 py-4">
								<div className="flex items-center justify-between gap-4">
									<Button
										variant="outline"
										onClick={() => {
											setStatement(null);
											setRows([]);
											setAccountCardValue(null);
											setInvoicePeriod(null);
										}}
									>
										Trocar arquivo
									</Button>

									<div className="flex items-center gap-3">
										{!accountCardValue ? (
											<p className="text-muted-foreground text-sm">
												Selecione uma conta ou cartão para continuar.
											</p>
										) : uncategorizedCount > 0 ? (
											<p className="text-muted-foreground text-sm">
												{uncategorizedCount} lançamento
												{uncategorizedCount !== 1 ? "s" : ""} sem categoria.
											</p>
										) : isCard && !invoicePeriod ? (
											<p className="text-muted-foreground text-sm">
												Selecione a fatura para continuar.
											</p>
										) : null}
										<Button onClick={handleImport} disabled={!canImport}>
											{isPending
												? "Importando…"
												: `Importar ${selectedRows.length} lançamento${selectedRows.length !== 1 ? "s" : ""}`}
										</Button>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
