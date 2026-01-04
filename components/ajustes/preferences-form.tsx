"use client";

import { updatePreferencesAction } from "@/app/(dashboard)/ajustes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface PreferencesFormProps {
  disableMagnetlines: boolean;
}

export function PreferencesForm({
  disableMagnetlines,
}: PreferencesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [magnetlinesDisabled, setMagnetlinesDisabled] =
    useState(disableMagnetlines);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updatePreferencesAction({
        disableMagnetlines: magnetlinesDisabled,
      });

      if (result.success) {
        toast.success(result.message);
        // Recarregar a página para aplicar as mudanças nos componentes
        router.refresh();
        // Forçar reload completo para garantir que os hooks re-executem
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col space-y-6"
    >
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
          <div className="space-y-0.5">
            <Label htmlFor="magnetlines" className="text-base">
              Desabilitar Magnetlines
            </Label>
            <p className="text-sm text-muted-foreground">
              Remove o recurso de linhas magnéticas do sistema. Essa mudança
              afeta a interface e interações visuais.
            </p>
          </div>
          <Switch
            id="magnetlines"
            checked={magnetlinesDisabled}
            onCheckedChange={setMagnetlinesDisabled}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? "Salvando..." : "Salvar preferências"}
        </Button>
      </div>
    </form>
  );
}
