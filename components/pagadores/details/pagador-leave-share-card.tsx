"use client";

import { deletePagadorShareAction } from "@/app/(dashboard)/pagadores/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiLogoutBoxLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface PagadorLeaveShareCardProps {
  shareId: string;
  pagadorName: string;
  createdAt: string;
}

export function PagadorLeaveShareCard({
  shareId,
  pagadorName,
  createdAt,
}: PagadorLeaveShareCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLeave = () => {
    startTransition(async () => {
      const result = await deletePagadorShareAction({ shareId });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Você saiu do compartilhamento.");
      router.push("/pagadores");
    });
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Acesso Compartilhado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Você tem acesso somente leitura aos dados de{" "}
          <strong>{pagadorName}</strong>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm">
          <span className="text-xs font-semibold uppercase text-muted-foreground/80">
            Informações do compartilhamento
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Acesso desde:</span>{" "}
              <strong>{formattedDate}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode visualizar os lançamentos, mas não pode criar ou editar.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowConfirm(true)}
            className="w-full"
          >
            <RiLogoutBoxLine className="size-4" />
            Sair do compartilhamento
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">
              Tem certeza que deseja sair? Você perderá o acesso aos dados de{" "}
              {pagadorName}.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLeave}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? "Saindo..." : "Confirmar saída"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
