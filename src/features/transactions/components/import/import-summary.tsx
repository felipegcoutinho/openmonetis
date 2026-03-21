import { RiCalendarLine } from "@remixicon/react";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import type { ImportStatement } from "@/shared/lib/import/types";
import { formatDate } from "@/shared/utils/date";

interface ImportSummaryProps {
	statement: ImportStatement;
	total: number;
	selected: number;
	duplicates: number;
	uncategorized: number;
}

export function ImportSummary({
	statement,
	total,
	selected,
	duplicates,
	uncategorized,
}: ImportSummaryProps) {
	return (
		<Card className="flex flex-col gap-1 p-5 text-sm bg-linear-to-br from-primary/5 to-transparent">
			{/* Linha 1: título */}
			<div className="flex items-center gap-2">
				<span className="font-medium">{statement.source}</span>
				{statement.isCreditCard && (
					<Badge variant="outline">Cartão de crédito</Badge>
				)}
			</div>

			{/* Linha 2: metadados */}
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
				{statement.period && (
					<span className="flex items-center gap-1">
						<RiCalendarLine className="size-3.5 shrink-0" />
						{formatDate(statement.period.from)} →{" "}
						{formatDate(statement.period.to)}
					</span>
				)}

				<span>
					<span className="font-medium text-foreground">{selected}</span>/
					{total} selecionadas
				</span>

				{duplicates > 0 && (
					<span className="text-amber-600 dark:text-amber-400">
						{duplicates} duplicata{duplicates !== 1 ? "s" : ""}
					</span>
				)}

				{uncategorized > 0 ? (
					<span>{uncategorized} sem categoria</span>
				) : (
					selected > 0 && (
						<span className="text-emerald-600 dark:text-emerald-400">
							todas categorizadas ✓
						</span>
					)
				)}
			</div>
		</Card>
	);
}
