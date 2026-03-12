"use client";

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

interface NavigationButtonProps {
	direction: "left" | "right";
	disabled?: boolean;
	onClick: () => void;
}

export default function NavigationButton({
	direction,
	disabled,
	onClick,
}: NavigationButtonProps) {
	const Icon = direction === "left" ? RiArrowLeftSLine : RiArrowRightSLine;

	return (
		<button
			onClick={onClick}
			className="text-card-foreground transition-all duration-200 cursor-pointer rounded-lg p-1 hover:bg-card-foreground/10 focus:outline-hidden focus:ring-2 focus:ring-card-foreground/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
			disabled={disabled}
			aria-label={`Navegar para o mês ${
				direction === "left" ? "anterior" : "seguinte"
			}`}
		>
			<Icon className="text-primary" size={18} />
		</button>
	);
}
