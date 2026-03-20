"use server";

import {
	createMassTransactionsAction as createMassTransactionsActionImpl,
	deleteMultipleTransactionsAction as deleteMultipleTransactionsActionImpl,
	deleteTransactionBulkAction as deleteTransactionBulkActionImpl,
	updateTransactionBulkAction as updateTransactionBulkActionImpl,
} from "./actions/bulk-actions";
import { exportTransactionsDataAction as exportTransactionsDataActionImpl } from "./actions/export-actions";
import {
	createTransactionAction as createTransactionActionImpl,
	deleteTransactionAction as deleteTransactionActionImpl,
	toggleTransactionSettlementAction as toggleTransactionSettlementActionImpl,
	updateTransactionAction as updateTransactionActionImpl,
} from "./actions/single-actions";

export async function createTransactionAction(
	...args: Parameters<typeof createTransactionActionImpl>
): ReturnType<typeof createTransactionActionImpl> {
	return createTransactionActionImpl(...args);
}

export async function updateTransactionAction(
	...args: Parameters<typeof updateTransactionActionImpl>
): ReturnType<typeof updateTransactionActionImpl> {
	return updateTransactionActionImpl(...args);
}

export async function deleteTransactionAction(
	...args: Parameters<typeof deleteTransactionActionImpl>
): ReturnType<typeof deleteTransactionActionImpl> {
	return deleteTransactionActionImpl(...args);
}

export async function toggleTransactionSettlementAction(
	...args: Parameters<typeof toggleTransactionSettlementActionImpl>
): ReturnType<typeof toggleTransactionSettlementActionImpl> {
	return toggleTransactionSettlementActionImpl(...args);
}

export async function deleteTransactionBulkAction(
	...args: Parameters<typeof deleteTransactionBulkActionImpl>
): ReturnType<typeof deleteTransactionBulkActionImpl> {
	return deleteTransactionBulkActionImpl(...args);
}

export async function updateTransactionBulkAction(
	...args: Parameters<typeof updateTransactionBulkActionImpl>
): ReturnType<typeof updateTransactionBulkActionImpl> {
	return updateTransactionBulkActionImpl(...args);
}

export async function createMassTransactionsAction(
	...args: Parameters<typeof createMassTransactionsActionImpl>
): ReturnType<typeof createMassTransactionsActionImpl> {
	return createMassTransactionsActionImpl(...args);
}

export async function deleteMultipleTransactionsAction(
	...args: Parameters<typeof deleteMultipleTransactionsActionImpl>
): ReturnType<typeof deleteMultipleTransactionsActionImpl> {
	return deleteMultipleTransactionsActionImpl(...args);
}

export async function exportTransactionsDataAction(
	...args: Parameters<typeof exportTransactionsDataActionImpl>
): ReturnType<typeof exportTransactionsDataActionImpl> {
	return exportTransactionsDataActionImpl(...args);
}
