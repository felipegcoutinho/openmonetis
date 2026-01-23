"use client";

import { discardInboxItemAction } from "@/app/(dashboard)/caixa-de-entrada/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { RiInboxLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { InboxCard } from "./inbox-card";
import { InboxDetailsDialog } from "./inbox-details-dialog";
import { ProcessDialog } from "./process-dialog";
import type { InboxItem, SelectOption } from "./types";

interface InboxPageProps {
  items: InboxItem[];
  categorias: SelectOption[];
  contas: SelectOption[];
  cartoes: SelectOption[];
}

export function InboxPage({
  items,
  categorias,
  contas,
  cartoes,
}: InboxPageProps) {
  const [processOpen, setProcessOpen] = useState(false);
  const [itemToProcess, setItemToProcess] = useState<InboxItem | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [itemDetails, setItemDetails] = useState<InboxItem | null>(null);

  const [discardOpen, setDiscardOpen] = useState(false);
  const [itemToDiscard, setItemToDiscard] = useState<InboxItem | null>(null);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.notificationTimestamp).getTime() -
          new Date(a.notificationTimestamp).getTime()
      ),
    [items]
  );

  const handleProcessOpenChange = useCallback((open: boolean) => {
    setProcessOpen(open);
    if (!open) {
      setItemToProcess(null);
    }
  }, []);

  const handleDetailsOpenChange = useCallback((open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setItemDetails(null);
    }
  }, []);

  const handleDiscardOpenChange = useCallback((open: boolean) => {
    setDiscardOpen(open);
    if (!open) {
      setItemToDiscard(null);
    }
  }, []);

  const handleProcessRequest = useCallback((item: InboxItem) => {
    setItemToProcess(item);
    setProcessOpen(true);
  }, []);

  const handleDetailsRequest = useCallback((item: InboxItem) => {
    setItemDetails(item);
    setDetailsOpen(true);
  }, []);

  const handleDiscardRequest = useCallback((item: InboxItem) => {
    setItemToDiscard(item);
    setDiscardOpen(true);
  }, []);

  const handleDiscardConfirm = useCallback(async () => {
    if (!itemToDiscard) return;

    const result = await discardInboxItemAction({
      inboxItemId: itemToDiscard.id,
    });

    if (result.success) {
      toast.success(result.message);
      return;
    }

    toast.error(result.error);
    throw new Error(result.error);
  }, [itemToDiscard]);

  return (
    <>
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Caixa de Entrada</h1>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Nenhuma notificação pendente"
                : `${items.length} notificação${items.length > 1 ? "ões" : ""} pendente${items.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
            <EmptyState
              media={<RiInboxLine className="size-6 text-primary" />}
              title="Caixa de entrada vazia"
              description="As notificações capturadas pelo app OpenSheets Companion aparecerão aqui para você processar."
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedItems.map((item) => (
              <InboxCard
                key={item.id}
                item={item}
                onProcess={handleProcessRequest}
                onDiscard={handleDiscardRequest}
                onViewDetails={handleDetailsRequest}
              />
            ))}
          </div>
        )}
      </div>

      <ProcessDialog
        open={processOpen}
        onOpenChange={handleProcessOpenChange}
        item={itemToProcess}
        categorias={categorias}
        contas={contas}
        cartoes={cartoes}
      />

      <InboxDetailsDialog
        open={detailsOpen}
        onOpenChange={handleDetailsOpenChange}
        item={itemDetails}
      />

      <ConfirmActionDialog
        open={discardOpen}
        onOpenChange={handleDiscardOpenChange}
        title="Descartar notificação?"
        description="A notificação será marcada como descartada e não aparecerá mais na lista de pendentes."
        confirmLabel="Descartar"
        confirmVariant="destructive"
        pendingLabel="Descartando..."
        onConfirm={handleDiscardConfirm}
      />
    </>
  );
}
