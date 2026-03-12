"use client";

import StatusDot from "@/shared/components/status-dot";

export function StatusSelectContent({ label }: { label: string }) {
	const isActive = label === "Ativa";

	return (
		<span className="flex items-center gap-2">
			<StatusDot
				color={isActive ? "bg-success" : "bg-slate-400 dark:bg-slate-500"}
			/>
			<span>{label}</span>
		</span>
	);
}
