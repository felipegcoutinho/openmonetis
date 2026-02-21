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
	createCardAction,
	updateCardAction,
} from "@/app/(dashboard)/cartoes/actions";
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
import { formatLimitInput } from "@/lib/utils/currency";
import { CardFormFields } from "./card-form-fields";
import { DEFAULT_CARD_BRANDS, DEFAULT_CARD_STATUS } from "./constants";
import type { Card, CardFormValues } from "./types";

type AccountOption = {
	id: string;
	name: string;
	logo: string | null;
};

interface CardDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	logoOptions: string[];
	accounts: AccountOption[];
	card?: Card;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const buildInitialValues = ({
	card,
	logoOptions,
	accounts,
}: {
	card?: Card;
	logoOptions: string[];
	accounts: AccountOption[];
}): CardFormValues => {
	const fallbackLogo = logoOptions[0] ?? "";
	const selectedLogo = normalizeLogo(card?.logo) || fallbackLogo;
	const derivedName = deriveNameFromLogo(selectedLogo);

	return {
		name: card?.name ?? derivedName,
		brand: card?.brand ?? DEFAULT_CARD_BRANDS[0],
		status: card?.status ?? DEFAULT_CARD_STATUS[0],
		closingDay: card?.closingDay ?? "01",
		dueDay: card?.dueDay ?? "10",
		limit: formatLimitInput(card?.limit ?? null),
		note: card?.note ?? "",
		logo: selectedLogo,
		contaId: card?.contaId ?? accounts[0]?.id ?? "",
	};
};

export function CardDialog({
	mode,
	trigger,
	logoOptions,
	accounts,
	card,
	open,
	onOpenChange,
}: CardDialogProps) {
	const [logoDialogOpen, setLogoDialogOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Use controlled state hook for dialog open state
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const initialState = useMemo(
		() => buildInitialValues({ card, logoOptions, accounts }),
		[card, logoOptions, accounts],
	);

	// Use form state hook for form management
	const { formState, updateField, updateFields, setFormState } =
		useFormState<CardFormValues>(initialState);

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

			if (mode === "update" && !card?.id) {
				const message = "Cartão inválido.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			if (!formState.contaId) {
				const message = "Selecione a conta vinculada.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			const payload = { ...formState };

			if (!payload.logo) {
				const message = "Selecione um logo.";
				setErrorMessage(message);
				toast.error(message);
				return;
			}

			startTransition(async () => {
				const result =
					mode === "create"
						? await createCardAction(payload)
						: await updateCardAction({
								id: card?.id ?? "",
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
		[card?.id, formState, initialState, mode, setDialogOpen, setFormState],
	);

	const title = mode === "create" ? "Novo cartão" : "Editar cartão";
	const description =
		mode === "create"
			? "Inclua um novo cartão de crédito para acompanhar seus gastos."
			: "Atualize as informações do cartão selecionado.";
	const submitLabel = mode === "create" ? "Salvar cartão" : "Atualizar cartão";

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
					className=""
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
						<LogoPickerTrigger
							selectedLogo={formState.logo}
							disabled={logoOptions.length === 0}
							helperText="Clique para escolher o logo do cartão"
							onOpen={() => {
								if (logoOptions.length > 0) {
									setLogoDialogOpen(true);
								}
							}}
						/>

						<CardFormFields
							values={formState}
							accountOptions={accounts}
							onChange={updateField}
						/>

						{errorMessage && (
							<p className="text-sm text-destructive">{errorMessage}</p>
						)}

						<DialogFooter className="gap-3">
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
