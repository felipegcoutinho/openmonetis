"use client";

import { RiAddCircleLine, RiBankLine } from "@remixicon/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/app/(dashboard)/contas/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { AccountCard } from "@/components/contas/account-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentPeriod } from "@/lib/utils/period";
import { Card } from "../ui/card";
import { AccountDialog } from "./account-dialog";
import { TransferDialog } from "./transfer-dialog";
import type { Account } from "./types";

interface AccountsPageProps {
	accounts: Account[];
	archivedAccounts: Account[];
	logoOptions: string[];
}

const resolveLogoSrc = (logo: string | null) => {
	if (!logo) {
		return undefined;
	}

	const fileName = logo.split("/").filter(Boolean).pop() ?? logo;
	return `/logos/${fileName}`;
};

export function AccountsPage({
	accounts,
	archivedAccounts,
	logoOptions,
}: AccountsPageProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("ativos");
	const [editOpen, setEditOpen] = useState(false);
	const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
	const [removeOpen, setRemoveOpen] = useState(false);
	const [accountToRemove, setAccountToRemove] = useState<Account | null>(null);
	const [transferOpen, setTransferOpen] = useState(false);
	const [transferFromAccount, setTransferFromAccount] =
		useState<Account | null>(null);

	const sortAccounts = (list: Account[]) =>
		[...list].sort((a, b) =>
			a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
		);

	const orderedAccounts = sortAccounts(accounts);
	const orderedArchivedAccounts = sortAccounts(archivedAccounts);

	const handleEdit = (account: Account) => {
		setSelectedAccount(account);
		setEditOpen(true);
	};

	const handleEditOpenChange = (open: boolean) => {
		setEditOpen(open);
		if (!open) {
			setSelectedAccount(null);
		}
	};

	const handleRemoveRequest = (account: Account) => {
		setAccountToRemove(account);
		setRemoveOpen(true);
	};

	const handleRemoveOpenChange = (open: boolean) => {
		setRemoveOpen(open);
		if (!open) {
			setAccountToRemove(null);
		}
	};

	const handleRemoveConfirm = async () => {
		if (!accountToRemove) {
			return;
		}

		const result = await deleteAccountAction({ id: accountToRemove.id });

		if (result.success) {
			toast.success(result.message);
			return;
		}

		toast.error(result.error);
		throw new Error(result.error);
	};

	const handleTransferRequest = (account: Account) => {
		setTransferFromAccount(account);
		setTransferOpen(true);
	};

	const handleTransferOpenChange = (open: boolean) => {
		setTransferOpen(open);
		if (!open) {
			setTransferFromAccount(null);
		}
	};

	const removeTitle = accountToRemove
		? `Remover conta "${accountToRemove.name}"?`
		: "Remover conta?";

	const renderAccountList = (list: Account[], isArchived: boolean) => {
		if (list.length === 0) {
			return (
				<Card className="flex min-h-[50vh] w-full items-center justify-center py-12">
					<EmptyState
						media={<RiBankLine className="size-6 text-primary" />}
						title={
							isArchived
								? "Nenhuma conta arquivada"
								: "Nenhuma conta cadastrada"
						}
						description={
							isArchived
								? "As contas arquivadas aparecerão aqui."
								: "Cadastre sua primeira conta para começar a organizar os lançamentos."
						}
					/>
				</Card>
			);
		}

		return (
			<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
				{list.map((account) => {
					const logoSrc = resolveLogoSrc(account.logo);

					return (
						<AccountCard
							key={account.id}
							accountName={account.name}
							accountType={`${account.accountType}`}
							balance={account.balance ?? account.initialBalance ?? 0}
							status={account.status}
							excludeFromBalance={account.excludeFromBalance}
							excludeInitialBalanceFromIncome={
								account.excludeInitialBalanceFromIncome
							}
							icon={
								logoSrc ? (
									<Image
										src={logoSrc}
										alt={`Logo da conta ${account.name}`}
										width={42}
										height={42}
										className="rounded-full"
									/>
								) : undefined
							}
							onEdit={() => handleEdit(account)}
							onRemove={() => handleRemoveRequest(account)}
							onTransfer={() => handleTransferRequest(account)}
							onViewStatement={() =>
								router.push(`/contas/${account.id}/extrato`)
							}
						/>
					);
				})}
			</div>
		);
	};

	return (
		<>
			<div className="flex w-full flex-col gap-6">
				<div className="flex justify-start">
					<AccountDialog
						mode="create"
						logoOptions={logoOptions}
						trigger={
							<Button>
								<RiAddCircleLine className="size-4" />
								Nova conta
							</Button>
						}
					/>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList>
						<TabsTrigger value="ativos">Ativas</TabsTrigger>
						<TabsTrigger value="arquivados">Arquivadas</TabsTrigger>
					</TabsList>

					<TabsContent value="ativos" className="mt-4">
						{renderAccountList(orderedAccounts, false)}
					</TabsContent>

					<TabsContent value="arquivados" className="mt-4">
						{renderAccountList(orderedArchivedAccounts, true)}
					</TabsContent>
				</Tabs>
			</div>

			<AccountDialog
				mode="update"
				logoOptions={logoOptions}
				account={selectedAccount ?? undefined}
				open={editOpen && !!selectedAccount}
				onOpenChange={handleEditOpenChange}
			/>

			<ConfirmActionDialog
				open={removeOpen && !!accountToRemove}
				onOpenChange={handleRemoveOpenChange}
				title={removeTitle}
				description="Ao remover esta conta, todos os dados relacionados a ela serão perdidos."
				confirmLabel="Remover conta"
				pendingLabel="Removendo..."
				confirmVariant="destructive"
				onConfirm={handleRemoveConfirm}
			/>

			{transferFromAccount && (
				<TransferDialog
					accounts={accounts.map((a) => ({
						...a,
						balance: a.balance ?? a.initialBalance ?? 0,
						excludeFromBalance: a.excludeFromBalance ?? false,
					}))}
					fromAccountId={transferFromAccount.id}
					currentPeriod={getCurrentPeriod()}
					open={transferOpen}
					onOpenChange={handleTransferOpenChange}
				/>
			)}
		</>
	);
}
