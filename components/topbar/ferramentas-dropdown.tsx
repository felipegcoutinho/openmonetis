"use client";

import { RiCalculatorLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { useState } from "react";
import { CalculatorDialogContent } from "@/components/calculadora/calculator-dialog";
import { usePrivacyMode } from "@/components/privacy-provider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/ui";

const itemClass =
	"flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer";

export function FerramentasDropdownContent() {
	const { privacyMode, toggle } = usePrivacyMode();
	const [calcOpen, setCalcOpen] = useState(false);

	return (
		<Dialog open={calcOpen} onOpenChange={setCalcOpen}>
			<ul className="grid w-52 gap-0.5 p-2">
				<li>
					<DialogTrigger asChild>
						<button type="button" className={cn(itemClass)}>
							<span className="text-muted-foreground shrink-0">
								<RiCalculatorLine className="size-4" />
							</span>
							<span className="flex-1 text-left">calculadora</span>
						</button>
					</DialogTrigger>
				</li>
				<li>
					<button type="button" onClick={toggle} className={cn(itemClass)}>
						<span className="text-muted-foreground shrink-0">
							{privacyMode ? (
								<RiEyeOffLine className="size-4" />
							) : (
								<RiEyeLine className="size-4" />
							)}
						</span>
						<span className="flex-1 text-left">privacidade</span>
						{privacyMode && (
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 py-0 h-4"
							>
								Ativo
							</Badge>
						)}
					</button>
				</li>
			</ul>
			<CalculatorDialogContent open={calcOpen} />
		</Dialog>
	);
}

type MobileFerramentasItemsProps = {
	onClose: () => void;
};

export function MobileFerramentasItems({
	onClose,
}: MobileFerramentasItemsProps) {
	const { privacyMode, toggle } = usePrivacyMode();
	const [calcOpen, setCalcOpen] = useState(false);

	return (
		<Dialog open={calcOpen} onOpenChange={setCalcOpen}>
			<DialogTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
				>
					<span className="text-muted-foreground shrink-0">
						<RiCalculatorLine className="size-4" />
					</span>
					<span className="flex-1 text-left">calculadora</span>
				</button>
			</DialogTrigger>
			<button
				type="button"
				onClick={() => {
					toggle();
					onClose();
				}}
				className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
			>
				<span className="text-muted-foreground shrink-0">
					{privacyMode ? (
						<RiEyeOffLine className="size-4" />
					) : (
						<RiEyeLine className="size-4" />
					)}
				</span>
				<span className="flex-1 text-left">privacidade</span>
				{privacyMode && (
					<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
						Ativo
					</Badge>
				)}
			</button>
			<CalculatorDialogContent open={calcOpen} />
		</Dialog>
	);
}
