export const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
] as const;

export const DEFAULT_MAX_FILE_SIZE_MB = 50;
export const ATTACHMENT_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export type AttachmentSizeOption = (typeof ATTACHMENT_SIZE_OPTIONS)[number];
export const MAX_FILE_SIZE = DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024;
