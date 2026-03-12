"use client";

import {
	RiAlertLine,
	RiCheckboxCircleLine,
	RiCloseCircleLine,
	RiInformationLine,
	RiLoader4Line,
} from "@remixicon/react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <RiCheckboxCircleLine className="size-4" />,
				info: <RiInformationLine className="size-4" />,
				warning: <RiAlertLine className="size-4" />,
				error: <RiCloseCircleLine className="size-4" />,
				loading: <RiLoader4Line className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
