"use client";
import { RiImageAddLine } from "@remixicon/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createPayerAction,
	updatePayerAction,
} from "@/features/payers/actions";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { useFormState } from "@/shared/hooks/use-form-state";
import {
	DEFAULT_PAYER_AVATAR,
	PAYER_STATUS_OPTIONS,
	type PayerStatus,
} from "@/shared/lib/payers/constants";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { StatusSelectContent } from "./payer-select-items";
import type { Payer, PayerFormValues } from "./types";

const AVATAR_MAX_SIZE = 200;

function resizeImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new window.Image();
			img.onload = () => {
				let { width, height } = img;
				if (width > height) {
					if (width > AVATAR_MAX_SIZE) {
						height = Math.round((height * AVATAR_MAX_SIZE) / width);
						width = AVATAR_MAX_SIZE;
					}
				} else {
					if (height > AVATAR_MAX_SIZE) {
						width = Math.round((width * AVATAR_MAX_SIZE) / height);
						height = AVATAR_MAX_SIZE;
					}
				}
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Canvas não disponível"));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", 0.85));
			};
			img.onerror = () => reject(new Error("Falha ao carregar imagem"));
			img.src = e.target?.result as string;
		};
		reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
		reader.readAsDataURL(file);
	});
}

type PayerCreatePayload = Parameters<typeof createPayerAction>[0];

interface PayerDialogProps {
	mode: "create" | "update";
	trigger?: React.ReactNode;
	payer?: Payer;
	avatarOptions: string[];
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const buildInitialValues = ({
	payer,
	avatarOptions,
}: {
	payer?: Payer;
	avatarOptions: string[];
}): PayerFormValues => {
	const defaultAvatar = avatarOptions[0] ?? DEFAULT_PAYER_AVATAR;

	return {
		name: payer?.name ?? "",
		email: payer?.email ?? "",
		status: (payer?.status as PayerStatus) ?? PAYER_STATUS_OPTIONS[0],
		avatarUrl: payer?.avatarUrl ?? defaultAvatar,
		note: payer?.note ?? "",
		isAutoSend: payer?.isAutoSend ?? false,
	};
};

export function PayerDialog({
	mode,
	trigger,
	payer,
	avatarOptions,
	open,
	onOpenChange,
}: PayerDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
	const [isProcessingImage, setIsProcessingImage] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [dialogOpen, setDialogOpen] = useControlledState(
		open,
		false,
		onOpenChange,
	);

	const initialState = useMemo(
		() => buildInitialValues({ payer, avatarOptions }),
		[payer, avatarOptions],
	);

	const { formState, resetForm, updateField } =
		useFormState<PayerFormValues>(initialState);

	// Avatares da biblioteca excluem data URLs (que ficam no círculo de upload)
	const availableAvatars = useMemo(() => {
		const set = new Set([...avatarOptions, DEFAULT_PAYER_AVATAR]);
		if (initialState.avatarUrl && !initialState.avatarUrl.startsWith("data:")) {
			set.add(initialState.avatarUrl);
		}
		return Array.from(set).sort((a, b) =>
			a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
		);
	}, [avatarOptions, initialState.avatarUrl]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsProcessingImage(true);
		try {
			const base64 = await resizeImageToBase64(file);
			setUploadedAvatar(base64);
			updateField("avatarUrl", base64);
		} catch {
			toast.error("Não foi possível processar a imagem.");
		} finally {
			setIsProcessingImage(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	useEffect(() => {
		if (dialogOpen) {
			resetForm(initialState);
			setErrorMessage(null);
			setIsProcessingImage(false);
			// Se o avatar atual for um upload anterior, restaura no círculo
			setUploadedAvatar(
				initialState.avatarUrl.startsWith("data:")
					? initialState.avatarUrl
					: null,
			);
		}
	}, [dialogOpen, initialState, resetForm]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		const payerId = payer?.id;

		if (mode === "update" && !payerId) {
			const message = "Pessoa inválida.";
			setErrorMessage(message);
			toast.error(message);
			return;
		}

		const emailValue = formState.email.trim();
		const payload: PayerCreatePayload = {
			name: formState.name.trim(),
			status: formState.status,
			avatarUrl: formState.avatarUrl,
			email: emailValue || null,
			note: formState.note.trim() || null,
			isAutoSend: formState.isAutoSend,
		};

		startTransition(async () => {
			const result =
				mode === "create"
					? await createPayerAction(payload)
					: await updatePayerAction({ id: payerId ?? "", ...payload });

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

	const title = mode === "create" ? "Nova pessoa" : "Atualizar pessoa";
	const description =
		mode === "create"
			? "Selecione um avatar e informe os detalhes para criar uma nova pessoa."
			: "Atualize os detalhes da pessoa selecionada.";
	const submitLabel = mode === "create" ? "Salvar" : "Atualizar";

	const isUploadSelected =
		uploadedAvatar !== null && formState.avatarUrl === uploadedAvatar;

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className="max-w-2xl px-6 py-5 sm:px-8 sm:py-6">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-3">
							<div className="flex w-full gap-2">
								<div className="flex flex-col gap-2 w-full">
									<Label htmlFor="payer-name">Nome</Label>
									<Input
										id="payer-name"
										value={formState.name}
										onChange={(event) =>
											updateField("name", event.target.value)
										}
										placeholder="Ex.: Felipe Coutinho"
										required
									/>
								</div>

								<div className="flex flex-col gap-2 w-full">
									<Label htmlFor="payer-email">E-mail</Label>
									<Input
										id="payer-email"
										type="email"
										value={formState.email}
										onChange={(event) =>
											updateField("email", event.target.value)
										}
										placeholder="Ex.: felipe@email.com"
									/>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="payer-status">Status</Label>
								<Select
									value={formState.status}
									onValueChange={(value: PayerStatus) =>
										updateField("status", value)
									}
								>
									<SelectTrigger id="payer-status" className="w-full">
										<SelectValue placeholder="Selecione o status">
											{formState.status && (
												<StatusSelectContent label={formState.status} />
											)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{PAYER_STATUS_OPTIONS.map((status) => (
											<SelectItem key={status} value={status}>
												<StatusSelectContent label={status} />
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex flex-col gap-3">
								<div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
									<Checkbox
										id="payer-auto-send"
										checked={formState.isAutoSend}
										onCheckedChange={(checked) =>
											updateField("isAutoSend", Boolean(checked))
										}
										aria-label="Ativar envio automático"
									/>
									<div className="space-y-1">
										<Label
											htmlFor="payer-auto-send"
											className="text-sm font-medium text-foreground"
										>
											Enviar automaticamente
										</Label>
										<p className="text-xs text-muted-foreground">
											Dispare cobranças e lembretes sem intervenção manual.
										</p>
									</div>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<Label>Avatar</Label>
								<div className="flex flex-wrap gap-3">
									{availableAvatars.map((avatar) => {
										const isSelected = avatar === formState.avatarUrl;
										const src = getAvatarSrc(avatar);
										return (
											<button
												type="button"
												key={avatar}
												onClick={() => updateField("avatarUrl", avatar)}
												className="group relative flex items-center justify-center rounded-full p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:ring-2 data-[selected=true]:ring-primary"
												data-selected={isSelected}
												aria-pressed={isSelected}
											>
												<Image
													src={src}
													unoptimized={src.startsWith("data:")}
													alt={`Avatar ${avatar}`}
													width={40}
													height={40}
													className="size-12 rounded-full object-cover hover:scale-110 transition-transform duration-200"
												/>
											</button>
										);
									})}

									{/* Círculo de upload — sempre o último */}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleFileChange}
									/>
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={isProcessingImage}
										className="group relative flex items-center justify-center rounded-full p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:ring-2 data-[selected=true]:ring-primary"
										data-selected={isUploadSelected}
										aria-pressed={isUploadSelected}
										aria-label="Fazer upload de foto"
									>
										{uploadedAvatar ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={uploadedAvatar}
												alt="Avatar personalizado"
												className="size-12 rounded-full object-cover hover:scale-110 transition-transform duration-200"
											/>
										) : (
											<div className="size-12 rounded-full bg-muted border-2 border-dashed border-muted-foreground/20 flex items-center justify-center hover:scale-110 transition-transform duration-200">
												{isProcessingImage ? (
													<span className="text-xs text-muted-foreground animate-pulse">
														...
													</span>
												) : (
													<RiImageAddLine className="size-4 text-muted-foreground/50" />
												)}
											</div>
										)}
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="payer-note">Anotações</Label>
								<Input
									id="payer-note"
									value={formState.note}
									onChange={(event) => updateField("note", event.target.value)}
									placeholder="Observações sobre esta pessoa"
								/>
							</div>
						</div>
					</div>

					{errorMessage ? (
						<p className="text-sm text-destructive">{errorMessage}</p>
					) : null}

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
