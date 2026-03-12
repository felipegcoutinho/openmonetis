import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/ui";

export type CalculatorDisplayProps = {
	history: string | null;
	expression: string;
	resultText: string | null;
	copied: boolean;
	onCopy: () => void;
	isResultView: boolean;
};

export function CalculatorDisplay({
	history,
	expression,
	resultText,
	copied,
	onCopy,
	isResultView,
}: CalculatorDisplayProps) {
	return (
		<div className="flex h-24 flex-col rounded-xl border bg-muted px-4 py-4 text-right">
			<div className="min-h-5 truncate text-sm text-muted-foreground">
				{history ?? (
					<span
						className="pointer-events-none opacity-0 select-none"
						aria-hidden
					>
						0 + 0
					</span>
				)}
			</div>
			<div className="mt-auto flex items-end justify-end gap-2">
				<div
					className={cn(
						"truncate text-right font-semibold tracking-tight tabular-nums leading-none transition-all",
						isResultView ? "text-2xl" : "text-3xl",
					)}
				>
					{expression}
				</div>
				{resultText && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onCopy}
						className="h-6 w-6 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
					>
						{copied ? (
							<RiCheckLine className="h-4 w-4" />
						) : (
							<RiFileCopyLine className="h-4 w-4" />
						)}
						<span className="sr-only">
							{copied ? "Resultado copiado" : "Copiar resultado"}
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}
