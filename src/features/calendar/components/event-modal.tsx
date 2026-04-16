"use client";

import type { ReactNode } from "react";
import { EVENT_TYPE_STYLES } from "@/features/calendar/components/day-cell";
import MoneyValues from "@/shared/components/money-values";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import type { CalendarDay, CalendarEvent } from "@/shared/lib/types/calendar";
import { friendlyDate, parseLocalDateString } from "@/shared/utils/date";
import { formatFinancialDateLabel } from "@/shared/utils/financial-dates";
import { cn } from "@/shared/utils/ui";

type EventModalProps = {
	open: boolean;
	day: CalendarDay | null;
	onClose: () => void;
	onCreate: (date: string) => void;
};

const EventCard = ({
	children,
	type,
	isPagamentoFatura = false,
}: {
	children: ReactNode;
	type: CalendarEvent["type"];
	isPagamentoFatura?: boolean;
}) => {
	const style = isPagamentoFatura
		? { dot: "bg-success" }
		: EVENT_TYPE_STYLES[type];
	return (
		<Card className="flex flex-row gap-2 p-3 mb-1">
			<span
				className={cn("mt-1 size-3 shrink-0 rounded-full", style.dot)}
				aria-hidden
			/>
			<div className="flex flex-1 flex-col">{children}</div>
		</Card>
	);
};

const renderLancamento = (
	event: Extract<CalendarEvent, { type: "transaction" }>,
) => {
	const isReceita = event.transaction.transactionType === "Receita";
	const isPagamentoFatura =
		event.transaction.name.startsWith("Pagamento fatura -");

	return (
		<EventCard type="transaction" isPagamentoFatura={isPagamentoFatura}>
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span
						className={`text-sm font-medium leading-tight ${
							isPagamentoFatura && "text-success"
						}`}
					>
						{event.transaction.name}
					</span>

					<div className="flex gap-1">
						<Badge variant={"outline"}>{event.transaction.categoriaName}</Badge>
					</div>
				</div>
				<span
					className={cn(
						"text-sm font-medium whitespace-nowrap",
						isReceita ? "text-success" : "text-foreground",
					)}
				>
					<MoneyValues
						showPositiveSign
						className="text-base"
						amount={event.transaction.amount}
					/>
				</span>
			</div>
		</EventCard>
	);
};

const renderBoleto = (event: Extract<CalendarEvent, { type: "boleto" }>) => {
	const isPaid = Boolean(event.transaction.isSettled);
	const dueDate = event.transaction.dueDate;
	const dueDateLabel = formatFinancialDateLabel(dueDate, "Vence em", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	return (
		<EventCard type="boleto">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<div className="flex gap-1 items-center">
						<span className="text-sm font-medium leading-tight">
							{event.transaction.name}
						</span>

						{dueDateLabel && (
							<span className="text-xs text-muted-foreground leading-tight">
								{dueDateLabel}
							</span>
						)}
					</div>

					<Badge variant={"outline"}>{isPaid ? "Pago" : "Pendente"}</Badge>
				</div>
				<span className="font-medium">
					<MoneyValues amount={event.transaction.amount} />
				</span>
			</div>
		</EventCard>
	);
};

const renderCard = (event: Extract<CalendarEvent, { type: "card" }>) => (
	<EventCard type="card">
		<div className="flex items-start justify-between gap-3">
			<div className="flex flex-col gap-1">
				<div className="flex gap-1 items-center">
					<span className="text-sm font-medium leading-tight">
						Vencimento Fatura - {event.card.name}
					</span>
				</div>

				<Badge variant={"outline"}>{event.card.status ?? "Invoice"}</Badge>
			</div>
			{event.card.totalDue !== null ? (
				<span className="font-medium">
					<MoneyValues amount={event.card.totalDue} />
				</span>
			) : null}
		</div>
	</EventCard>
);

const renderEvent = (event: CalendarEvent) => {
	switch (event.type) {
		case "transaction":
			return renderLancamento(event);
		case "boleto":
			return renderBoleto(event);
		case "card":
			return renderCard(event);
		default:
			return null;
	}
};

export function EventModal({ open, day, onClose, onCreate }: EventModalProps) {
	const formattedDate = !day
		? ""
		: friendlyDate(parseLocalDateString(day.date));

	const handleCreate = () => {
		if (!day) return;
		onClose();
		onCreate(day.date);
	};

	const description = day?.events.length
		? "Confira os lançamentos e vencimentos cadastrados para este dia."
		: "Nenhum lançamento encontrado para este dia. Você pode criar um novo lançamento agora.";

	return (
		<Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>{formattedDate}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="max-h-[380px] space-y-2 overflow-y-auto pr-2">
					{day?.events.length ? (
						day.events.map((event) => (
							<div key={event.id}>{renderEvent(event)}</div>
						))
					) : (
						<div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
							Nenhum lançamento ou vencimento registrado. Clique em{" "}
							<span className="font-medium text-primary">Novo lançamento</span>{" "}
							para começar.
						</div>
					)}
				</div>

				<DialogFooter>
					<Button onClick={handleCreate} disabled={!day}>
						Novo lançamento
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
