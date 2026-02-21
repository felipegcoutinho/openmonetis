"use client";

import { RiDeleteBin5Line, RiExternalLinkLine } from "@remixicon/react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { deleteEstabelecimentoAction } from "@/app/(dashboard)/estabelecimentos/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import { EstabelecimentoCreateDialog } from "./estabelecimento-create-dialog";
import type { EstabelecimentoRow } from "@/app/(dashboard)/estabelecimentos/data";

interface EstabelecimentosPageProps {
	rows: EstabelecimentoRow[];
}

function buildLancamentosUrl(name: string): string {
	const params = new URLSearchParams();
	params.set("estabelecimento", name);
	return `/lancamentos?${params.toString()}`;
}

export function EstabelecimentosPage({ rows }: EstabelecimentosPageProps) {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [rowToDelete, setRowToDelete] = useState<EstabelecimentoRow | null>(
		null,
	);

	const handleDeleteRequest = useCallback((row: EstabelecimentoRow) => {
		setRowToDelete(row);
		setDeleteOpen(true);
	}, []);

	const handleDeleteOpenChange = useCallback((open: boolean) => {
		setDeleteOpen(open);
		if (!open) setRowToDelete(null);
	}, []);

	const handleDeleteConfirm = useCallback(async () => {
		if (!rowToDelete?.estabelecimentoId) return;

		const result = await deleteEstabelecimentoAction({
			id: rowToDelete.estabelecimentoId,
		});

		if (result.success) {
			toast.success(result.message);
			setDeleteOpen(false);
			setRowToDelete(null);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [rowToDelete]);

	const canDelete = (row: EstabelecimentoRow) =>
		row.lancamentosCount === 0 && row.estabelecimentoId != null;

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				<div className="flex justify-start">
					<EstabelecimentoCreateDialog />
				</div>

				{rows.length === 0 ? (
					<div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed bg-muted/10 p-10 text-center text-sm text-muted-foreground">
						Nenhum estabelecimento ainda. Crie um ou use a lista que será
						preenchida conforme você adiciona lançamentos.
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Estabelecimento</TableHead>
									<TableHead className="text-right">Lançamentos</TableHead>
									<TableHead className="w-[180px] text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={`${row.name}-${row.estabelecimentoId ?? "x"}`}>
										<TableCell>
											<div className="flex items-center gap-3">
												<EstabelecimentoLogo name={row.name} size={32} />
												<span className="font-medium">{row.name}</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											{row.lancamentosCount}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button variant="ghost" size="sm" asChild>
													<Link
														href={buildLancamentosUrl(row.name)}
														className="inline-flex items-center gap-1"
													>
														<RiExternalLinkLine className="size-4" />
														Ver vinculados
													</Link>
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="text-destructive hover:text-destructive"
													disabled={!canDelete(row)}
													onClick={() => handleDeleteRequest(row)}
													title={
														row.lancamentosCount > 0
															? "Não é possível excluir: há lançamentos vinculados."
															: "Excluir estabelecimento"
													}
												>
													<RiDeleteBin5Line className="size-4" />
													Excluir
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			<ConfirmActionDialog
				open={deleteOpen}
				onOpenChange={handleDeleteOpenChange}
				title="Excluir estabelecimento?"
				description={
					rowToDelete
						? `Tem certeza que deseja excluir "${rowToDelete.name}"? Esta ação não pode ser desfeita.`
						: ""
				}
				confirmLabel="Excluir"
				variant="destructive"
				onConfirm={handleDeleteConfirm}
			/>
		</>
	);
}
