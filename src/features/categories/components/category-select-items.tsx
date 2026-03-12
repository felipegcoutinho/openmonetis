"use client";

import StatusDot from "@/shared/components/status-dot";

export function TypeSelectContent({ label }: { label: string }) {
	const isReceita = label === "Receita";

	return (
		<span className="flex items-center gap-2">
			<StatusDot color={isReceita ? "bg-success" : "bg-destructive"} />
			<span>{label}</span>
		</span>
	);
}
