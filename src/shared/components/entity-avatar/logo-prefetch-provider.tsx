"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useRef } from "react";
import { logoQueryKeys } from "@/shared/lib/logo";
import type { LogoPrefetchEntry } from "@/shared/lib/logo/types";

type LogoPrefetchProviderProps = {
	mappings: LogoPrefetchEntry[];
	children: ReactNode;
};

/**
 * Semeia o cache do React Query com mapeamentos de logo já resolvidos
 * no servidor. Evita que cada `EstablishmentLogo` dispare seu próprio
 * GET para `/api/logo/mapping` no primeiro render.
 */
export function LogoPrefetchProvider({
	mappings,
	children,
}: LogoPrefetchProviderProps) {
	const queryClient = useQueryClient();
	const seeded = useRef(false);

	if (!seeded.current) {
		for (const { nameKey, domain, logoUrl } of mappings) {
			queryClient.setQueryData(logoQueryKeys.mapping(nameKey), {
				domain,
				logoUrl,
			});
		}
		seeded.current = true;
	}

	return <>{children}</>;
}
