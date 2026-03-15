"use client";
import { RiMoonClearLine, RiSunLine } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { buttonVariants } from "@/shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/ui";

interface AnimatedThemeTogglerProps
	extends React.ComponentPropsWithoutRef<"button"> {
	duration?: number;
}

export const AnimatedThemeToggler = ({
	className,
	duration = 400,
	...props
}: AnimatedThemeTogglerProps) => {
	const [isDark, setIsDark] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const updateTheme = () => {
			setIsDark(document.documentElement.classList.contains("dark"));
		};

		updateTheme();

		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	const toggleTheme = async () => {
		if (!buttonRef.current) return;

		await document.startViewTransition(() => {
			flushSync(() => {
				const newTheme = !isDark;
				setIsDark(newTheme);
				document.documentElement.classList.toggle("dark");
				localStorage.setItem("theme", newTheme ? "dark" : "light");
			});
		}).ready;

		const { top, left, width, height } =
			buttonRef.current.getBoundingClientRect();
		const x = left + width / 2;
		const y = top + height / 2;
		const maxRadius = Math.hypot(
			Math.max(left, window.innerWidth - left),
			Math.max(top, window.innerHeight - top),
		);

		document.documentElement.animate(
			{
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			{
				duration,
				easing: "ease-in-out",
				pseudoElement: "::view-transition-new(root)",
			},
		);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					ref={buttonRef}
					type="button"
					onClick={toggleTheme}
					data-state={isDark ? "dark" : "light"}
					className={cn(
						buttonVariants({ variant: "ghost", size: "icon-sm" }),
						"group relative text-muted-foreground transition-all duration-200",
						"hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
						"data-[state=open]:bg-accent/60 data-[state=open]:text-foreground",
						className,
					)}
					{...props}
				>
					<span
						aria-hidden
						className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 data-[state=dark]:opacity-100"
					>
						<span className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-amber-500/15 dark:from-amber-500/10 dark:to-amber-500/30" />
					</span>
					{isDark ? (
						<RiSunLine
							className="size-4 transition-transform duration-200"
							aria-hidden
						/>
					) : (
						<RiMoonClearLine
							className="size-4 transition-transform duration-200"
							aria-hidden
						/>
					)}
					<span className="sr-only">
						{isDark ? "Ativar tema claro" : "Ativar tema escuro"}
					</span>
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom" sideOffset={8}>
				{isDark ? "Tema claro" : "Tema escuro"}
			</TooltipContent>
		</Tooltip>
	);
};
