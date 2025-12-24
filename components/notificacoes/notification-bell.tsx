"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DashboardNotification } from "@/lib/dashboard/notifications";
import { cn } from "@/lib/utils/ui";
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiNotification3Fill,
  RiTimeLine,
} from "@remixicon/react";
import { useState } from "react";

type NotificationBellProps = {
  notifications: DashboardNotification[];
  totalCount: number;
};

function formatDate(dateString: string): string {
  // Parse manual para evitar problemas de timezone
  // Formato esperado: "YYYY-MM-DD"
  const [year, month, day] = dateString.split("-").map(Number);

  // Criar data em UTC usando os valores diretos
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC", // Força uso de UTC para evitar conversão de timezone
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function NotificationBell({
  notifications,
  totalCount,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const displayCount = totalCount > 99 ? "99+" : totalCount.toString();
  const hasNotifications = totalCount > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notificações"
              aria-expanded={open}
              data-has-notifications={hasNotifications}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "group relative text-muted-foreground transition-all duration-200",
                "hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
                "data-[state=open]:bg-accent/60 data-[state=open]:text-foreground border"
              )}
            >
              <RiNotification3Fill
                className={cn(
                  "size-4 transition-transform duration-200",
                  open ? "scale-90" : "scale-100"
                )}
              />
              {hasNotifications && (
                <>
                  <span
                    aria-hidden
                    className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow-xs ring-2 ring-background"
                  >
                    {displayCount}
                  </span>
                  <span className="absolute -right-1.5 -top-1.5 size-5 animate-ping rounded-full bg-destructive/40" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Pagamentos para os próximos 5 dias.
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-80 max-h-[500px] overflow-hidden rounded-lg border border-border/60 bg-popover/95 p-0 shadow-lg backdrop-blur-lg supports-backdrop-filter:backdrop-blur-md"
      >
        <DropdownMenuLabel className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/60 bg-linear-to-b from-background/95 to-background/80 px-4 py-3 text-sm font-semibold">
          <span>Notificações | Próximos 5 dias.</span>
          {hasNotifications && (
            <Badge variant="outline" className="text-[10px] font-semibold">
              {totalCount} {totalCount === 1 ? "item" : "itens"}
            </Badge>
          )}
        </DropdownMenuLabel>
        {notifications.length === 0 ? (
          <div className="px-4 py-8">
            <Empty>
              <EmptyMedia>
                <RiCheckboxCircleFill color="green" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma notificação</EmptyTitle>
              <EmptyDescription>
                Você está em dia com seus pagamentos!
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto py-2">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-none border-b border-dashed last:border-0 p-2.5",
                  "cursor-default focus:bg-transparent data-highlighted:bg-accent/60"
                )}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div
                      className={cn(
                        "flex items-center justify-center text-sm transition-all duration-200"
                      )}
                    >
                      {notification.status === "overdue" ? (
                        <RiAlertFill color="red" className="size-4" />
                      ) : (
                        <RiTimeLine className="size-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {notification.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0  tracking-wide text-muted-foreground"
                        >
                          {notification.type === "invoice"
                            ? "Cartão"
                            : "Boleto"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-col items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-no">
                          {notification.status === "overdue"
                            ? "Venceu em "
                            : "Vence em "}
                          {formatDate(notification.dueDate)}
                        </span>

                        {notification.showAmount && notification.amount > 0 && (
                          <span className="font-medium">
                            {formatCurrency(notification.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      notification.status === "overdue" ? "destructive" : "info"
                    }
                    className={cn("shrink-0 px-2 py-0.5 tracking-wide")}
                  >
                    {notification.status === "overdue"
                      ? "Atrasado"
                      : "Em breve"}
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
