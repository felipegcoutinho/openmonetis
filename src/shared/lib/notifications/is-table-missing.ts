/**
 * Detecta se um erro indica que a tabela `dashboard_notification_states`
 * ainda nao existe no banco (migration pendente).
 */
export function isNotificationStatesTableMissing(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message.toLowerCase();

	return (
		message.includes("dashboard_notification_states") &&
		(message.includes("does not exist") || message.includes("relation"))
	);
}
