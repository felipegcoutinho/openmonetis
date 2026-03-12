import { useCallback, useEffect, useState } from "react";

/**
 * Hook for managing controlled/uncontrolled state pattern
 * Allows a component to work both in controlled and uncontrolled mode
 *
 * @param controlledValue - The controlled value (undefined for uncontrolled mode)
 * @param defaultValue - Default value for uncontrolled mode
 * @param onChange - Callback when value changes
 * @returns Tuple of [currentValue, setValue]
 *
 * @example
 * ```tsx
 * function MyComponent({ value, onChange }) {
 *   const [internalValue, setValue] = useControlledState(value, false, onChange);
 *   // Works both as controlled and uncontrolled
 * }
 * ```
 */
export function useControlledState<T>(
	controlledValue: T | undefined,
	defaultValue: T,
	onChange?: (value: T) => void,
): [T, (value: T) => void] {
	const [internalValue, setInternalValue] = useState<T>(defaultValue);

	// Sync internal value when controlled value changes
	useEffect(() => {
		if (controlledValue !== undefined) {
			setInternalValue(controlledValue);
		}
	}, [controlledValue]);

	// Use controlled value if provided, otherwise use internal value
	const value = controlledValue !== undefined ? controlledValue : internalValue;

	const setValue = useCallback(
		(newValue: T) => {
			// Update internal state if uncontrolled
			if (controlledValue === undefined) {
				setInternalValue(newValue);
			}

			// Always call onChange if provided
			onChange?.(newValue);
		},
		[controlledValue, onChange],
	);

	return [value, setValue];
}
