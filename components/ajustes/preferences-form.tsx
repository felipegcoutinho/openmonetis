"use client";

import {
	DndContext,
	closestCenter,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDragMove2Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferencesAction } from "@/app/(dashboard)/ajustes/actions";
import { useFont } from "@/components/font-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	DEFAULT_LANCAMENTOS_COLUMN_ORDER,
	LANCAMENTOS_COLUMN_LABELS,
} from "@/lib/lancamentos/column-order";
import { FONT_OPTIONS, getFontVariable } from "@/public/fonts/font_index";

interface PreferencesFormProps {
	disableMagnetlines: boolean;
	extratoNoteAsColumn: boolean;
	lancamentosColumnOrder: string[] | null;
	systemFont: string;
	moneyFont: string;
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
			<RiDragMove2Line className="size-4 shrink-0 text-muted-foreground" aria-hidden />
			<span>{label}</span>
		</div>
	);
}

export function PreferencesForm({
	disableMagnetlines,
	extratoNoteAsColumn: initialExtratoNoteAsColumn,
	lancamentosColumnOrder: initialColumnOrder,
	systemFont: initialSystemFont,
	moneyFont: initialMoneyFont,
}: PreferencesFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [magnetlinesDisabled, setMagnetlinesDisabled] =
		useState(disableMagnetlines);
	const [extratoNoteAsColumn, setExtratoNoteAsColumn] =
		useState(initialExtratoNoteAsColumn);
	const [columnOrder, setColumnOrder] = useState<string[]>(
		initialColumnOrder && initialColumnOrder.length > 0
			? initialColumnOrder
			: DEFAULT_LANCAMENTOS_COLUMN_ORDER,
	);
	const [selectedSystemFont, setSelectedSystemFont] =
		useState(initialSystemFont);
	const [selectedMoneyFont, setSelectedMoneyFont] = useState(initialMoneyFont);

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

	const fontCtx = useFont();

	// Live preview: update CSS vars when font selection changes
	useEffect(() => {
		fontCtx.setSystemFont(selectedSystemFont);
	}, [selectedSystemFont, fontCtx.setSystemFont]);

	useEffect(() => {
		fontCtx.setMoneyFont(selectedMoneyFont);
	}, [selectedMoneyFont, fontCtx.setMoneyFont]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		startTransition(async () => {
			const result = await updatePreferencesAction({
				disableMagnetlines: magnetlinesDisabled,
				extratoNoteAsColumn,
				lancamentosColumnOrder: columnOrder,
				systemFont: selectedSystemFont,
				moneyFont: selectedMoneyFont,
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
			{/* Seção 1: Tipografia */}
			<section className="space-y-5">
				<div>
					<h3 className="text-base font-semibold">Tipografia</h3>
					<p className="text-sm text-muted-foreground">
						Personalize as fontes usadas na interface e nos valores monetários.
					</p>
				</div>

				{/* Fonte do sistema */}
				<div className="space-y-2 max-w-md">
					<Label htmlFor="system-font">Fonte do sistema</Label>
					<Select
						value={selectedSystemFont}
						onValueChange={setSelectedSystemFont}
					>
						<SelectTrigger id="system-font">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_OPTIONS.map((opt) => (
								<SelectItem key={opt.key} value={opt.key}>
									<span
										style={{
											fontFamily: opt.variable,
										}}
									>
										{opt.label}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p
						className="text-sm text-muted-foreground pt-1"
						style={{
							fontFamily: getFontVariable(selectedSystemFont),
						}}
					>
						Suas finanças em um só lugar
					</p>
				</div>

				{/* Fonte de valores */}
				<div className="space-y-2 max-w-md">
					<Label htmlFor="money-font">Fonte de valores</Label>
					<Select
						value={selectedMoneyFont}
						onValueChange={setSelectedMoneyFont}
					>
						<SelectTrigger id="money-font">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_OPTIONS.map((opt) => (
								<SelectItem key={opt.key} value={opt.key}>
									<span
										style={{
											fontFamily: opt.variable,
										}}
									>
										{opt.label}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p
						className="text-sm text-muted-foreground pt-1 tabular-nums"
						style={{
							fontFamily: getFontVariable(selectedMoneyFont),
						}}
					>
						R$ 1.234,56
					</p>
				</div>
			</section>

			<div className="border-b" />

			{/* Seção: Extrato / Lançamentos */}
			<section className="space-y-4">
				<div>
					<h3 className="text-base font-semibold">Extrato e lançamentos</h3>
					<p className="text-sm text-muted-foreground">
						Como exibir anotações e a ordem das colunas na tabela de movimentações.
					</p>
				</div>

				<div className="flex items-center justify-between rounded-lg border p-4 max-w-md">
					<div className="space-y-0.5">
						<Label htmlFor="extrato-note-column" className="text-base">
							Anotações em coluna
						</Label>
						<p className="text-sm text-muted-foreground">
							Quando ativo, as anotações aparecem em uma coluna na tabela. Quando desativado, aparecem em um balão ao passar o mouse no ícone.
						</p>
					</div>
					<Switch
						id="extrato-note-column"
						checked={extratoNoteAsColumn}
						onCheckedChange={setExtratoNoteAsColumn}
						disabled={isPending}
					/>
				</div>

				<div className="space-y-2 max-w-md">
					<Label className="text-base">Ordem das colunas</Label>
					<p className="text-sm text-muted-foreground">
						Arraste os itens para definir a ordem em que as colunas aparecem na tabela do extrato e dos lançamentos.
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
				</div>
			</section>

			<div className="border-b" />

			{/* Seção: Dashboard */}
			<section className="space-y-4">
				<div>
					<h3 className="text-base font-semibold">Dashboard</h3>
					<p className="text-sm text-muted-foreground">
						Opções que afetam a experiência no painel principal.
					</p>
				</div>

				<div className="flex items-center justify-between rounded-lg border p-4 max-w-md">
					<div className="space-y-0.5">
						<Label htmlFor="magnetlines" className="text-base">
							Desabilitar Magnetlines
						</Label>
						<p className="text-sm text-muted-foreground">
							Remove o recurso de linhas magnéticas do sistema.
						</p>
					</div>
					<Switch
						id="magnetlines"
						checked={magnetlinesDisabled}
						onCheckedChange={setMagnetlinesDisabled}
						disabled={isPending}
					/>
				</div>
			</section>

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending} className="w-fit">
					{isPending ? "Salvando..." : "Salvar preferências"}
				</Button>
			</div>
		</form>
	);
}
