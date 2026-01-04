import type { LancamentoItem, SelectOption } from "@/components/lancamentos/types";

export type CalendarEventType = "lancamento" | "boleto" | "cartao";

export type CalendarEvent =
  | {
      id: string;
      type: "lancamento";
      date: string;
      lancamento: LancamentoItem;
    }
  | {
      id: string;
      type: "boleto";
      date: string;
      lancamento: LancamentoItem;
    }
  | {
      id: string;
      type: "cartao";
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
  pagadorOptions: SelectOption[];
  splitPagadorOptions: SelectOption[];
  defaultPagadorId: string | null;
  contaOptions: SelectOption[];
  cartaoOptions: SelectOption[];
  categoriaOptions: SelectOption[];
  estabelecimentos: string[];
};

export type CalendarData = {
  events: CalendarEvent[];
  formOptions: CalendarFormOptions;
};
