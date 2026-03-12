"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useSyncExternalStore,
} from "react";

interface PrivacyContextType {
	privacyMode: boolean;
	toggle: () => void;
	set: (value: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const STORAGE_KEY = "app:privacyMode";
const PRIVACY_MODE_EVENT = "openmonetis:privacy-mode";

// Read from localStorage safely (returns false on server)
function getStoredValue(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(STORAGE_KEY) === "true";
}

function notifyPrivacyModeChange() {
	window.dispatchEvent(new Event(PRIVACY_MODE_EVENT));
}

// Subscribe to storage changes
function subscribeToStorage(callback: () => void) {
	window.addEventListener("storage", callback);
	window.addEventListener(PRIVACY_MODE_EVENT, callback);
	return () => {
		window.removeEventListener("storage", callback);
		window.removeEventListener(PRIVACY_MODE_EVENT, callback);
	};
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
	// useSyncExternalStore handles hydration safely
	const privacyMode = useSyncExternalStore(
		subscribeToStorage,
		getStoredValue,
		() => false, // Server snapshot
	);

	const setPrivacyMode = useCallback((value: boolean) => {
		if (typeof window === "undefined") {
			return;
		}

		const nextValue = String(value);
		if (localStorage.getItem(STORAGE_KEY) === nextValue) {
			return;
		}

		localStorage.setItem(STORAGE_KEY, nextValue);
		notifyPrivacyModeChange();
	}, []);

	const toggle = useCallback(() => {
		setPrivacyMode(!privacyMode);
	}, [privacyMode, setPrivacyMode]);

	const contextValue = useMemo(
		() => ({
			privacyMode,
			toggle,
			set: setPrivacyMode,
		}),
		[privacyMode, toggle, setPrivacyMode],
	);

	return (
		<PrivacyContext.Provider value={contextValue}>
			{children}
		</PrivacyContext.Provider>
	);
}

export function usePrivacyMode() {
	const context = useContext(PrivacyContext);
	if (context === undefined) {
		throw new Error("usePrivacyMode must be used within a PrivacyProvider");
	}
	return context;
}
