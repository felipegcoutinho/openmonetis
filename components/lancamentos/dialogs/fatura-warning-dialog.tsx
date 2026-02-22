"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MONTH_NAMES } from "@/lib/utils/period";

export type FaturaWarning = {
	nextPeriod: string;
	cardName: string;
	isPaid: boolean;
	isAfterClosing: boolean;
	closingDay: string | null;
	currentPeriod: string;
};

export function formatPeriodDisplay(period: string): string {
	const [yearStr, monthStr] = period.split("-");
	const monthIndex = Number.parseInt(monthStr ?? "1", 10) - 1;
	const monthName = MONTH_NAMES[monthIndex] ?? monthStr;
	return `${monthName}/${yearStr}`;
}

function buildWarningMessage(warning: FaturaWarning): string {
	const currentDisplay = formatPeriodDisplay(warning.currentPeriod);
	if (warning.isPaid && warning.isAfterClosing) {
		return `A fatura do ${warning.cardName} em ${currentDisplay} já está paga e fechou no dia ${warning.closingDay}.`;
	}
	if (warning.isPaid) {
		return `A fatura do ${warning.cardName} em ${currentDisplay} já está paga.`;
	}
	return `A fatura do ${warning.cardName} fechou no dia ${warning.closingDay}.`;
}

interface FaturaWarningDialogProps {
	warning: FaturaWarning | null;
	onConfirm: (nextPeriod: string) => void;
	onCancel: () => void;
}

export function FaturaWarningDialog({
	warning,
	onConfirm,
	onCancel,
}: FaturaWarningDialogProps) {
	if (!warning) return null;

	return (
		<AlertDialog
			open
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
		>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>Fatura indisponível</AlertDialogTitle>
					<AlertDialogDescription>
						{buildWarningMessage(warning)} Deseja registrá-lo em{" "}
						<span className="font-medium text-foreground">
							{formatPeriodDisplay(warning.nextPeriod)}
						</span>
						?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex-col gap-2 sm:flex-col">
					<AlertDialogAction onClick={() => onConfirm(warning.nextPeriod)}>
						Mover para {formatPeriodDisplay(warning.nextPeriod)}
					</AlertDialogAction>
					<AlertDialogCancel onClick={onCancel}>
						Manter em {formatPeriodDisplay(warning.currentPeriod)}
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
