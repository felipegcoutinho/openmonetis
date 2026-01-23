"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiMoreLine,
  RiSmartphoneLine,
} from "@remixicon/react";
import type { InboxItem } from "./types";

interface InboxCardProps {
  item: InboxItem;
  onProcess: (item: InboxItem) => void;
  onDiscard: (item: InboxItem) => void;
  onViewDetails: (item: InboxItem) => void;
}

export function InboxCard({
  item,
  onProcess,
  onDiscard,
  onViewDetails,
}: InboxCardProps) {
  const formattedAmount = item.parsedAmount
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(parseFloat(item.parsedAmount))
    : null;

  const timeAgo = formatDistanceToNow(new Date(item.notificationTimestamp), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <RiSmartphoneLine className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {item.sourceAppName || item.sourceApp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {formattedAmount && (
            <Badge
              variant={
                item.parsedTransactionType === "Receita"
                  ? "success"
                  : "destructive"
              }
            >
              {formattedAmount}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <RiMoreLine className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(item)}>
                <RiEyeLine className="mr-2 size-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onProcess(item)}>
                <RiCheckLine className="mr-2 size-4" />
                Processar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDiscard(item)}
                className="text-destructive"
              >
                <RiDeleteBinLine className="mr-2 size-4" />
                Descartar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex-1">
          {item.parsedName && (
            <p className="font-medium">{item.parsedName}</p>
          )}
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.originalText}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {item.parsedCardLastDigits && (
            <span className="text-xs text-muted-foreground">
              •••• {item.parsedCardLastDigits}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onProcess(item)}
          >
            <RiCheckLine className="mr-1 size-4" />
            Processar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDiscard(item)}
          >
            <RiDeleteBinLine className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
