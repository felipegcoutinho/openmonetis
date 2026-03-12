"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/shared/lib/types/actions";

export type PaymentDialogState = "idle" | "processing" | "success";

type UsePaymentDialogControllerOptions<TItem> = {
	items: TItem[];
	getItemId: (item: TItem) => string;
	isItemConfirmed: (item: TItem) => boolean;
	executeConfirm: (item: TItem) => Promise<ActionResult>;
	applyConfirmedState: (item: TItem) => TItem;
};

export type PaymentDialogController<TItem> = {
	items: TItem[];
	selectedItem: TItem | null;
	isModalOpen: boolean;
	modalState: PaymentDialogState;
	isPending: boolean;
	openPaymentDialog: (itemId: string) => void;
	closePaymentDialog: () => void;
	confirmPayment: () => void;
};

export function usePaymentDialogController<TItem>({
	items,
	getItemId,
	isItemConfirmed,
	executeConfirm,
	applyConfirmedState,
}: UsePaymentDialogControllerOptions<TItem>): PaymentDialogController<TItem> {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [localItems, setLocalItems] = useState(items);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalState, setModalState] = useState<PaymentDialogState>("idle");

	useEffect(() => {
		setLocalItems(items);
	}, [items]);

	const selectedItem = useMemo(
		() => localItems.find((item) => getItemId(item) === selectedId) ?? null,
		[localItems, selectedId, getItemId],
	);

	const openPaymentDialog = (itemId: string) => {
		setSelectedId(itemId);
		setModalState("idle");
		setIsModalOpen(true);
	};

	const closePaymentDialog = () => {
		setIsModalOpen(false);
		setSelectedId(null);
		setModalState("idle");
	};

	const confirmPayment = () => {
		const itemToUpdate = selectedItem;
		if (
			!itemToUpdate ||
			isItemConfirmed(itemToUpdate) ||
			modalState === "processing" ||
			isPending
		) {
			return;
		}

		const itemId = getItemId(itemToUpdate);
		setModalState("processing");

		startTransition(() => {
			void (async () => {
				const result = await executeConfirm(itemToUpdate);

				if (!result.success) {
					toast.error(result.error);
					setModalState("idle");
					return;
				}

				setLocalItems((previous) =>
					previous.map((item) =>
						getItemId(item) === itemId ? applyConfirmedState(item) : item,
					),
				);
				toast.success(result.message);
				router.refresh();
				setModalState("success");
			})();
		});
	};

	return {
		items: localItems,
		selectedItem,
		isModalOpen,
		modalState,
		isPending,
		openPaymentDialog,
		closePaymentDialog,
		confirmPayment,
	};
}
