"use client";

import { createContext, useContext } from "react";

/**
 * Expõe, para Client Components, se a integração Logo.dev está configurada.
 *
 * O valor é determinado server-side (lendo `LOGO_DEV_TOKEN` via
 * `isLogoDevEnabled()` em `@/shared/lib/logo/server`) e passado como prop
 * a partir do layout do dashboard — evitando que o cliente precise do token.
 */
const LogoDevContext = createContext<boolean>(false);

interface LogoDevProviderProps {
	enabled: boolean;
	children: React.ReactNode;
}

export function LogoDevProvider({ enabled, children }: LogoDevProviderProps) {
	return (
		<LogoDevContext.Provider value={enabled}>
			{children}
		</LogoDevContext.Provider>
	);
}

export function useLogoDevEnabled(): boolean {
	return useContext(LogoDevContext);
}
