"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CategorySelectContent } from "@/features/transactions/components/select-items";
import type { SelectOption } from "@/features/transactions/components/types";
import MoneyValues from "@/shared/components/money-values";
import { TransactionTypeBadge } from "@/shared/components/transaction-type-badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { ImportedTransaction } from "@/shared/lib/import/types";
import { formatDate } from "@/shared/utils/date";

export type ReviewRow = ImportedTransaction & {
	selected: boolean;
	isDuplicate: boolean;
	categoryId: string | null;
};

interface ReviewTableProps {
	rows: ReviewRow[];
	categoryOptions: SelectOption[];
	onToggle: (index: number) => void;
	onToggleAll: (selected: boolean) => void;
	onCategoryChange: (index: number, categoryId: string | null) => void;
	onDescriptionChange: (index: number, description: string) => void;
	onUndoDuplicate: (index: number) => void;
}

export function ReviewTable({
	rows,
	categoryOptions,
	onToggle,
	onToggleAll,
	onCategoryChange,
	onDescriptionChange,
	onUndoDuplicate,
}: ReviewTableProps) {
	const allSelected = rows.every((r) => r.selected);
	const someSelected = rows.some((r) => r.selected);

	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 44,
		overscan: 8,
	});

	const virtualRows = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();
	const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
	const paddingBottom =
		virtualRows.length > 0
			? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
			: 0;

	return (
		<TooltipProvider>
			<div
				ref={parentRef}
				className="max-h-[480px] overflow-auto rounded-lg border"
			>
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-background">
						<TableRow>
							<TableHead className="w-10">
								<Checkbox
									checked={allSelected}
									onCheckedChange={(v) => onToggleAll(!!v)}
									aria-label="Selecionar todas"
									data-state={
										!allSelected && someSelected
											? "indeterminate"
											: undefined
									}
								/>
							</TableHead>
							<TableHead className="w-24">Data</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead className="w-44">Categoria</TableHead>
							<TableHead className="w-20">Tipo</TableHead>
							<TableHead className="w-28 text-right">Valor</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paddingTop > 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									style={{ height: paddingTop, padding: 0 }}
								/>
							</TableRow>
						)}
						{virtualRows.map((virtualRow) => {
							const row = rows[virtualRow.index]!;
							const index = virtualRow.index;
							return (
								<TableRow
									key={row.externalId ?? `${row.date}-${index}`}
									className={
										row.isDuplicate && !row.selected ? "opacity-50" : ""
									}
								>
									<TableCell>
										<Checkbox
											checked={row.selected}
											onCheckedChange={() => onToggle(index)}
											aria-label={`Selecionar ${row.description}`}
										/>
									</TableCell>
									<TableCell className="text-muted-foreground text-sm tabular-nums">
										{formatDate(row.date)}
									</TableCell>
									<TableCell className="max-w-[200px] text-sm">
										<input
											type="text"
											value={row.description}
											onChange={(e) =>
												onDescriptionChange(index, e.target.value)
											}
											className="w-full bg-transparent text-sm outline-none focus:rounded focus:ring-1 focus:ring-ring"
										/>
										{row.isDuplicate && (
											<div className="mt-0.5 flex items-center gap-1">
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="cursor-default rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
															Já importada
														</span>
													</TooltipTrigger>
													<TooltipContent>
														<p>
															Esta transação já foi importada anteriormente.
														</p>
													</TooltipContent>
												</Tooltip>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => onUndoDuplicate(index)}
															className="rounded-sm px-1 py-0.5 text-xs text-primary underline-offset-2 hover:underline"
														>
															desfazer
														</button>
													</TooltipTrigger>
													<TooltipContent>
														<p>
															Remover a importação anterior e marcar para
															reimportar.
														</p>
													</TooltipContent>
												</Tooltip>
											</div>
										)}
									</TableCell>
									<TableCell>
										<Select
											value={row.categoryId ?? ""}
											onValueChange={(v) => onCategoryChange(index, v || null)}
										>
											<SelectTrigger className="h-8 text-xs">
												<SelectValue placeholder="Categoria…" />
											</SelectTrigger>
											<SelectContent>
												{categoryOptions.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														<CategorySelectContent
															label={opt.label}
															icon={opt.icon}
														/>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<TransactionTypeBadge
											kind={
												row.transactionType === "income"
													? "Receita"
													: "Despesa"
											}
										/>
									</TableCell>
									<TableCell className="text-right tabular-nums text-sm">
										<MoneyValues
											amount={
												row.transactionType === "expense"
													? -row.amount
													: row.amount
											}
											showPositiveSign={row.transactionType === "income"}
											className={
												row.transactionType === "income"
													? "text-success"
													: "text-foreground"
											}
										/>
									</TableCell>
								</TableRow>
							);
						})}
						{paddingBottom > 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									style={{ height: paddingBottom, padding: 0 }}
								/>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</TooltipProvider>
	);
}
