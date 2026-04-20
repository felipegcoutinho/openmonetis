import type { PropsWithChildren } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import AuthSidebar from "./auth-sidebar";

export function AuthCardShell({ children }: PropsWithChildren) {
	return (
		<Card className="overflow-hidden border-primary/10 p-0 shadow-lg">
			<CardContent className="grid p-0 md:min-h-[640px] md:grid-cols-[1.05fr_0.95fr]">
				<div className="flex md:rounded-l-4xl">{children}</div>
				<AuthSidebar />
			</CardContent>
		</Card>
	);
}
