"use client";

import { deleteCardAction } from "@/app/(dashboard)/cartoes/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card as CardComponent } from "@/components/ui/card";
import { RiAddCircleLine, RiBankCardLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { CardDialog } from "./card-dialog";
import type { Card } from "./types";
import { CardItem } from "./card-item";

type AccountOption = {
  id: string;
  name: string;
  logo: string | null;
};

interface CardsPageProps {
  cards: Card[];
  accounts: AccountOption[];
  logoOptions: string[];
}

export function CardsPage({ cards, accounts, logoOptions }: CardsPageProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [cardToRemove, setCardToRemove] = useState<Card | null>(null);

  const hasCards = cards.length > 0;

  const orderedCards = useMemo(
    () =>
      [...cards].sort((a, b) => {
        // Coloca inativos no final
        const aIsInactive = a.status?.toLowerCase() === "inativo";
        const bIsInactive = b.status?.toLowerCase() === "inativo";

        if (aIsInactive && !bIsInactive) return 1;
        if (!aIsInactive && bIsInactive) return -1;

        // Mesma ordem alfabética dentro de cada grupo
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      }),
    [cards]
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
    [router]
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

        {hasCards ? (
          <div className="flex flex-wrap gap-4">
            {orderedCards.map((card) => (
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
        ) : (
          <CardComponent className="flex w-full items-center justify-center py-12">
            <EmptyState
              media={<RiBankCardLine className="size-6 text-primary" />}
              title="Nenhum cartão cadastrado"
              description="Adicione seu primeiro cartão para acompanhar limites e faturas com mais controle."
            />
          </CardComponent>
        )}
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
