"use client";

import { RiExpandDiagonalLine } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import type { WidgetCardProps } from "@/shared/components/widget-card";
import WidgetCard from "@/shared/components/widget-card";

const OVERFLOW_THRESHOLD_PX = 16;
const EXPANDABLE_CONTENT_CLASSNAME =
	"max-h-[calc(var(--spacing-custom-height-card)-5rem)] overflow-hidden md:max-h-[calc(100%-5rem)]";

export function ExpandableWidgetCard({
	title,
	subtitle,
	icon,
	children,
	action,
}: WidgetCardProps) {
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [hasOverflow, setHasOverflow] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const element = contentRef.current;
		if (!element) return;

		let frameId = 0;

		const checkOverflow = () => {
			cancelAnimationFrame(frameId);
			frameId = window.requestAnimationFrame(() => {
				const hasOverflowNow =
					element.scrollHeight - element.clientHeight > OVERFLOW_THRESHOLD_PX;
				setHasOverflow((currentValue) =>
					currentValue === hasOverflowNow ? currentValue : hasOverflowNow,
				);
			});
		};

		checkOverflow();

		const resizeObserver = new ResizeObserver(checkOverflow);
		resizeObserver.observe(element);

		return () => {
			cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<>
			<WidgetCard
				title={title}
				subtitle={subtitle}
				icon={icon}
				action={action}
				contentRef={contentRef}
				contentClassName={EXPANDABLE_CONTENT_CLASSNAME}
				overlay={
					hasOverflow ? (
						<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-card to-transparent pt-12 pb-6">
							<Button
								variant="secondary"
								className="pointer-events-auto rounded-full text-xs backdrop-blur-sm bg-primary/10"
								onClick={() => setIsOpen(true)}
								aria-label="Expandir para ver todo o conteúdo"
							>
								Ver tudo <RiExpandDiagonalLine size={10} aria-hidden="true" />
							</Button>
						</div>
					) : null
				}
			>
				{children}
			</WidgetCard>

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
		</>
	);
}
