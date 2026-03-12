import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile() {
	const subscribe = React.useCallback((onStoreChange: () => void) => {
		if (typeof window === "undefined") {
			return () => {};
		}

		const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
		mediaQueryList.addEventListener("change", onStoreChange);
		return () => mediaQueryList.removeEventListener("change", onStoreChange);
	}, []);

	const getSnapshot = React.useCallback(() => {
		if (typeof window === "undefined") {
			return false;
		}

		return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
	}, []);

	return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const useMobile = useIsMobile;
