"use client";

import { RiCalculatorFill, RiCalculatorLine } from "@remixicon/react";
import * as React from "react";
import Calculator from "@/components/calculadora/calculator";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDraggableDialog } from "@/hooks/use-draggable-dialog";
import { cn } from "@/lib/utils/ui";

type Variant = React.ComponentProps<typeof Button>["variant"];
type Size = React.ComponentProps<typeof Button>["size"];

type CalculatorDialogButtonProps = {
	variant?: Variant;
	size?: Size;
	className?: string;
	children?: React.ReactNode;
	withTooltip?: boolean;
	onSelectValue?: (value: string) => void;
};

export function CalculatorDialogContent({
	open,
	onSelectValue,
}: {
	open: boolean;
	onSelectValue?: (value: string) => void;
}) {
	const { dragHandleProps, contentRefCallback, resetPosition } =
		useDraggableDialog();

	React.useEffect(() => {
		if (!open) {
			resetPosition();
		}
	}, [open, resetPosition]);

	return (
		<DialogContent
			ref={contentRefCallback}
			className="p-4 sm:max-w-sm"
			onEscapeKeyDown={(e) => e.preventDefault()}
		>
			<DialogHeader
				className="cursor-grab select-none space-y-2 active:cursor-grabbing"
				{...dragHandleProps}
			>
				<DialogTitle className="flex items-center gap-2 text-lg">
					<RiCalculatorLine className="h-5 w-5" />
					Calculadora
				</DialogTitle>
			</DialogHeader>
			<Calculator isOpen={open} onSelectValue={onSelectValue} />
		</DialogContent>
	);
}

export function CalculatorDialogButton({
	variant = "ghost",
	size = "sm",
	className,
	children,
	withTooltip = false,
	onSelectValue,
}: CalculatorDialogButtonProps) {
	const [open, setOpen] = React.useState(false);

	const handleSelectValue = onSelectValue
		? (value: string) => {
				onSelectValue(value);
				setOpen(false);
			}
		: undefined;

	if (withTooltip) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<Tooltip>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<button
								type="button"
								aria-label="Calculadora"
								aria-expanded={open}
								data-state={open ? "open" : "closed"}
								className={cn(
									buttonVariants({ variant: "ghost", size: "icon-sm" }),
									"group relative text-muted-foreground transition-all duration-200",
									"hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
									"data-[state=open]:bg-accent/60 data-[state=open]:text-foreground border",
									className,
								)}
							>
								<RiCalculatorLine
									className={cn(
										"size-4 transition-transform duration-200",
										open ? "scale-90" : "scale-100",
									)}
								/>
								<span className="sr-only">Calculadora</span>
							</button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent side="bottom" sideOffset={8}>
						Calculadora
					</TooltipContent>
				</Tooltip>
				<CalculatorDialogContent
					open={open}
					onSelectValue={handleSelectValue}
				/>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant={variant} size={size} className={cn(className)}>
					{children ?? (
						<RiCalculatorFill className="h-4 w-4 text-muted-foreground" />
					)}
				</Button>
			</DialogTrigger>
			<CalculatorDialogContent open={open} onSelectValue={handleSelectValue} />
		</Dialog>
	);
}
