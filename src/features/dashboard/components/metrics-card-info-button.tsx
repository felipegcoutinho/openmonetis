"use client";

import { RiInformationLine } from "@remixicon/react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/shared/components/ui/hover-card";

type MetricsCardInfoButtonProps = {
	label: string;
	helpTitle: string;
	helpLines: readonly string[];
};

export function MetricsCardInfoButton({
	label,
	helpTitle,
	helpLines,
}: MetricsCardInfoButtonProps) {
	return (
		<HoverCard openDelay={150}>
			<HoverCardTrigger asChild>
				<button
					type="button"
					className="inline-flex items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					aria-label={`Entenda como ${label.toLowerCase()} é calculado`}
				>
					<RiInformationLine className="size-4" aria-hidden />
				</button>
			</HoverCardTrigger>
			<HoverCardContent align="start" className="w-80 space-y-3">
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground">{helpTitle}</p>
				</div>
				<ul className="space-y-2 text-xs text-muted-foreground">
					{helpLines.map((line) => (
						<li key={`${label}-${line}`}>{line}</li>
					))}
				</ul>
			</HoverCardContent>
		</HoverCard>
	);
}
