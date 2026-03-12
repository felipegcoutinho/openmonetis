import { RiTerminalLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

interface AuthErrorAlertProps {
	error: string;
}

export function AuthErrorAlert({ error }: AuthErrorAlertProps) {
	if (!error) return null;

	return (
		<Alert className="mt-2 border border-destructive" variant="destructive">
			<RiTerminalLine className="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	);
}
