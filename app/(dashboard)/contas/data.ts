import { contas, lancamentos, pagadores } from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { loadLogoOptions } from "@/lib/logo/options";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { and, eq, ilike, not, sql } from "drizzle-orm";

export type AccountData = {
  id: string;
  name: string;
  accountType: string;
  status: string;
  note: string | null;
  logo: string | null;
  initialBalance: number;
  balance: number;
  excludeFromBalance: boolean;
  excludeInitialBalanceFromIncome: boolean;
};

export async function fetchAccountsForUser(
  userId: string
): Promise<{ accounts: AccountData[]; logoOptions: LogoOption[] }> {
  const [accountRows, logoOptions] = await Promise.all([
    db
      .select({
        id: contas.id,
        name: contas.name,
        accountType: contas.accountType,
        status: contas.status,
        note: contas.note,
        logo: contas.logo,
        initialBalance: contas.initialBalance,
        excludeFromBalance: contas.excludeFromBalance,
        excludeInitialBalanceFromIncome: contas.excludeInitialBalanceFromIncome,
        balanceMovements: sql<number>`
          coalesce(
            sum(
              case
                when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
                else ${lancamentos.amount}
              end
            ),
            0
          )
        `,
      })
      .from(contas)
      .leftJoin(
        lancamentos,
        and(
          eq(lancamentos.contaId, contas.id),
          eq(lancamentos.userId, userId),
          eq(lancamentos.isSettled, true)
        )
      )
      .leftJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
      .where(
        and(
          eq(contas.userId, userId),
          not(ilike(contas.status, "inativa")),
          sql`(${lancamentos.id} IS NULL OR ${pagadores.role} = ${PAGADOR_ROLE_ADMIN})`
        )
      )
      .groupBy(
        contas.id,
        contas.name,
        contas.accountType,
        contas.status,
        contas.note,
        contas.logo,
        contas.initialBalance,
        contas.excludeFromBalance,
        contas.excludeInitialBalanceFromIncome
      ),
    loadLogoOptions(),
  ]);

  const accounts = accountRows.map((account) => ({
    id: account.id,
    name: account.name,
    accountType: account.accountType,
    status: account.status,
    note: account.note,
    logo: account.logo,
    initialBalance: Number(account.initialBalance ?? 0),
    balance:
      Number(account.initialBalance ?? 0) +
      Number(account.balanceMovements ?? 0),
    excludeFromBalance: account.excludeFromBalance,
    excludeInitialBalanceFromIncome: account.excludeInitialBalanceFromIncome,
  }));

  return { accounts, logoOptions };
}

export async function fetchInativosForUser(
  userId: string
): Promise<{ accounts: AccountData[]; logoOptions: LogoOption[] }> {
  const [accountRows, logoOptions] = await Promise.all([
    db
      .select({
        id: contas.id,
        name: contas.name,
        accountType: contas.accountType,
        status: contas.status,
        note: contas.note,
        logo: contas.logo,
        initialBalance: contas.initialBalance,
        excludeFromBalance: contas.excludeFromBalance,
        excludeInitialBalanceFromIncome: contas.excludeInitialBalanceFromIncome,
        balanceMovements: sql<number>`
          coalesce(
            sum(
              case
                when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
                else ${lancamentos.amount}
              end
            ),
            0
          )
        `,
      })
      .from(contas)
      .leftJoin(
        lancamentos,
        and(
          eq(lancamentos.contaId, contas.id),
          eq(lancamentos.userId, userId),
          eq(lancamentos.isSettled, true)
        )
      )
      .leftJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
      .where(
        and(
          eq(contas.userId, userId),
          ilike(contas.status, "inativa"),
          sql`(${lancamentos.id} IS NULL OR ${pagadores.role} = ${PAGADOR_ROLE_ADMIN})`
        )
      )
      .groupBy(
        contas.id,
        contas.name,
        contas.accountType,
        contas.status,
        contas.note,
        contas.logo,
        contas.initialBalance,
        contas.excludeFromBalance,
        contas.excludeInitialBalanceFromIncome
      ),
    loadLogoOptions(),
  ]);

  const accounts = accountRows.map((account) => ({
    id: account.id,
    name: account.name,
    accountType: account.accountType,
    status: account.status,
    note: account.note,
    logo: account.logo,
    initialBalance: Number(account.initialBalance ?? 0),
    balance:
      Number(account.initialBalance ?? 0) +
      Number(account.balanceMovements ?? 0),
    excludeFromBalance: account.excludeFromBalance,
    excludeInitialBalanceFromIncome: account.excludeInitialBalanceFromIncome,
  }));

  return { accounts, logoOptions };
}
