"use client";

import { RiErrorWarningFill } from "@remixicon/react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

export default function ErrorComponent({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4">
			<Empty className="max-w-md border-0">
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10 size-16">
						<RiErrorWarningFill className="size-8 text-destructive" />
					</EmptyMedia>
					<EmptyTitle className="text-2xl">Algo deu errado</EmptyTitle>
					<EmptyDescription>
						Ocorreu um problema inesperado. Por favor, tente novamente ou volte
						para o dashboard.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button onClick={() => reset()}>Tentar Novamente</Button>
						<Button variant="outline" asChild>
							<Link href="/dashboard">Voltar para o Dashboard</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
}
