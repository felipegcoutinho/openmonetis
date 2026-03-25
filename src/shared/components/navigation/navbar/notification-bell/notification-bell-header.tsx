"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";
import type { NotificationViewMode } from "./types";

type NotificationBellHeaderProps = {
	hasAnySourceItems: boolean;
	headerCountLabel: string;
	hasDashboardNotificationItems: boolean;
	viewMode: NotificationViewMode;
	hasArchivedItems: boolean;
	archivedDashboardCount: number;
	onViewModeChange: (viewMode: NotificationViewMode) => void;
};

export function NotificationBellHeader({
	hasAnySourceItems,
	headerCountLabel,
	hasDashboardNotificationItems,
	viewMode,
	hasArchivedItems,
	archivedDashboardCount,
	onViewModeChange,
}: NotificationBellHeaderProps) {
	return (
		<div className="border-b px-3 py-2.5">
			<div className="flex items-center justify-between gap-2 text-sm font-semibold">
				<span>Notificações</span>
				{hasAnySourceItems ? (
					<Badge variant="outline" className="text-xs font-medium">
						{headerCountLabel}
					</Badge>
				) : null}
			</div>
			{hasDashboardNotificationItems ? (
				<div className="pt-2.5">
					<ToggleGroup
						type="single"
						value={viewMode}
						onValueChange={(value) => {
							if (!value) return;
							if (value === "archived" && !hasArchivedItems) return;
							onViewModeChange(value as NotificationViewMode);
						}}
						variant="outline"
						size="sm"
						className="w-full rounded-md bg-muted/30 p-0.5"
						aria-label="Filtro da lista de notificações"
					>
						<ToggleGroupItem
							value="active"
							className="flex-1 text-xs font-medium transition-all data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm"
							aria-label="Mostrar notificações ativas"
						>
							Ativas
						</ToggleGroupItem>
						<ToggleGroupItem
							value="archived"
							className="flex-1 text-xs font-medium transition-all data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm"
							aria-label="Mostrar notificações arquivadas"
							disabled={!hasArchivedItems && viewMode !== "archived"}
						>
							Arquivadas
							{hasArchivedItems ? ` (${archivedDashboardCount})` : ""}
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			) : null}
		</div>
	);
}
