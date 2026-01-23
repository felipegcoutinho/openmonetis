"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { InboxItem } from "./types";

interface InboxDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InboxItem | null;
}

export function InboxDetailsDialog({
  open,
  onOpenChange,
  item,
}: InboxDetailsDialogProps) {
  if (!item) return null;

  const formattedAmount = item.parsedAmount
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(parseFloat(item.parsedAmount))
    : "Não extraído";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Notificação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados da fonte */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Fonte
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App</span>
                <span>{item.sourceAppName || item.sourceApp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package</span>
                <span className="font-mono text-xs">{item.sourceApp}</span>
              </div>
              {item.deviceId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispositivo</span>
                  <span className="font-mono text-xs">{item.deviceId}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Texto original */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Notificação Original
            </h4>
            {item.originalTitle && (
              <p className="mb-1 font-medium">{item.originalTitle}</p>
            )}
            <p className="text-sm">{item.originalText}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Recebida em{" "}
              {format(new Date(item.notificationTimestamp), "PPpp", {
                locale: ptBR,
              })}
            </p>
          </div>

          <Separator />

          {/* Dados parseados */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Dados Extraídos
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estabelecimento</span>
                <span>{item.parsedName || "Não extraído"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor</span>
                <Badge
                  variant={
                    item.parsedTransactionType === "Receita"
                      ? "success"
                      : "destructive"
                  }
                >
                  {formattedAmount}
                </Badge>
              </div>
              {item.parsedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span>
                    {format(new Date(item.parsedDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}
              {item.parsedCardLastDigits && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cartão</span>
                  <span>•••• {item.parsedCardLastDigits}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span>{item.parsedTransactionType || "Não identificado"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadados */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Metadados
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{item.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>
                  {format(new Date(item.createdAt), "PPpp", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
