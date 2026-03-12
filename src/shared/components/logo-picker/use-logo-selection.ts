import { useCallback } from "react";
import { deriveNameFromLogo } from "@/shared/lib/logo";

interface UseLogoSelectionProps {
	mode: "create" | "update";
	currentLogo: string;
	currentName: string;
	onUpdate: (updates: { logo: string; name?: string }) => void;
}

/**
 * Hook for handling logo selection with automatic name derivation
 *
 * When a logo is selected, automatically updates the name field if:
 * - Mode is "create", OR
 * - Current name is empty, OR
 * - Current name matches the previously derived name from logo
 *
 * @param props Configuration for logo selection behavior
 * @returns Handler function for logo selection
 *
 * @example
 * ```tsx
 * const handleLogoSelection = useLogoSelection({
 *   mode: 'create',
 *   currentLogo: formState.logo,
 *   currentName: formState.name,
 *   onUpdate: (updates) => updateFields(updates)
 * });
 * ```
 */
export function useLogoSelection({
	mode,
	currentLogo,
	currentName,
	onUpdate,
}: UseLogoSelectionProps) {
	const handleLogoSelection = useCallback(
		(newLogo: string) => {
			const derived = deriveNameFromLogo(newLogo);
			const previousDerived = deriveNameFromLogo(currentLogo);

			const shouldUpdateName =
				mode === "create" ||
				currentName.trim().length === 0 ||
				previousDerived === currentName.trim();

			if (shouldUpdateName) {
				onUpdate({ logo: newLogo, name: derived });
			} else {
				onUpdate({ logo: newLogo });
			}
		},
		[mode, currentLogo, currentName, onUpdate],
	);

	return handleLogoSelection;
}
