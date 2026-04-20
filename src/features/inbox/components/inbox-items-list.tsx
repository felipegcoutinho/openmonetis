import { RiAtLine, RiCalendarEventLine } from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmptyState } from "@/shared/components/empty-state";
import { Card } from "@/shared/components/ui/card";
import { InboxCard } from "./inbox-card";
import type { InboxItem } from "./types";

// O Companion envia hora local de Brasília com 'Z' literal (não converte para UTC).
// Por isso, o timestamp armazenado no DB já tem a data correta de Brasília como componente UTC.
// Basta fatiar o ISO string sem nenhum ajuste para obter a data de Brasília do item.
function getItemDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

// Para "hoje" e "ontem", precisamos da data real de Brasília (UTC-3).
function getBrasiliaDateKey(date: Date): string {
	const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;
	return new Date(date.getTime() - BRASILIA_OFFSET_MS)
		.toISOString()
		.slice(0, 10);
}

function getGroupLabel(dateKey: string): string {
	const now = new Date();
	const todayKey = getBrasiliaDateKey(now);
	const yesterdayKey = getBrasiliaDateKey(
		new Date(now.getTime() - 24 * 60 * 60 * 1000),
	);
	if (dateKey === todayKey) return "Hoje";
	if (dateKey === yesterdayKey) return "Ontem";
	const [year, month, day] = dateKey.split("-").map(Number);
	return format(new Date(year, (month ?? 1) - 1, day), "d 'de' MMMM", {
		locale: ptBR,
	});
}

function groupItemsByDay(
	items: InboxItem[],
): { label: string; items: InboxItem[] }[] {
	const groups = new Map<string, InboxItem[]>();
	for (const item of items) {
		const key = getItemDateKey(new Date(item.notificationTimestamp));
		const group = groups.get(key);
		if (group) {
			group.push(item);
		} else {
			groups.set(key, [item]);
		}
	}
	const sortedKeys = [...groups.keys()].sort((a, b) => b.localeCompare(a));
	return sortedKeys.map((key) => ({
		label: getGroupLabel(key),
		items: groups.get(key) ?? [],
	}));
}

type InboxItemsListProps = {
	items: InboxItem[];
	readonly?: boolean;
	activeApp: string | null;
	appLogoMap: Record<string, string>;
	selectedIds: string[];
	onProcess?: (item: InboxItem) => void;
	onDiscard?: (item: InboxItem) => void;
	onViewDetails?: (item: InboxItem) => void;
	onDelete?: (item: InboxItem) => void;
	onRestoreToPending?: (item: InboxItem) => void;
	onSelectToggle: (id: string) => void;
};

export function InboxItemsList({
	items,
	readonly,
	activeApp,
	appLogoMap,
	selectedIds,
	onProcess,
	onDiscard,
	onViewDetails,
	onDelete,
	onRestoreToPending,
	onSelectToggle,
}: InboxItemsListProps) {
	if (items.length === 0) {
		const message = activeApp
			? "Nenhuma notificação deste app"
			: readonly
				? "Nenhuma notificação nesta aba"
				: "Nenhum pré-lançamento pendente";
		return (
			<Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
				<EmptyState
					media={<RiAtLine className="size-6 text-primary" />}
					title={message}
					description="As notificações capturadas pelo app OpenMonetis Companion aparecerão aqui. Saiba mais em Ajustes > Companion."
				/>
			</Card>
		);
	}

	const groups = groupItemsByDay(items);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{groups.flatMap((group) =>
				group.items.map((item) => (
					<div key={item.id} className="flex flex-col gap-1.5">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<RiCalendarEventLine className="size-3 shrink-0" />
							<span className="text-xs font-medium">{group.label}</span>
						</div>
						<InboxCard
							item={item}
							readonly={readonly}
							appLogoMap={appLogoMap}
							onProcess={readonly ? undefined : onProcess}
							onDiscard={readonly ? undefined : onDiscard}
							onViewDetails={readonly ? undefined : onViewDetails}
							onDelete={readonly ? onDelete : undefined}
							onRestoreToPending={readonly ? onRestoreToPending : undefined}
							selected={selectedIds.includes(item.id)}
							onSelectToggle={onSelectToggle}
						/>
					</div>
				)),
			)}
		</div>
	);
}
