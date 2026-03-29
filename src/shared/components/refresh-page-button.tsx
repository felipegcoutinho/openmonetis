"use client";

import { RiRefreshLine } from "@remixicon/react";
import type { VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/ui";

type RefreshPageButtonProps = React.ComponentPropsWithoutRef<"button"> &
	Pick<VariantProps<typeof buttonVariants>, "variant">;

export function RefreshPageButton({
	className,
	variant = "ghost",
	...props
}: RefreshPageButtonProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleClick = () => {
		startTransition(() => {
			router.refresh();
		});
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={handleClick}
					disabled={isPending}
					aria-label="Atualizar página"
					title="Atualizar página"
					className={cn(
						buttonVariants({ variant, size: "icon-sm" }),
						"transition-all duration-200",
						variant === "ghost" &&
							"text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
						className,
					)}
					{...props}
				>
					<RiRefreshLine
						className={cn(
							"size-4 transition-transform duration-200",
							isPending && "animate-spin",
						)}
						aria-hidden
					/>
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom">Atualizar página</TooltipContent>
		</Tooltip>
	);
}
