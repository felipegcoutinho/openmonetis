"use client";

import { processInboxItemAction } from "@/app/(dashboard)/caixa-de-entrada/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { InboxItem, SelectOption } from "./types";

interface ProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InboxItem | null;
  categorias: SelectOption[];
  contas: SelectOption[];
  cartoes: SelectOption[];
}

export function ProcessDialog({
  open,
  onOpenChange,
  item,
  categorias,
  contas,
  cartoes,
}: ProcessDialogProps) {
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [transactionType, setTransactionType] = useState<"Despesa" | "Receita">(
    "Despesa"
  );
  const [condition, setCondition] = useState("realizado");
  const [paymentMethod, setPaymentMethod] = useState("cartao-credito");
  const [categoriaId, setCategoriaId] = useState("");
  const [contaId, setContaId] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [note, setNote] = useState("");

  // Pré-preencher com dados parseados
  useEffect(() => {
    if (item) {
      setName(item.parsedName || "");
      setAmount(item.parsedAmount || "");
      setPurchaseDate(
        item.parsedDate
          ? new Date(item.parsedDate).toISOString().split("T")[0]
          : new Date(item.notificationTimestamp).toISOString().split("T")[0]
      );
      setTransactionType(
        (item.parsedTransactionType as "Despesa" | "Receita") || "Despesa"
      );
      setCondition("realizado");
      setPaymentMethod(item.parsedCardLastDigits ? "cartao-credito" : "outros");
      setCategoriaId("");
      setContaId("");
      setCartaoId("");
      setNote("");
    }
  }, [item]);

  // Por enquanto, mostrar todas as categorias
  // Em produção, seria melhor filtrar pelo tipo (Despesa/Receita)
  const filteredCategorias = categorias;

  const handleSubmit = useCallback(async () => {
    if (!item) return;

    if (!categoriaId) {
      toast.error("Selecione uma categoria.");
      return;
    }

    if (paymentMethod === "cartao-credito" && !cartaoId) {
      toast.error("Selecione um cartão.");
      return;
    }

    if (paymentMethod !== "cartao-credito" && !contaId) {
      toast.error("Selecione uma conta.");
      return;
    }

    setLoading(true);

    try {
      const result = await processInboxItemAction({
        inboxItemId: item.id,
        name,
        amount: parseFloat(amount),
        purchaseDate,
        transactionType,
        condition,
        paymentMethod,
        categoriaId,
        contaId: paymentMethod !== "cartao-credito" ? contaId : undefined,
        cartaoId: paymentMethod === "cartao-credito" ? cartaoId : undefined,
        note: note || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, [
    item,
    name,
    amount,
    purchaseDate,
    transactionType,
    condition,
    paymentMethod,
    categoriaId,
    contaId,
    cartaoId,
    note,
    onOpenChange,
  ]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Processar Notificação</DialogTitle>
          <DialogDescription>
            Revise os dados extraídos e complete as informações para criar o
            lançamento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Texto original */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Notificação original:</p>
            <p className="mt-1 text-sm">{item.originalText}</p>
          </div>

          {/* Nome/Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="name">Descrição</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supermercado, Uber, etc."
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Data</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Tipo de transação */}
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={transactionType}
              onValueChange={(v) => setTransactionType(v as "Despesa" | "Receita")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Despesa">Despesa</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Forma de pagamento */}
          <div className="grid gap-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cartão ou Conta */}
          {paymentMethod === "cartao-credito" ? (
            <div className="grid gap-2">
              <Label>Cartão</Label>
              <Select value={cartaoId} onValueChange={setCartaoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cartoes.map((cartao) => (
                    <SelectItem key={cartao.id} value={cartao.id}>
                      {cartao.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Conta</Label>
              <Select value={contaId} onValueChange={setContaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Categoria */}
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condição */}
          <div className="grid gap-2">
            <Label>Condição</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label htmlFor="note">Observações (opcional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processando..." : "Criar Lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
