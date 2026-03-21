"use client";

import {
	AccountCardSelectContent,
	CategorySelectContent,
	PayerSelectContent,
} from "@/features/transactions/components/select-items";
import type { SelectOption } from "@/features/transactions/components/types";
import { PeriodPicker } from "@/shared/components/period-picker";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";

export type AccountCardValue = `card:${string}` | `account:${string}`;

export function encodeAccountCard(
	type: "card" | "account",
	id: string,
): AccountCardValue {
	return `${type}:${id}` as AccountCardValue;
}

export function decodeAccountCard(value: string): {
	type: "card" | "account";
	id: string;
} | null {
	if (value.startsWith("card:")) return { type: "card", id: value.slice(5) };
	if (value.startsWith("account:")) return { type: "account", id: value.slice(8) };
	return null;
}

interface GlobalFieldsProps {
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	payerOptions: SelectOption[];
	categoryOptions: SelectOption[];
	accountCardValue: string | null;
	payerId: string | null;
	invoicePeriod: string | null;
	onAccountCardChange: (value: string | null) => void;
	onPayerChange: (value: string | null) => void;
	onInvoicePeriodChange: (value: string | null) => void;
	onBulkCategoryChange: (categoryId: string) => void;
}

export function GlobalFields({
	accountOptions,
	cardOptions,
	payerOptions,
	categoryOptions,
	accountCardValue,
	payerId,
	invoicePeriod,
	onAccountCardChange,
	onPayerChange,
	onInvoicePeriodChange,
	onBulkCategoryChange,
}: GlobalFieldsProps) {
	const isCard = accountCardValue?.startsWith("card:") ?? false;
	const expenseCategories = categoryOptions.filter((o) => o.group === "despesa");
	const incomeCategories = categoryOptions.filter((o) => o.group === "receita");

	return (
		<div className="flex flex-col gap-2">
			<p className="text-muted-foreground text-sm">
				Aplicado a todos os lançamentos importados.
			</p>
			<div className="flex flex-wrap gap-4">
				<div className="flex min-w-44 flex-col gap-1.5">
					<Label>Conta / Cartão</Label>
					<Select
						value={accountCardValue ?? ""}
						onValueChange={(v) => onAccountCardChange(v || null)}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecionar conta ou cartão…" />
						</SelectTrigger>
						<SelectContent>
							{cardOptions.length > 0 && (
								<SelectGroup>
									<SelectLabel>Cartões</SelectLabel>
									{cardOptions.map((opt) => (
										<SelectItem key={opt.value} value={`card:${opt.value}`}>
											<AccountCardSelectContent
												label={opt.label}
												logo={opt.logo}
												isCartao
											/>
										</SelectItem>
									))}
								</SelectGroup>
							)}
							{cardOptions.length > 0 && accountOptions.length > 0 && (
								<SelectSeparator />
							)}
							{accountOptions.length > 0 && (
								<SelectGroup>
									<SelectLabel>Contas</SelectLabel>
									{accountOptions.map((opt) => (
										<SelectItem key={opt.value} value={`account:${opt.value}`}>
											<AccountCardSelectContent
												label={opt.label}
												logo={opt.logo}
												isCartao={false}
											/>
										</SelectItem>
									))}
								</SelectGroup>
							)}
						</SelectContent>
					</Select>
				</div>

				<div className="flex min-w-44 flex-col gap-1.5">
					<Label>Pagador</Label>
					<Select
						value={payerId ?? ""}
						onValueChange={(v) => onPayerChange(v || null)}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecionar pagador…" />
						</SelectTrigger>
						<SelectContent>
							{payerOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									<PayerSelectContent label={opt.label} avatarUrl={opt.avatarUrl} />
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex min-w-44 flex-col gap-1.5">
					<Label>Categoria</Label>
					<Select onValueChange={onBulkCategoryChange}>
						<SelectTrigger>
							<SelectValue placeholder="Aplicar a todas selecionadas…" />
						</SelectTrigger>
						<SelectContent>
							{expenseCategories.length > 0 && (
								<SelectGroup>
									<SelectLabel>Despesa</SelectLabel>
									{expenseCategories.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											<CategorySelectContent label={opt.label} icon={opt.icon} />
										</SelectItem>
									))}
								</SelectGroup>
							)}
							{expenseCategories.length > 0 && incomeCategories.length > 0 && (
								<SelectSeparator />
							)}
							{incomeCategories.length > 0 && (
								<SelectGroup>
									<SelectLabel>Receita</SelectLabel>
									{incomeCategories.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											<CategorySelectContent label={opt.label} icon={opt.icon} />
										</SelectItem>
									))}
								</SelectGroup>
							)}
						</SelectContent>
					</Select>
				</div>

			{isCard && (
				<div className="flex min-w-44 flex-col gap-1.5">
					<Label>Fatura</Label>
					<PeriodPicker
						value={invoicePeriod ?? ""}
						onChange={(v) => onInvoicePeriodChange(v || null)}
						placeholder="Selecionar fatura…"
					/>
				</div>
			)}
		</div>
	</div>
	);
}
