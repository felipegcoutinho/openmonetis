import { z } from "zod";

/**
 * Common Zod schemas for reuse across the application
 */

/**
 * UUID schema with custom error message
 */
export const uuidSchema = (entityName: string = "ID") =>
	z
		.string({ message: `${entityName} inválido.` })
		.uuid(`${entityName} inválido.`);

/**
 * Optional/nullable decimal string schema
 */
export const optionalDecimalSchema = z
	.string()
	.trim()
	.optional()
	.transform((value) =>
		value && value.length > 0 ? value.replace(",", ".") : null,
	)
	.refine(
		(value) => value === null || !Number.isNaN(Number.parseFloat(value)),
		"Informe um valor numérico válido.",
	)
	.transform((value) => (value === null ? null : Number.parseFloat(value)));

/**
 * Day of month schema (1-31)
 */
export const dayOfMonthSchema = z
	.string({ message: "Informe o dia." })
	.trim()
	.min(1, "Informe o dia.")
	.refine((value) => {
		const parsed = Number.parseInt(value, 10);
		return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 31;
	}, "Informe um dia entre 1 e 31.");

/**
 * Period schema (YYYY-MM format)
 */
export const periodSchema = z
	.string({ message: "Informe o período." })
	.trim()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Período inválido.");

/**
 * Note/observation schema (max 500 chars, trimmed, nullable)
 */
export const noteSchema = z
	.string()
	.trim()
	.max(500, "A anotação deve ter no máximo 500 caracteres.")
	.optional()
	.transform((value) => (value && value.length > 0 ? value : null));
