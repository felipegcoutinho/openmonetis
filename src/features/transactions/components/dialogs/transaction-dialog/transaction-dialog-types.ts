import type { TransactionFormState } from "@/features/transactions/form-helpers";
import type { SelectOption, TransactionItem } from "../../types";

export type FormState = TransactionFormState;

export interface TransactionDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	payerOptions: SelectOption[];
	splitPayerOptions: SelectOption[];
	defaultPayerId?: string | null;
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	estabelecimentos: string[];
	transaction?: TransactionItem;
	defaultPeriod?: string;
	defaultCardId?: string | null;
	defaultPaymentMethod?: string | null;
	defaultPurchaseDate?: string | null;
	defaultName?: string | null;
	defaultAmount?: string | null;
	lockCardSelection?: boolean;
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
		categoryId: string | undefined;
		note: string;
		payerId: string | undefined;
		accountId: string | undefined;
		cardId: string | undefined;
		amount: number;
		dueDate: string | null;
		boletoPaymentDate: string | null;
		isSettled: boolean | null;
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
	categoryOptions: SelectOption[];
	categoryGroups: Array<{
		label: string;
		options: SelectOption[];
	}>;
	isUpdateMode: boolean;
	hideTransactionType?: boolean;
}

export interface SplitAndSettlementSectionProps extends BaseFieldSectionProps {
	showSettledToggle: boolean;
}

export interface PayerSectionProps extends BaseFieldSectionProps {
	payerOptions: SelectOption[];
	secondaryPayerOptions: SelectOption[];
	totalAmount: number;
}

export interface PaymentMethodSectionProps extends BaseFieldSectionProps {
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	isUpdateMode: boolean;
	disablePaymentMethod: boolean;
	disableCardSelect: boolean;
}

export interface BoletoFieldsSectionProps extends BaseFieldSectionProps {
	showPaymentDate: boolean;
}

export interface ConditionSectionProps extends BaseFieldSectionProps {
	showInstallments: boolean;
	showRecurrence: boolean;
}

export type NoteSectionProps = BaseFieldSectionProps;
