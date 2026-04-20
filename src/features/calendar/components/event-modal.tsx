"use client";

import { RiCalendarEventLine } from "@remixicon/react";
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
}: {
	children: ReactNode;
	type: CalendarEvent["type"];
}) => {
	const style = EVENT_TYPE_STYLES[type];
	return (
		<Card className="flex flex-row gap-2 p-3">
			<span
				className={cn("mt-1 size-3 shrink-0 rounded-full", style.dot)}
				aria-hidden
			/>
			<div className="flex flex-1 flex-col">{children}</div>
		</Card>
	);
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
};

const renderLancamento = (
	event: Extract<CalendarEvent, { type: "transaction" }>,
) => {
	const isReceita = event.transaction.transactionType === "Receita";

	return (
		<EventCard type="transaction">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium leading-tight">
						{event.transaction.name}
					</span>
					<Badge variant="outline">{event.transaction.categoriaName}</Badge>
				</div>
				<MoneyValues
					showPositiveSign
					className={cn(
						"text-base whitespace-nowrap font-medium",
						isReceita ? "text-success" : "text-foreground",
					)}
					amount={event.transaction.amount}
				/>
			</div>
		</EventCard>
	);
};

const renderBoleto = (event: Extract<CalendarEvent, { type: "boleto" }>) => {
	const isPaid = Boolean(event.transaction.isSettled);
	const dueDateLabel = formatFinancialDateLabel(
		event.transaction.dueDate,
		"Vence em",
		DATE_FORMAT,
	);
	const paymentDateLabel = isPaid
		? formatFinancialDateLabel(
				event.transaction.boletoPaymentDate,
				"Pago em",
				DATE_FORMAT,
			)
		: null;

	return (
		<EventCard type="boleto">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium leading-tight">
						{event.transaction.name}
					</span>
					<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
						{dueDateLabel && (
							<span className="text-muted-foreground">{dueDateLabel}</span>
						)}
						{paymentDateLabel && (
							<span className="text-success">{paymentDateLabel}</span>
						)}
					</div>
					<Badge variant="outline">{isPaid ? "Pago" : "Pendente"}</Badge>
				</div>
				<MoneyValues
					className="font-medium whitespace-nowrap"
					amount={event.transaction.amount}
				/>
			</div>
		</EventCard>
	);
};

const renderCard = (event: Extract<CalendarEvent, { type: "card" }>) => {
	const paymentDateLabel = event.card.isPaid
		? formatFinancialDateLabel(event.card.paymentDate, "Pago em", DATE_FORMAT)
		: null;

	return (
		<EventCard type="card">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium leading-tight">
						Vencimento Fatura — {event.card.name}
					</span>
					{paymentDateLabel && (
						<span className="text-xs text-success">{paymentDateLabel}</span>
					)}
					<Badge variant="outline">
						{event.card.isPaid ? "Pago" : (event.card.status ?? "Fatura")}
					</Badge>
				</div>
				{event.card.totalDue !== null ? (
					<MoneyValues
						className="font-medium whitespace-nowrap"
						amount={event.card.totalDue}
					/>
				) : null}
			</div>
		</EventCard>
	);
};

const SECTION_LABELS: Record<CalendarEvent["type"], string> = {
	transaction: "Lançamentos",
	boleto: "Boletos",
	card: "Faturas",
};

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

	const hasEvents = Boolean(day?.events.length);

	const grouped = day
		? {
				transaction: day.events.filter((e) => e.type === "transaction"),
				boleto: day.events.filter((e) => e.type === "boleto"),
				card: day.events.filter((e) => e.type === "card"),
			}
		: null;

	return (
		<Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>{formattedDate}</DialogTitle>
					<DialogDescription>
						{hasEvents
							? "Lançamentos e vencimentos cadastrados para este dia."
							: "Nenhum lançamento encontrado para este dia."}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[380px] space-y-3 overflow-y-auto pr-2">
					{hasEvents && grouped ? (
						(["transaction", "boleto", "card"] as const)
							.filter((type) => grouped[type].length > 0)
							.map((type) => (
								<div key={type} className="space-y-1.5">
									<p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{SECTION_LABELS[type]}
									</p>
									<div className="space-y-1.5">
										{grouped[type].map((event) => (
											<div key={event.id}>{renderEvent(event)}</div>
										))}
									</div>
								</div>
							))
					) : (
						<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center">
							<RiCalendarEventLine className="size-8 text-muted-foreground/50" />
							<p className="text-sm text-muted-foreground">
								Nenhum lançamento registrado para este dia.
							</p>
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
