"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createCardAction, updateCardAction } from "@/features/cards/actions";
import {
	LogoPickerDialog,
	LogoPickerTrigger,
} from "@/shared/components/logo-picker";
import { useLogoSelection } from "@/shared/components/logo-picker/use-logo-selection";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { useFormState } from "@/shared/hooks/use-form-state";
import {
	DEFAULT_CARD_BRANDS,
	DEFAULT_CARD_STATUS,
} from "@/shared/lib/cards/constants";
import { deriveNameFromLogo, normalizeLogo } from "@/shared/lib/logo";
import {
	formatLimitInput,
	normalizeDecimalInput,
} from "@/shared/utils/currency";
import { CardFormFields } from "./card-form-fields";
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
		accountId: card?.accountId ?? accounts[0]?.id ?? "",
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
	const { formState, resetForm, updateField, updateFields } =
		useFormState<CardFormValues>(initialState);

	// Reset form when dialog opens
	useEffect(() => {
		if (dialogOpen) {
			resetForm(initialState);
			setErrorMessage(null);
		}
	}, [dialogOpen, initialState, resetForm]);

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

	type CardCreatePayload = Parameters<typeof createCardAction>[0];

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);

		if (mode === "update" && !card?.id) {
			const message = "Cartão inválido.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		if (!formState.accountId) {
			const message = "Selecione a conta vinculada.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const rawLimit = normalizeDecimalInput(formState.limit);
		const payload: CardCreatePayload = {
			name: formState.name.trim(),
			brand: formState.brand,
			status: formState.status,
			closingDay: formState.closingDay,
			dueDay: formState.dueDay,
			limit: rawLimit ? Number(rawLimit) : null,
			note: formState.note.trim() || null,
			logo: formState.logo,
			accountId: formState.accountId,
		};

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
				resetForm(initialState);
				return;
			}

			setErrorMessage(result.error);
			toast.error(result.error);
		});
	};

	const title = mode === "create" ? "Novo cartão" : "Atualizar cartão";
	const description =
		mode === "create"
			? "Inclua um novo cartão de crédito para acompanhar seus gastos."
			: "Atualize as informações do cartão selecionado.";
	const submitLabel = mode === "create" ? "Salvar" : "Atualizar";

	const handleMainDialogOpenChange = (open: boolean) => {
		if (!open && logoDialogOpen) {
			return;
		}
		setDialogOpen(open);
	};

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
