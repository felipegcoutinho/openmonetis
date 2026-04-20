"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { DatePicker } from "@/shared/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";

type EditPaymentDateDialogProps = {
	trigger: React.ReactNode;
	currentDate: Date;
	onDateChange: (date: Date) => void;
};

export function EditPaymentDateDialog({
	trigger,
	currentDate,
	onDateChange,
}: EditPaymentDateDialogProps) {
	const [open, setOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

	const handleSave = () => {
		onDateChange(selectedDate);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Atualizar data de pagamento</DialogTitle>
					<DialogDescription>
						Selecione a data em que o pagamento foi realizado.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="payment-date">Data de pagamento</Label>
						<DatePicker
							id="payment-date"
							value={selectedDate.toISOString().split("T")[0] ?? ""}
							onChange={(value) => {
								if (value) {
									setSelectedDate(new Date(value));
								}
							}}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Cancelar
					</Button>
					<Button type="button" onClick={handleSave}>
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
