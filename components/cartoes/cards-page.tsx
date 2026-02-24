"use client";

import { RiAddCircleLine, RiBankCard2Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteCardAction } from "@/app/(dashboard)/cartoes/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardDialog } from "./card-dialog";
import { CardItem } from "./card-item";

type AccountOption = {
	id: string;
	name: string;
};

interface CardsPageProps {
	cards: Card[];
	archivedCards: Card[];
	accounts: AccountOption[];
	logoOptions: string[];
}

export function CardsPage({
	cards,
	archivedCards,
	accounts,
	logoOptions,
}: CardsPageProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("ativos");
	const [editOpen, setEditOpen] = useState(false);
	const [selectedCard, setSelectedCard] = useState<Card | null>(null);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [cardToRemove, setCardToRemove] = useState<Card | null>(null);

	const sortCards = useCallback(
		(list: Card[]) =>
			[...list].sort((a, b) =>
				a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
			),
		[],
	);

	const orderedCards = useMemo(() => sortCards(cards), [cards, sortCards]);
	const orderedArchivedCards = useMemo(
		() => sortCards(archivedCards),
		[archivedCards, sortCards],
	);

	const handleEdit = useCallback((card: Card) => {
		setSelectedCard(card);
		setEditOpen(true);
	}, []);

	const handleEditOpenChange = useCallback((open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedCard(null);
		}
	}, []);

	const handleRemoveRequest = useCallback((card: Card) => {
		setCardToRemove(card);
		setRemoveOpen(true);
	}, []);

	const handleInvoice = useCallback(
		(card: Card) => {
			router.push(`/cartoes/${card.id}/fatura`);
		},
		[router],
	);

	const handleRemoveOpenChange = useCallback((open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setCardToRemove(null);
		}
	}, []);

	const handleRemoveConfirm = useCallback(async () => {
		if (!cardToRemove) {
			return;
		}

		const result = await deleteCardAction({ id: cardToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	}, [cardToRemove]);

	const removeTitle = cardToRemove
		? `Remover cartão "${cardToRemove.name}"?`
		: "Remover cartão?";

	const renderCardList = (list: Card[], isArchived: boolean) => {
		if (list.length === 0) {
			return (
				<Card className="flex w-full items-center justify-center py-12">
					<EmptyState
						media={<RiBankCard2Line className="size-6 text-primary" />}
						title={
							isArchived
								? "Nenhum cartão arquivado"
								: "Nenhum cartão cadastrado"
						}
						description={
							isArchived
								? "Os cartões arquivados aparecerão aqui."
								: "Adicione seu primeiro cartão para acompanhar limites e faturas com mais controle."
						}
					/>
				</Card>
			);
		}

		return (
			<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
				{list.map((card) => (
					<CardItem
						key={card.id}
						name={card.name}
						brand={card.brand}
						status={card.status}
						closingDay={card.closingDay}
						dueDay={card.dueDay}
						limit={card.limit}
						limitInUse={card.limitInUse ?? null}
						limitAvailable={card.limitAvailable ?? card.limit ?? null}
						contaName={card.contaName}
						logo={card.logo}
						note={card.note}
						onEdit={() => handleEdit(card)}
						onInvoice={() => handleInvoice(card)}
						onRemove={() => handleRemoveRequest(card)}
					/>
				))}
			</div>
		);
	};

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				<div className="flex justify-start">
					<CardDialog
						mode="create"
						accounts={accounts}
						logoOptions={logoOptions}
						trigger={
							<Button>
								<RiAddCircleLine className="size-4" />
								Novo cartão
							</Button>
						}
					/>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList>
						<TabsTrigger value="ativos">Ativos</TabsTrigger>
						<TabsTrigger value="arquivados">Arquivados</TabsTrigger>
					</TabsList>

					<TabsContent value="ativos" className="mt-4">
						{renderCardList(orderedCards, false)}
					</TabsContent>

					<TabsContent value="arquivados" className="mt-4">
						{renderCardList(orderedArchivedCards, true)}
					</TabsContent>
				</Tabs>
			</div>

			<CardDialog
				mode="update"
				accounts={accounts}
				logoOptions={logoOptions}
				card={selectedCard ?? undefined}
				open={editOpen && !!selectedCard}
				onOpenChange={handleEditOpenChange}
			/>

			<ConfirmActionDialog
				open={removeOpen && !!cardToRemove}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Ao remover este cartão, os registros relacionados a ele serão excluídos permanentemente."
				confirmLabel="Remover cartão"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleRemoveConfirm}
			/>
		</>
	);
}
