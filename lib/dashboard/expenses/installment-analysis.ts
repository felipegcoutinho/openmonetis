import { cartoes, lancamentos, pagadores } from "@/db/schema";
import {
  ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
  INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/dashboard/common";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";

// Calcula a data de vencimento baseada no período e dia de vencimento do cartão
function calculateDueDate(period: string, dueDay: string | null): Date | null {
  if (!dueDay) return null;

  try {
    const [year, month] = period.split("-");
    if (!year || !month) return null;

    const day = parseInt(dueDay, 10);
    if (isNaN(day)) return null;

    // Criar data ao meio-dia para evitar problemas de timezone
    return new Date(parseInt(year), parseInt(month) - 1, day, 12, 0, 0);
  } catch {
    return null;
  }
}

export type InstallmentDetail = {
  id: string;
  currentInstallment: number;
  amount: number;
  dueDate: Date | null;
  period: string;
  isAnticipated: boolean;
  purchaseDate: Date;
  isSettled: boolean;
};

export type InstallmentGroup = {
  seriesId: string;
  name: string;
  paymentMethod: string;
  cartaoId: string | null;
  cartaoName: string | null;
  cartaoDueDay: string | null;
  cartaoLogo: string | null;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: InstallmentDetail[];
  totalPendingAmount: number;
  firstPurchaseDate: Date;
};

export type InstallmentAnalysisData = {
  installmentGroups: InstallmentGroup[];
  totalPendingInstallments: number;
};

export async function fetchInstallmentAnalysis(
  userId: string
): Promise<InstallmentAnalysisData> {
  // 1. Buscar todos os lançamentos parcelados não antecipados do pagador admin
  const installmentRows = await db
    .select({
      id: lancamentos.id,
      seriesId: lancamentos.seriesId,
      name: lancamentos.name,
      amount: lancamentos.amount,
      paymentMethod: lancamentos.paymentMethod,
      currentInstallment: lancamentos.currentInstallment,
      installmentCount: lancamentos.installmentCount,
      dueDate: lancamentos.dueDate,
      period: lancamentos.period,
      isAnticipated: lancamentos.isAnticipated,
      isSettled: lancamentos.isSettled,
      purchaseDate: lancamentos.purchaseDate,
      cartaoId: lancamentos.cartaoId,
      cartaoName: cartoes.name,
      cartaoDueDay: cartoes.dueDay,
      cartaoLogo: cartoes.logo,
    })
    .from(lancamentos)
    .leftJoin(cartoes, eq(lancamentos.cartaoId, cartoes.id))
    .leftJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
    .where(
      and(
        eq(lancamentos.userId, userId),
        eq(lancamentos.transactionType, "Despesa"),
        eq(lancamentos.condition, "Parcelado"),
        eq(lancamentos.isAnticipated, false),
        isNotNull(lancamentos.seriesId),
        eq(pagadores.role, PAGADOR_ROLE_ADMIN),
        or(
          isNull(lancamentos.note),
          and(
            sql`${lancamentos.note} != ${INITIAL_BALANCE_NOTE}`,
            sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`
          )
        )
      )
    )
    .orderBy(lancamentos.purchaseDate, lancamentos.currentInstallment);

  // Agrupar por seriesId
  const seriesMap = new Map<string, InstallmentGroup>();

  for (const row of installmentRows) {
    if (!row.seriesId) continue;

    const amount = Math.abs(toNumber(row.amount));

    // Calcular vencimento correto baseado no período e dia de vencimento do cartão
    const calculatedDueDate = row.cartaoDueDay
      ? calculateDueDate(row.period, row.cartaoDueDay)
      : row.dueDate;

    const installmentDetail: InstallmentDetail = {
      id: row.id,
      currentInstallment: row.currentInstallment ?? 1,
      amount,
      dueDate: calculatedDueDate,
      period: row.period,
      isAnticipated: row.isAnticipated ?? false,
      purchaseDate: row.purchaseDate,
      isSettled: row.isSettled ?? false,
    };

    if (seriesMap.has(row.seriesId)) {
      const group = seriesMap.get(row.seriesId)!;
      group.pendingInstallments.push(installmentDetail);
      group.totalPendingAmount += amount;
    } else {
      seriesMap.set(row.seriesId, {
        seriesId: row.seriesId,
        name: row.name,
        paymentMethod: row.paymentMethod,
        cartaoId: row.cartaoId,
        cartaoName: row.cartaoName,
        cartaoDueDay: row.cartaoDueDay,
        cartaoLogo: row.cartaoLogo,
        totalInstallments: row.installmentCount ?? 0,
        paidInstallments: 0,
        pendingInstallments: [installmentDetail],
        totalPendingAmount: amount,
        firstPurchaseDate: row.purchaseDate,
      });
    }
  }

  // Calcular quantas parcelas já foram pagas para cada grupo
  const installmentGroups = Array.from(seriesMap.values())
    .map((group) => {
      // Contar quantas parcelas estão marcadas como pagas (settled)
      const paidCount = group.pendingInstallments.filter(
        (i) => i.isSettled
      ).length;
      group.paidInstallments = paidCount;
      return group;
    })
    // Filtrar apenas séries que têm pelo menos uma parcela em aberto (não paga)
    .filter((group) => {
      const hasUnpaidInstallments = group.pendingInstallments.some(
        (i) => !i.isSettled
      );
      return hasUnpaidInstallments;
    });

  // Calcular totais
  const totalPendingInstallments = installmentGroups.reduce(
    (sum, group) => sum + group.totalPendingAmount,
    0
  );

  return {
    installmentGroups,
    totalPendingInstallments,
  };
}
