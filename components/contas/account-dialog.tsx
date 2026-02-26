"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import {
	createAccountAction,
	updateAccountAction,
} from "@/app/(dashboard)/contas/actions";
import { LogoPickerDialog, LogoPickerTrigger } from "@/components/logo-picker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useControlledState } from "@/hooks/use-controlled-state";
import { useFormState } from "@/hooks/use-form-state";
import { useLogoSelection } from "@/hooks/use-logo-selection";
import { deriveNameFromLogo, normalizeLogo } from "@/lib/logo";
import { formatInitialBalanceInput } from "@/lib/utils/currency";

import { AccountFormFields } from "./account-form-fields";
import type { Account, AccountFormValues } from "./types";

const DEFAULT_ACCOUNT_TYPES = [
	"Conta Corrente",
	"Conta Poupança",
	"Carteira Digital",
	"Conta Investimento",
	"Pré-Pago | VR/VA",
] as const;

const DEFAULT_ACCOUNT_STATUS = ["Ativa", "Inativa"] as const;

interface AccountDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	logoOptions: string[];
	account?: Account;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const buildInitialValues = ({
	account,
	logoOptions,
	accountTypes,
	accountStatuses,
}: {
	account?: Account;
	logoOptions: string[];
	accountTypes: string[];
	accountStatuses: string[];
}): AccountFormValues => {
	const fallbackLogo = logoOptions[0] ?? "";
	const selectedLogo = normalizeLogo(account?.logo) || fallbackLogo;
	const derivedName = deriveNameFromLogo(selectedLogo);

	return {
		name: account?.name ?? derivedName,
		accountType: account?.accountType ?? accountTypes[0] ?? "",
		status: account?.status ?? accountStatuses[0] ?? "",
		note: account?.note ?? "",
		logo: selectedLogo,
		initialBalance: formatInitialBalanceInput(account?.initialBalance ?? 0),
		excludeFromBalance: account?.excludeFromBalance ?? false,
		excludeInitialBalanceFromIncome:
			account?.excludeInitialBalanceFromIncome ?? false,
	};
};

export function AccountDialog({
	mode,
	trigger,
	logoOptions,
	account,
	open,
	onOpenChange,
}: AccountDialogProps) {
	const [logoDialogOpen, setLogoDialogOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Use controlled state hook for dialog open state
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const accountTypes = useMemo(() => {
		const values = new Set<string>(DEFAULT_ACCOUNT_TYPES);
		if (account?.accountType) {
			values.add(account.accountType);
		}
		return Array.from(values);
	}, [account?.accountType]);

	const accountStatuses = useMemo(() => {
		const values = new Set<string>(DEFAULT_ACCOUNT_STATUS);
		if (account?.status) {
			values.add(account.status);
		}
		return Array.from(values);
	}, [account?.status]);

	const initialState = useMemo(
		() =>
			buildInitialValues({
				account,
				logoOptions,
				accountTypes,
				accountStatuses,
			}),
		[account, logoOptions, accountTypes, accountStatuses],
	);

	// Use form state hook for form management
	const { formState, updateField, updateFields, setFormState } =
		useFormState<AccountFormValues>(initialState);

	// Reset form when dialog opens
	useEffect(() => {
		if (dialogOpen) {
			setFormState(initialState);
			setErrorMessage(null);
		}
	}, [dialogOpen, initialState, setFormState]);

	// Close logo dialog when main dialog closes
	useEffect(() => {
		if (!dialogOpen) {
			setErrorMessage(null);
			setLogoDialogOpen(false);
		}
	}, [dialogOpen]);

	// Use logo selection hook
	const handleLogoSelection = useLogoSelection({
		mode,
		currentLogo: formState.logo,
		currentName: formState.name,
		onUpdate: (updates) => {
			updateFields(updates);
			// Delay closing to avoid race condition on mobile
			requestAnimationFrame(() => {
				setLogoDialogOpen(false);
			});
		},
	});

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setErrorMessage(null);

			if (mode === "update" && !account?.id) {
				const message = "Conta inválida.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			const payload = { ...formState };

			if (!payload.logo) {
				setErrorMessage("Selecione um logo.");
				return;
			}

			startTransition(async () => {
				const result =
					mode === "create"
						? await createAccountAction(payload)
						: await updateAccountAction({
								id: account?.id ?? "",
								...payload,
							});

				if (result.success) {
					toast.success(result.message);
					setDialogOpen(false);
					setFormState(initialState);
					return;
				}

				setErrorMessage(result.error);
				toast.error(result.error);
			});
		},
		[account?.id, formState, initialState, mode, setDialogOpen, setFormState],
	);

	const title = mode === "create" ? "Nova conta" : "Editar conta";
	const description =
		mode === "create"
			? "Cadastre uma nova conta para organizar seus lançamentos."
			: "Atualize as informações da conta selecionada.";
	const submitLabel = mode === "create" ? "Salvar conta" : "Atualizar conta";

	const handleMainDialogOpenChange = useCallback(
		(open: boolean) => {
			if (!open && logoDialogOpen) {
				return;
			}
			setDialogOpen(open);
		},
		[logoDialogOpen, setDialogOpen],
	);

	return (
		<>
			<Dialog open={dialogOpen} onOpenChange={handleMainDialogOpenChange}>
				{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
				<DialogContent
					className="sm:max-w-xl"
					onPointerDownOutside={(e) => {
						if (logoDialogOpen) e.preventDefault();
					}}
					onInteractOutside={(e) => {
						if (logoDialogOpen) e.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<LogoPickerTrigger
								selectedLogo={formState.logo}
								disabled={logoOptions.length === 0}
								onOpen={() => {
									if (logoOptions.length > 0) {
										setLogoDialogOpen(true);
									}
								}}
							/>
						</div>

						<AccountFormFields
							values={formState}
							accountTypes={accountTypes}
							accountStatuses={accountStatuses}
							onChange={updateField}
							showInitialBalance={mode === "create"}
						/>

						{errorMessage && (
							<p className="text-sm text-destructive">{errorMessage}</p>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
								disabled={isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? "Salvando..." : submitLabel}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<LogoPickerDialog
				open={logoDialogOpen}
				logos={logoOptions}
				value={formState.logo}
				onOpenChange={setLogoDialogOpen}
				onSelect={handleLogoSelection}
			/>
		</>
	);
}
