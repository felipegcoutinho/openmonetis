"use client";

import { RiRefreshLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/ui";

type RefreshPageButtonProps = React.ComponentPropsWithoutRef<"button">;

export function RefreshPageButton({
	className,
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
						buttonVariants({ variant: "ghost", size: "icon-sm" }),
						"size-8 text-muted-foreground transition-all duration-200",
						"hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 border",
						"disabled:pointer-events-none disabled:opacity-50",
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
