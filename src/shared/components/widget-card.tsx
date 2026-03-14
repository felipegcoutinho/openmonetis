import type * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

export type WidgetCardProps = {
	title: string;
	subtitle: string;
	children: React.ReactNode;
	icon: React.ReactNode;
	action?: React.ReactNode;
};

type WidgetCardShellProps = WidgetCardProps & {
	contentClassName?: string;
	contentRef?: React.Ref<HTMLDivElement>;
	overlay?: React.ReactNode;
};

export default function WidgetCard({
	title,
	subtitle,
	icon,
	children,
	action,
	contentClassName,
	contentRef,
	overlay,
}: WidgetCardShellProps) {
	return (
		<Card className="relative gap-2 overflow-hidden md:h-custom-height-card">
			<CardHeader>
				<div className="flex w-full items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-1 tracking-tighter lowercase">
							<span className="size-4">{icon}</span>
							{title}
						</CardTitle>
						<CardDescription className="text-muted-foreground text-sm lowercase mt-1.5 tracking-tight">
							{subtitle}
						</CardDescription>
					</div>
					{action && <div className="shrink-0">{action}</div>}
				</div>
				<Separator className="mt-1" />
			</CardHeader>

			<CardContent ref={contentRef} className={contentClassName}>
				{children}
			</CardContent>

			{overlay}
		</Card>
	);
}
