import type {
	SelectOption,
	TransactionItem,
} from "@/features/transactions/components/types";

export type CalendarEvent =
	| {
			id: string;
			type: "transaction";
			date: string;
			transaction: TransactionItem;
	  }
	| {
			id: string;
			type: "installment";
			date: string;
			transaction: TransactionItem;
			installmentCount: number;
			installmentValue: number;
	  }
	| {
			id: string;
			type: "boleto";
			date: string;
			transaction: TransactionItem;
	  }
	| {
			id: string;
			type: "card";
			date: string;
			card: {
				id: string;
				name: string;
				dueDay: string;
				closingDay: string;
				brand: string | null;
				status: string;
				logo: string | null;
				totalDue: number | null;
				isPaid: boolean;
				paymentDate: string | null;
			};
	  };

export type CalendarPeriod = {
	period: string;
	monthName: string;
	year: number;
};

export type CalendarDay = {
	date: string;
	label: string;
	isCurrentMonth: boolean;
	isToday: boolean;
	events: CalendarEvent[];
};

export type CalendarFormOptions = {
	payerOptions: SelectOption[];
	splitPayerOptions: SelectOption[];
	defaultPayerId: string | null;
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	estabelecimentos: string[];
};

export type CalendarData = {
	events: CalendarEvent[];
	formOptions: CalendarFormOptions;
};
