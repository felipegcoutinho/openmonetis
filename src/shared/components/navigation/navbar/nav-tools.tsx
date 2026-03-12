"use client";

import { RiCalculatorLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { usePrivacyMode } from "@/shared/components/providers/privacy-provider";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/ui";

const itemClass =
	"flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer";

type NavToolsDropdownProps = {
	onOpenCalculator: () => void;
};

export function NavToolsDropdown({ onOpenCalculator }: NavToolsDropdownProps) {
	const { privacyMode, toggle } = usePrivacyMode();

	return (
		<ul className="grid w-52 gap-0.5 p-2">
			<li>
				<button
					type="button"
					className={cn(itemClass)}
					onClick={onOpenCalculator}
				>
					<span className="text-muted-foreground shrink-0">
						<RiCalculatorLine className="size-4" />
					</span>
					<span className="flex-1 text-left">calculadora</span>
				</button>
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
							className="text-[10px] px-1.5 py-0 h-4 text-success"
						>
							Ativo
						</Badge>
					)}
				</button>
			</li>
		</ul>
	);
}

type MobileToolsProps = {
	onClose: () => void;
	onOpenCalculator: () => void;
};

export function MobileTools({ onClose, onOpenCalculator }: MobileToolsProps) {
	const { privacyMode, toggle } = usePrivacyMode();

	return (
		<>
			<button
				type="button"
				onClick={() => {
					onClose();
					onOpenCalculator();
				}}
				className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
			>
				<span className="text-muted-foreground shrink-0">
					<RiCalculatorLine className="size-4" />
				</span>
				<span className="flex-1 text-left">calculadora</span>
			</button>
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
					<Badge
						variant="secondary"
						className="text-[10px] px-1.5 py-0 h-4 text-success"
					>
						Ativo
					</Badge>
				)}
			</button>
		</>
	);
}
