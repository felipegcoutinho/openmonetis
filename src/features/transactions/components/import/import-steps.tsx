import { RiCheckLine } from "@remixicon/react";
import { cn } from "@/shared/utils/ui";

type Step = "upload" | "review" | "done";

const STEPS: { key: Step; label: string }[] = [
	{ key: "upload", label: "Upload" },
	{ key: "review", label: "Revisar" },
	{ key: "done", label: "Concluído" },
];

const STEP_ORDER: Step[] = ["upload", "review", "done"];

interface ImportStepsProps {
	current: Step;
}

export function ImportSteps({ current }: ImportStepsProps) {
	const currentIndex = STEP_ORDER.indexOf(current);

	return (
		<div className="flex items-center gap-0">
			{STEPS.map((step, index) => {
				const stepIndex = STEP_ORDER.indexOf(step.key);
				const isCompleted = stepIndex < currentIndex;
				const isActive = stepIndex === currentIndex;

				return (
					<div key={step.key} className="flex items-center">
						<div className="flex items-center gap-2">
							<div
								className={cn(
									"flex size-6 items-center justify-center rounded-full border text-xs font-medium transition-colors",
									isCompleted &&
										"border-primary bg-primary text-primary-foreground",
									isActive && "border-primary text-primary",
									!isCompleted && !isActive && "border-muted-foreground/30 text-muted-foreground",
								)}
							>
								{isCompleted ? (
									<RiCheckLine className="size-3.5" />
								) : (
									<span>{index + 1}</span>
								)}
							</div>
							<span
								className={cn(
									"text-sm",
									isActive && "font-medium text-foreground",
									!isActive && "text-muted-foreground",
								)}
							>
								{step.label}
							</span>
						</div>

						{index < STEPS.length - 1 && (
							<div
								className={cn(
									"mx-3 h-px w-10 transition-colors",
									stepIndex < currentIndex ? "bg-primary" : "bg-border",
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
