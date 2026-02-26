"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createCategoryAction,
	updateCategoryAction,
} from "@/app/(dashboard)/categorias/actions";
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
import { CATEGORY_TYPES } from "@/lib/categorias/constants";
import { getDefaultIconForType } from "@/lib/categorias/icons";

import { CategoryFormFields } from "./category-form-fields";
import type { Category, CategoryFormValues } from "./types";

interface CategoryDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	category?: Category;
	defaultType?: CategoryFormValues["type"];
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const buildInitialValues = ({
	category,
	defaultType,
}: {
	category?: Category;
	defaultType?: CategoryFormValues["type"];
}): CategoryFormValues => {
	const initialType = category?.type ?? defaultType ?? CATEGORY_TYPES[0];
	const fallbackIcon = getDefaultIconForType(initialType);
	const existingIcon = category?.icon ?? "";
	const icon = existingIcon || fallbackIcon;

	return {
		name: category?.name ?? "",
		type: initialType,
		icon,
	};
};

export function CategoryDialog({
	mode,
	trigger,
	category,
	defaultType,
	open,
	onOpenChange,
}: CategoryDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Use controlled state hook for dialog open state
	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const initialState = buildInitialValues({
		category,
		defaultType,
	});

	// Use form state hook for form management
	const { formState, updateField, setFormState } =
		useFormState<CategoryFormValues>(initialState);

	// Reset form when dialog opens
	useEffect(() => {
		if (dialogOpen) {
			setFormState(initialState);
			setErrorMessage(null);
		}
	}, [dialogOpen, setFormState, initialState]);

	// Clear error when dialog closes
	useEffect(() => {
		if (!dialogOpen) {
			setErrorMessage(null);
		}
	}, [dialogOpen]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);

		if (mode === "update" && !category?.id) {
			const message = "Categoria inválida.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const payload = {
			name: formState.name.trim(),
			type: formState.type,
			icon: formState.icon.trim(),
		};

		startTransition(async () => {
			const result =
				mode === "create"
					? await createCategoryAction(payload)
					: await updateCategoryAction({
							id: category?.id ?? "",
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
	};

	const title = mode === "create" ? "Nova categoria" : "Editar categoria";
	const description =
		mode === "create"
			? "Crie uma categoria para organizar seus lançamentos."
			: "Atualize os detalhes da categoria selecionada.";
	const submitLabel =
		mode === "create" ? "Salvar categoria" : "Atualizar categoria";

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
					<CategoryFormFields values={formState} onChange={updateField} />

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
	);
}
