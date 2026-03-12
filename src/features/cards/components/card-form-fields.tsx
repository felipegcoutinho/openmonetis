"use client";

import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
	DAYS_IN_MONTH,
	DEFAULT_CARD_BRANDS,
	DEFAULT_CARD_STATUS,
} from "@/shared/lib/cards/constants";
import {
	AccountSelectContent,
	BrandSelectContent,
	StatusSelectContent,
} from "./card-select-items";
import type { CardFormValues } from "./types";

interface AccountOption {
	id: string;
	name: string;
	logo: string | null;
}

interface CardFormFieldsProps {
	values: CardFormValues;
	accountOptions: AccountOption[];
	onChange: (field: keyof CardFormValues, value: string) => void;
}

const ensureOption = (options: string[], value: string) => {
	if (!value) {
		return options;
	}
	return options.includes(value) ? options : [value, ...options];
};

export function CardFormFields({
	values,
	accountOptions,
	onChange,
}: CardFormFieldsProps) {
	const brands = ensureOption(
		DEFAULT_CARD_BRANDS as unknown as string[],
		values.brand,
	);
	const statuses = ensureOption(
		DEFAULT_CARD_STATUS as unknown as string[],
		values.status,
	);

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div className="flex flex-col gap-2">
				<Label htmlFor="card-name">Nome do cartão</Label>
				<Input
					id="card-name"
					value={values.name}
					onChange={(event) => onChange("name", event.target.value)}
					placeholder="Ex.: Nubank Platinum"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="card-brand">Bandeira</Label>
				<Select
					value={values.brand}
					onValueChange={(value) => onChange("brand", value)}
				>
					<SelectTrigger id="card-brand" className="w-full">
						<SelectValue placeholder="Selecione a bandeira">
							{values.brand && <BrandSelectContent label={values.brand} />}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{brands.map((brand) => (
							<SelectItem key={brand} value={brand}>
								<BrandSelectContent label={brand} />
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="card-status">Status</Label>
				<Select
					value={values.status}
					onValueChange={(value) => onChange("status", value)}
				>
					<SelectTrigger id="card-status" className="w-full">
						<SelectValue placeholder="Selecione o status">
							{values.status && <StatusSelectContent label={values.status} />}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{statuses.map((status) => (
							<SelectItem key={status} value={status}>
								<StatusSelectContent label={status} />
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="card-limit">Limite (R$)</Label>
				<CurrencyInput
					id="card-limit"
					value={values.limit}
					onValueChange={(value) => onChange("limit", value)}
					placeholder="R$ 0,00"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="card-closing-day">Dia de fechamento</Label>
				<Select
					value={values.closingDay}
					onValueChange={(value) => onChange("closingDay", value)}
				>
					<SelectTrigger id="card-closing-day" className="w-full">
						<SelectValue placeholder="Dia de fechamento" />
					</SelectTrigger>
					<SelectContent>
						{DAYS_IN_MONTH.map((day) => (
							<SelectItem key={day} value={day}>
								Dia {day}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="card-due-day">Dia de vencimento</Label>
				<Select
					value={values.dueDay}
					onValueChange={(value) => onChange("dueDay", value)}
				>
					<SelectTrigger id="card-due-day" className="w-full">
						<SelectValue placeholder="Dia de vencimento" />
					</SelectTrigger>
					<SelectContent>
						{DAYS_IN_MONTH.map((day) => (
							<SelectItem key={day} value={day}>
								Dia {day}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2 sm:col-span-2">
				<Label htmlFor="card-account">Conta vinculada</Label>
				<Select
					value={values.contaId}
					onValueChange={(value) => onChange("contaId", value)}
					disabled={accountOptions.length === 0}
				>
					<SelectTrigger id="card-account" className="w-full">
						<SelectValue
							placeholder={
								accountOptions.length === 0
									? "Cadastre uma conta primeiro"
									: "Selecione a conta"
							}
						>
							{values.contaId &&
								(() => {
									const selectedAccount = accountOptions.find(
										(acc) => acc.id === values.contaId,
									);
									return selectedAccount ? (
										<AccountSelectContent
											label={selectedAccount.name}
											logo={selectedAccount.logo}
										/>
									) : null;
								})()}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{accountOptions.map((account) => (
							<SelectItem key={account.id} value={account.id}>
								<AccountSelectContent
									label={account.name}
									logo={account.logo}
								/>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2 sm:col-span-2">
				<Label htmlFor="card-note">Anotação</Label>
				<Textarea
					id="card-note"
					value={values.note}
					onChange={(event) => onChange("note", event.target.value)}
					placeholder="Observações sobre este cartão"
				/>
			</div>
		</div>
	);
}
