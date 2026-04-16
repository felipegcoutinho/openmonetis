"use client";

import { RiCheckboxCircleFill } from "@remixicon/react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/shared/components/ui/dialog";

// Tons baseados na primary: oklch(72% 0.163 50) ≈ laranja quente
const PRIMARY_CONFETTI_COLORS = [
	"#e07a3a", // primary base
	"#f5a870", // primary claro
	"#ffd4a8", // primary muito claro
	"#b85520", // primary escuro
	"#8a3a10", // primary muito escuro
	"#f5c896", // tom pastel
];

type PaymentSuccessProps = {
	title: string;
	description: string;
	onClose: () => void;
};

export function PaymentSuccess({
	title,
	description,
	onClose,
}: PaymentSuccessProps) {
	useEffect(() => {
		const origin = { x: 0.5, y: 0.4 };

		confetti({
			particleCount: 80,
			spread: 70,
			origin,
			colors: PRIMARY_CONFETTI_COLORS,
			startVelocity: 28,
			gravity: 1.2,
			scalar: 0.9,
			ticks: 200,
		});

		const t1 = setTimeout(() => {
			confetti({
				particleCount: 40,
				spread: 50,
				origin: { x: 0.3, y: 0.45 },
				colors: PRIMARY_CONFETTI_COLORS,
				startVelocity: 22,
				gravity: 1.1,
				scalar: 0.8,
				ticks: 180,
			});
		}, 150);

		const t2 = setTimeout(() => {
			confetti({
				particleCount: 40,
				spread: 50,
				origin: { x: 0.7, y: 0.45 },
				colors: PRIMARY_CONFETTI_COLORS,
				startVelocity: 22,
				gravity: 1.1,
				scalar: 0.8,
				ticks: 180,
			});
		}, 250);

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, []);

	return (
		<div className="flex flex-col items-center gap-6 px-2 py-8 text-center">
			<div className="relative flex items-center justify-center">
				{/* Anel de pulso */}
				<span className="absolute inline-flex size-24 animate-ping rounded-full bg-primary opacity-10" />
				<span className="absolute inline-flex size-20 rounded-full bg-primary/15" />
				<div className="relative flex size-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
					<RiCheckboxCircleFill className="size-8 text-primary-foreground" />
				</div>
			</div>

			<div className="space-y-2">
				<DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
				<DialogDescription className="text-sm leading-relaxed">
					{description}
				</DialogDescription>
			</div>

			<DialogFooter className="w-full sm:justify-center">
				<Button
					type="button"
					onClick={onClose}
					className="w-full sm:w-auto sm:min-w-32"
				>
					Fechar
				</Button>
			</DialogFooter>
		</div>
	);
}
