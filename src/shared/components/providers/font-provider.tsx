"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFontVariable } from "@/public/fonts/font_index";

type FontContextValue = {
	systemFont: string;
	moneyFont: string;
	setSystemFont: (key: string) => void;
	setMoneyFont: (key: string) => void;
};

const FontContext = createContext<FontContextValue | null>(null);

export function FontProvider({
	systemFont: initialSystemFont,
	moneyFont: initialMoneyFont,
	children,
}: {
	systemFont: string;
	moneyFont: string;
	children: React.ReactNode;
}) {
	const [systemFont, setSystemFontState] = useState(initialSystemFont);
	const [moneyFont, setMoneyFontState] = useState(initialMoneyFont);

	useEffect(() => {
		document.documentElement.style.setProperty(
			"--font-app",
			getFontVariable(systemFont),
		);
		document.documentElement.style.setProperty(
			"--font-money",
			getFontVariable(moneyFont),
		);
	}, [systemFont, moneyFont]);

	const value = useMemo(
		() => ({
			systemFont,
			moneyFont,
			setSystemFont: setSystemFontState,
			setMoneyFont: setMoneyFontState,
		}),
		[systemFont, moneyFont],
	);

	return (
		<>
			<style
				dangerouslySetInnerHTML={{
					__html: `:root { --font-app: ${getFontVariable(initialSystemFont)}; --font-money: ${getFontVariable(initialMoneyFont)}; }`,
				}}
			/>
			<FontContext value={value}>{children}</FontContext>
		</>
	);
}

export function useFont() {
	const ctx = useContext(FontContext);
	if (!ctx) {
		throw new Error("useFont must be used within FontProvider");
	}
	return ctx;
}
