"use client";
import { RiExpandDiagonalLine } from "@remixicon/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

const OVERFLOW_THRESHOLD_PX = 16;
const OVERFLOW_CHECK_DEBOUNCE_MS = 100;

type WidgetProps = {
	title: string;
	subtitle: string;
	children: React.ReactNode;
	icon: React.ReactElement;
	action?: React.ReactNode;
};

export default function WidgetCard({
	title,
	subtitle,
	icon,
	children,
	action,
}: WidgetProps) {
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [hasOverflow, setHasOverflow] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const checkOverflow = useCallback(() => {
		const el = contentRef.current;
		if (!el) return;

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			const hasOverflowNow =
				el.scrollHeight - el.clientHeight > OVERFLOW_THRESHOLD_PX;
			setHasOverflow(hasOverflowNow);
		}, OVERFLOW_CHECK_DEBOUNCE_MS);
	}, []);

	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;

		// Checagem inicial
		checkOverflow();

		// Observa apenas resize do container (suficiente para detectar overflow)
		const ro = new ResizeObserver(checkOverflow);
		ro.observe(el);

		return () => {
			ro.disconnect();
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [checkOverflow]);

	return (
		<Card className="md:h-custom-height-1 relative h-auto md:overflow-hidden">
			<CardHeader className="border-b [.border-b]:pb-2">
				<div className="flex w-full items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-1">
							<span className="text-primary">{icon}</span>
							{title}
						</CardTitle>
						<CardDescription className="text-muted-foreground text-sm capitalize mt-1">
							{subtitle}
						</CardDescription>
					</div>
					{action && <div className="shrink-0">{action}</div>}
				</div>
			</CardHeader>

			<CardContent
				ref={contentRef}
				className="max-h-[calc(var(--spacing-custom-height-1)-5rem)] overflow-hidden md:max-h-[calc(100%-5rem)]"
			>
				{children}
			</CardContent>

			{hasOverflow && (
				<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-card to-transparent pt-12 pb-6">
					<Button
						variant="outline"
						className="pointer-events-auto rounded-full text-xs dark:text-white"
						onClick={() => setIsOpen(true)}
						aria-label="Expandir para ver todo o conteúdo"
					>
						Ver tudo <RiExpandDiagonalLine size={10} aria-hidden="true" />
					</Button>
				</div>
			)}

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-h-[85vh] w-full max-w-[calc(100%-2rem)] sm:max-w-3xl overflow-hidden p-6">
					<DialogHeader className="text-left">
						<DialogTitle className="flex items-center gap-2">
							{icon}
							<span>{title}</span>
						</DialogTitle>
						{subtitle ? (
							<p className="text-muted-foreground text-sm">{subtitle}</p>
						) : null}
					</DialogHeader>
					<div className="scrollbar-hide max-h-[calc(85vh-6rem)] overflow-y-auto pb-6">
						{children}
					</div>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
