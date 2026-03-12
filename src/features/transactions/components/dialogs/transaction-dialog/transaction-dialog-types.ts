import type { LancamentoFormState } from "@/features/transactions/form-helpers";
import type { LancamentoItem, SelectOption } from "../../types";

export type FormState = LancamentoFormState;

export interface LancamentoDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	pagadorOptions: SelectOption[];
	splitPagadorOptions: SelectOption[];
	defaultPagadorId?: string | null;
	contaOptions: SelectOption[];
	cartaoOptions: SelectOption[];
	categoriaOptions: SelectOption[];
	estabelecimentos: string[];
	lancamento?: LancamentoItem;
	defaultPeriod?: string;
	defaultCartaoId?: string | null;
	defaultPaymentMethod?: string | null;
	defaultPurchaseDate?: string | null;
	defaultName?: string | null;
	defaultAmount?: string | null;
	lockCartaoSelection?: boolean;
	lockPaymentMethod?: boolean;
	isImporting?: boolean;
	defaultTransactionType?: "Despesa" | "Receita";
	/** Force showing transaction type select even when defaultTransactionType is set */
	forceShowTransactionType?: boolean;
	/** Called after successful create/update. Receives the action result. */
	onSuccess?: () => void;
	onBulkEditRequest?: (data: {
		id: string;
		name: string;
		categoriaId: string | undefined;
		note: string;
		pagadorId: string | undefined;
		contaId: string | undefined;
		cartaoId: string | undefined;
		amount: number;
		dueDate: string | null;
		boletoPaymentDate: string | null;
	}) => void;
}

export interface BaseFieldSectionProps {
	formState: FormState;
	onFieldChange: <Key extends keyof FormState>(
		key: Key,
		value: FormState[Key],
	) => void;
}

export interface BasicFieldsSectionProps extends BaseFieldSectionProps {
	estabelecimentos: string[];
}

export interface CategorySectionProps extends BaseFieldSectionProps {
	categoriaOptions: SelectOption[];
	categoriaGroups: Array<{
		label: string;
		options: SelectOption[];
	}>;
	isUpdateMode: boolean;
	hideTransactionType?: boolean;
}

export interface SplitAndSettlementSectionProps extends BaseFieldSectionProps {
	showSettledToggle: boolean;
}

export interface PagadorSectionProps extends BaseFieldSectionProps {
	pagadorOptions: SelectOption[];
	secondaryPagadorOptions: SelectOption[];
	totalAmount: number;
}

export interface PaymentMethodSectionProps extends BaseFieldSectionProps {
	contaOptions: SelectOption[];
	cartaoOptions: SelectOption[];
	isUpdateMode: boolean;
	disablePaymentMethod: boolean;
	disableCartaoSelect: boolean;
}

export interface BoletoFieldsSectionProps extends BaseFieldSectionProps {
	showPaymentDate: boolean;
}

export interface ConditionSectionProps extends BaseFieldSectionProps {
	showInstallments: boolean;
	showRecurrence: boolean;
}

export type NoteSectionProps = BaseFieldSectionProps;
