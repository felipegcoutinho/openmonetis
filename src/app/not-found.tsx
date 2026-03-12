import { RiFileSearchLine } from "@remixicon/react";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/shared/components/ui/empty";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4">
			<Empty className="max-w-md border-0">
				<EmptyHeader>
					<EmptyMedia variant="icon" className="size-16">
						<RiFileSearchLine className="size-8" />
					</EmptyMedia>
					<EmptyTitle className="text-2xl">Página não encontrada</EmptyTitle>
					<EmptyDescription>
						A página que você está procurando não existe ou foi movida.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild>
						<Link href="/dashboard">Voltar para o Dashboard</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	);
}
