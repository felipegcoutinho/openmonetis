"use client";

import { RiRefreshLine, RiSettings4Line } from "@remixicon/react";
import { useState } from "react";
import { widgetsConfig } from "@/features/dashboard/widget-registry/widget-config";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils";

type WidgetSettingsDialogProps = {
	hiddenWidgets: string[];
	onToggleWidget: (widgetId: string) => void;
	onReset: () => void;
	triggerClassName?: string;
};

export function WidgetSettingsDialog({
	hiddenWidgets,
	onToggleWidget,
	onReset,
	triggerClassName,
}: WidgetSettingsDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn("gap-2", triggerClassName)}
				>
					<RiSettings4Line className="size-4" />
					Widgets
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Configurar Widgets</DialogTitle>
					<DialogDescription>
						Escolha quais widgets deseja exibir no seu dashboard.
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[400px] overflow-y-auto py-4">
					<div className="space-y-3">
						{widgetsConfig.map((widget) => {
							const isVisible = !hiddenWidgets.includes(widget.id);

							return (
								<div
									key={widget.id}
									className="flex items-center justify-between gap-4 rounded-lg border p-3"
								>
									<div className="flex items-center gap-3 min-w-0">
										<span className="text-primary shrink-0">{widget.icon}</span>
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">
												{widget.title}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{widget.subtitle}
											</p>
										</div>
									</div>
									<Switch
										checked={isVisible}
										onCheckedChange={() => onToggleWidget(widget.id)}
									/>
								</div>
							);
						})}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={onReset}
						className="gap-2"
					>
						<RiRefreshLine className="size-4" />
						Restaurar Padrão
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
