"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDragMove2Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferencesAction } from "@/features/settings/actions";
import {
	ATTACHMENT_SIZE_OPTIONS,
	type AttachmentSizeOption,
} from "@/features/transactions/attachments-config";
import {
	DEFAULT_LANCAMENTOS_COLUMN_ORDER,
	LANCAMENTOS_COLUMN_LABELS,
} from "@/features/transactions/column-order";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Switch } from "@/shared/components/ui/switch";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";

interface PreferencesFormProps {
	statementNoteAsColumn: boolean;
	transactionsColumnOrder: string[] | null;
	attachmentMaxSizeMb: number;
}

function SortableColumnItem({ id }: { id: string }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const label = LANCAMENTOS_COLUMN_LABELS[id] ?? id;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex cursor-grab active:cursor-grabbing items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm touch-none select-none ${
				isDragging ? "z-10 opacity-90 shadow-md" : ""
			}`}
			aria-label={`Arrastar ${label}`}
			{...attributes}
			{...listeners}
		>
			<RiDragMove2Line
				className="size-4 shrink-0 text-muted-foreground"
				aria-hidden
			/>
			<span>{label}</span>
		</div>
	);
}

export function PreferencesForm({
	statementNoteAsColumn: initialExtratoNoteAsColumn,
	transactionsColumnOrder: initialColumnOrder,
	attachmentMaxSizeMb: initialAttachmentMaxSizeMb,
}: PreferencesFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [statementNoteAsColumn, setExtratoNoteAsColumn] = useState(
		initialExtratoNoteAsColumn,
	);
	const [columnOrder, setColumnOrder] = useState<string[]>(
		initialColumnOrder && initialColumnOrder.length > 0
			? initialColumnOrder
			: DEFAULT_LANCAMENTOS_COLUMN_ORDER,
	);
	const [attachmentMaxSizeMb, setAttachmentMaxSizeMb] =
		useState<AttachmentSizeOption>(
			(ATTACHMENT_SIZE_OPTIONS.includes(
				initialAttachmentMaxSizeMb as AttachmentSizeOption,
			)
				? initialAttachmentMaxSizeMb
				: 50) as AttachmentSizeOption,
		);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor),
	);

	const handleColumnDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			setColumnOrder((items) => {
				const oldIndex = items.indexOf(active.id as string);
				const newIndex = items.indexOf(over.id as string);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		startTransition(async () => {
			const result = await updatePreferencesAction({
				statementNoteAsColumn,
				transactionsColumnOrder: columnOrder,
				attachmentMaxSizeMb,
			});

			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			{/* Seção: Lançamentos */}
			<section className="space-y-4">
				<div>
					<h3 className="text-base font-semibold">Lançamentos</h3>
					<p className="text-sm text-muted-foreground">
						Configurações de exibição da tabela de movimentações.
					</p>
				</div>

				<section className="flex items-center justify-between max-w-md">
					<div className="space-y-2">
						<Label htmlFor="extrato-note-column" className="text-sm">
							Anotações em coluna
						</Label>
						<p className="text-sm text-muted-foreground">
							Quando ativo, as anotações aparecem em uma coluna na tabela.
							Quando desativado, aparecem em um balão ao passar o mouse no
							ícone.
						</p>
					</div>
					<Switch
						id="extrato-note-column"
						checked={statementNoteAsColumn}
						onCheckedChange={setExtratoNoteAsColumn}
						disabled={isPending}
					/>
				</section>

				<Separator />

				<section className="space-y-2 max-w-md">
					<Label className="text-sm">Ordem das colunas</Label>
					<p className="text-sm text-muted-foreground">
						Arraste os itens para definir a ordem em que as colunas aparecem na
						tabela do extrato e dos lançamentos.
					</p>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleColumnDragEnd}
					>
						<SortableContext
							items={columnOrder}
							strategy={verticalListSortingStrategy}
						>
							<div className="flex flex-col gap-2 pt-2">
								{columnOrder.map((id) => (
									<SortableColumnItem key={id} id={id} />
								))}
							</div>
						</SortableContext>
					</DndContext>
				</section>

				<Separator />

				<section className="space-y-2">
					<Label className="text-sm">Anexos</Label>
					<p className="text-sm text-muted-foreground">
						Configurações de upload de arquivos nos lançamentos.
					</p>

					<div className="space-y-2 max-w-md mt-4">
						<Label>Tamanho máximo por arquivo</Label>
						<p className="text-sm text-muted-foreground">
							Limite aplicado ao upload de PDFs e imagens.
						</p>
						<ToggleGroup
							type="single"
							value={String(attachmentMaxSizeMb)}
							onValueChange={(val) => {
								if (val)
									setAttachmentMaxSizeMb(Number(val) as AttachmentSizeOption);
							}}
							className="flex flex-wrap gap-2 justify-start"
						>
							{ATTACHMENT_SIZE_OPTIONS.map((size) => (
								<ToggleGroupItem
									key={size}
									value={String(size)}
									aria-label={`${size} MB`}
									className="min-w-14"
								>
									{size} MB
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>
				</section>
			</section>

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending} className="w-fit">
					{isPending ? "Salvando..." : "Salvar preferências"}
				</Button>
			</div>
		</form>
	);
}
