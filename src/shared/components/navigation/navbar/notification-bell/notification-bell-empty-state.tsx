"use client";

import { RiArchiveLine, RiCheckboxCircleFill } from "@remixicon/react";
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@/shared/components/ui/empty";

type NotificationBellEmptyStateProps = {
	showArchived: boolean;
	hasArchivedItems: boolean;
};

export function NotificationBellEmptyState({
	showArchived,
	hasArchivedItems,
}: NotificationBellEmptyStateProps) {
	return (
		<div className="px-4 py-8">
			<Empty>
				<EmptyMedia>
					{showArchived ? (
						<RiArchiveLine className="text-muted-foreground" />
					) : (
						<RiCheckboxCircleFill color="green" />
					)}
				</EmptyMedia>
				<EmptyTitle>
					{showArchived
						? "Nenhuma notificação arquivada"
						: hasArchivedItems
							? "Nenhuma notificação ativa"
							: "Nenhuma notificação"}
				</EmptyTitle>
				<EmptyDescription>
					{showArchived
						? "Você ainda não arquivou nenhuma notificação."
						: hasArchivedItems
							? "As demais notificações estão arquivadas. Ative o filtro para revê-las."
							: "Você está em dia com seus pagamentos!"}
				</EmptyDescription>
			</Empty>
		</div>
	);
}
