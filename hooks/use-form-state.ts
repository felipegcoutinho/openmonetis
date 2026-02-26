import { useState } from "react";

/**
 * Hook for managing form state with type-safe field updates
 *
 * @param initialValues - Initial form values
 * @returns Object with formState, updateField, resetForm, setFormState
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
export function useFormState<T extends Record<string, unknown>>(
	initialValues: T,
) {
	const [formState, setFormState] = useState<T>(initialValues);

	/**
	 * Updates a single field in the form state
	 */
	const updateField = <K extends keyof T>(field: K, value: T[K]) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	/**
	 * Resets form to initial values
	 */
	const resetForm = () => {
		setFormState(initialValues);
	};

	/**
	 * Updates multiple fields at once
	 */
	const updateFields = (updates: Partial<T>) => {
		setFormState((prev) => ({ ...prev, ...updates }));
	};

	return {
		formState,
		updateField,
		updateFields,
		resetForm,
		setFormState,
	};
}
