import { useCallback, useRef, useState } from "react";

/**
 * Hook for managing form state with type-safe field updates
 *
 * @param initialValues - Initial form values
 * @returns Object with formState, updateField, updateFields, replaceForm, resetForm
 *
 * @example
 * ```tsx
 * const { formState, updateField, resetForm } = useFormState({
 *   name: '',
 *   email: ''
 * });
 *
 * updateField('name', 'John');
 * ```
 */
export function useFormState<T extends object>(initialValues: T) {
	const latestInitialValuesRef = useRef(initialValues);
	latestInitialValuesRef.current = initialValues;

	const [formState, setFormState] = useState<T>(initialValues);

	/**
	 * Updates a single field in the form state
	 */
	const updateField = useCallback(
		<K extends keyof T>(field: K, value: T[K]) => {
			setFormState((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	/**
	 * Resets form to initial values
	 */
	const resetForm = useCallback((nextValues?: T) => {
		setFormState(nextValues ?? latestInitialValuesRef.current);
	}, []);

	/**
	 * Updates multiple fields at once
	 */
	const updateFields = useCallback((updates: Partial<T>) => {
		setFormState((prev) => ({ ...prev, ...updates }));
	}, []);

	const replaceForm = useCallback((nextValues: T) => {
		setFormState(nextValues);
	}, []);

	return {
		formState,
		updateField,
		updateFields,
		replaceForm,
		resetForm,
	};
}
