"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LANCAMENTO_PAYMENT_METHODS } from "@/lib/lancamentos/constants";
import { cn } from "@/lib/utils/ui";
import {
	ContaCartaoSelectContent,
	PaymentMethodSelectContent,
} from "../../select-items";
import type { PaymentMethodSectionProps } from "./lancamento-dialog-types";

export function PaymentMethodSection({
	formState,
	onFieldChange,
	contaOptions,
	cartaoOptions,
	isUpdateMode,
	disablePaymentMethod,
	disableCartaoSelect,
}: PaymentMethodSectionProps) {
	const isCartaoSelected = formState.paymentMethod === "Cartão de crédito";
	const showContaSelect = [
		"Pix",
		"Dinheiro",
		"Boleto",
		"Cartão de débito",
		"Pré-Pago | VR/VA",
		"Transferência bancária",
	].includes(formState.paymentMethod);

	// Filtrar contas apenas do tipo "Pré-Pago | VR/VA" quando forma de pagamento for "Pré-Pago | VR/VA"
	const filteredContaOptions =
		formState.paymentMethod === "Pré-Pago | VR/VA"
			? contaOptions.filter(
					(option) => option.accountType === "Pré-Pago | VR/VA",
				)
			: contaOptions;

	return (
		<>
			{!isUpdateMode ? (
				<div className="flex w-full flex-col gap-2 md:flex-row mt-3">
					<div
						className={cn(
							"space-y-1 w-full",
							isCartaoSelected || showContaSelect ? "md:w-1/2" : "md:w-full",
						)}
					>
						<Label htmlFor="paymentMethod">Forma de pagamento</Label>
						<Select
							value={formState.paymentMethod}
							onValueChange={(value) => onFieldChange("paymentMethod", value)}
							disabled={disablePaymentMethod}
						>
							<SelectTrigger
								id="paymentMethod"
								className="w-full"
								disabled={disablePaymentMethod}
							>
								<SelectValue placeholder="Selecione" className="w-full">
									{formState.paymentMethod && (
										<PaymentMethodSelectContent
											label={formState.paymentMethod}
										/>
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{LANCAMENTO_PAYMENT_METHODS.map((method) => (
									<SelectItem key={method} value={method}>
										<PaymentMethodSelectContent label={method} />
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{isCartaoSelected ? (
						<div className="space-y-1 w-full md:w-1/2">
							<Label htmlFor="cartao">Cartão</Label>
							<Select
								value={formState.cartaoId}
								onValueChange={(value) => onFieldChange("cartaoId", value)}
								disabled={disableCartaoSelect}
							>
								<SelectTrigger
									id="cartao"
									className="w-full"
									disabled={disableCartaoSelect}
								>
									<SelectValue placeholder="Selecione">
										{formState.cartaoId &&
											(() => {
												const selectedOption = cartaoOptions.find(
													(opt) => opt.value === formState.cartaoId,
												);
												return selectedOption ? (
													<ContaCartaoSelectContent
														label={selectedOption.label}
														logo={selectedOption.logo}
														isCartao={true}
													/>
												) : null;
											})()}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{cartaoOptions.length === 0 ? (
										<div className="px-2 py-6 text-center">
											<p className="text-sm text-muted-foreground">
												Nenhum cartão cadastrado
											</p>
										</div>
									) : (
										cartaoOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<ContaCartaoSelectContent
													label={option.label}
													logo={option.logo}
													isCartao={true}
												/>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					) : null}

					{!isCartaoSelected && showContaSelect ? (
						<div
							className={cn(
								"space-y-1 w-full",
								!isUpdateMode ? "md:w-1/2" : "md:w-full",
							)}
						>
							<Label htmlFor="conta">Conta</Label>
							<Select
								value={formState.contaId}
								onValueChange={(value) => onFieldChange("contaId", value)}
							>
								<SelectTrigger id="conta" className="w-full">
									<SelectValue placeholder="Selecione">
										{formState.contaId &&
											(() => {
												const selectedOption = filteredContaOptions.find(
													(opt) => opt.value === formState.contaId,
												);
												return selectedOption ? (
													<ContaCartaoSelectContent
														label={selectedOption.label}
														logo={selectedOption.logo}
														isCartao={false}
													/>
												) : null;
											})()}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{filteredContaOptions.length === 0 ? (
										<div className="px-2 py-6 text-center">
											<p className="text-sm text-muted-foreground">
												Nenhuma conta cadastrada
											</p>
										</div>
									) : (
										filteredContaOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<ContaCartaoSelectContent
													label={option.label}
													logo={option.logo}
													isCartao={false}
												/>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					) : null}
				</div>
			) : null}

			{isUpdateMode ? (
				<div className="flex w-full flex-col gap-2 md:flex-row">
					{isCartaoSelected ? (
						<div
							className={cn(
								"space-y-1 w-full",
								!isUpdateMode ? "md:w-1/2" : "md:w-full",
							)}
						>
							<Label htmlFor="cartaoUpdate">Cartão</Label>
							<Select
								value={formState.cartaoId}
								onValueChange={(value) => onFieldChange("cartaoId", value)}
							>
								<SelectTrigger id="cartaoUpdate" className="w-full">
									<SelectValue placeholder="Selecione">
										{formState.cartaoId &&
											(() => {
												const selectedOption = cartaoOptions.find(
													(opt) => opt.value === formState.cartaoId,
												);
												return selectedOption ? (
													<ContaCartaoSelectContent
														label={selectedOption.label}
														logo={selectedOption.logo}
														isCartao={true}
													/>
												) : null;
											})()}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{cartaoOptions.length === 0 ? (
										<div className="px-2 py-6 text-center">
											<p className="text-sm text-muted-foreground">
												Nenhum cartão cadastrado
											</p>
										</div>
									) : (
										cartaoOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<ContaCartaoSelectContent
													label={option.label}
													logo={option.logo}
													isCartao={true}
												/>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					) : null}

					{!isCartaoSelected && showContaSelect ? (
						<div
							className={cn(
								"space-y-1 w-full",
								!isUpdateMode ? "md:w-1/2" : "md:w-full",
							)}
						>
							<Label htmlFor="contaUpdate">Conta</Label>
							<Select
								value={formState.contaId}
								onValueChange={(value) => onFieldChange("contaId", value)}
							>
								<SelectTrigger id="contaUpdate" className="w-full">
									<SelectValue placeholder="Selecione">
										{formState.contaId &&
											(() => {
												const selectedOption = filteredContaOptions.find(
													(opt) => opt.value === formState.contaId,
												);
												return selectedOption ? (
													<ContaCartaoSelectContent
														label={selectedOption.label}
														logo={selectedOption.logo}
														isCartao={false}
													/>
												) : null;
											})()}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{filteredContaOptions.length === 0 ? (
										<div className="px-2 py-6 text-center">
											<p className="text-sm text-muted-foreground">
												Nenhuma conta cadastrada
											</p>
										</div>
									) : (
										filteredContaOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												<ContaCartaoSelectContent
													label={option.label}
													logo={option.logo}
													isCartao={false}
												/>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					) : null}
				</div>
			) : null}
		</>
	);
}
