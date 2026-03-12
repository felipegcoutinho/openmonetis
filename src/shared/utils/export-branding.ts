const FALLBACK_PRIMARY_COLOR: [number, number, number] = [201, 106, 58];
const RGB_PATTERN = /\d+(?:\.\d+)?/g;

function parseRgbColor(value: string): [number, number, number] | null {
	if (!value.toLowerCase().startsWith("rgb")) {
		return null;
	}

	const channels = value.match(RGB_PATTERN);
	if (!channels || channels.length < 3) {
		return null;
	}

	const red = Number.parseFloat(channels[0]);
	const green = Number.parseFloat(channels[1]);
	const blue = Number.parseFloat(channels[2]);

	if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
		return null;
	}

	return [Math.round(red), Math.round(green), Math.round(blue)];
}

function resolveCssColor(value: string): [number, number, number] | null {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return null;
	}

	const probe = document.createElement("span");
	probe.style.position = "fixed";
	probe.style.opacity = "0";
	probe.style.pointerEvents = "none";
	probe.style.color = "";
	probe.style.color = value;

	if (!probe.style.color) {
		return null;
	}

	document.body.appendChild(probe);
	const resolved = window.getComputedStyle(probe).color;
	document.body.removeChild(probe);

	return parseRgbColor(resolved);
}

export function getPrimaryPdfColor(): [number, number, number] {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return FALLBACK_PRIMARY_COLOR;
	}

	const rootStyles = window.getComputedStyle(document.documentElement);
	const rawPrimary = rootStyles.getPropertyValue("--primary").trim();
	const rawColorPrimary = rootStyles.getPropertyValue("--color-primary").trim();
	const candidates = [rawPrimary, rawColorPrimary].filter(Boolean);

	for (const candidate of candidates) {
		const resolved = resolveCssColor(candidate);
		if (resolved) {
			return resolved;
		}
	}

	return FALLBACK_PRIMARY_COLOR;
}

export async function loadExportLogoDataUrl(
	logoPath = "/images/logo_text.png",
): Promise<string | null> {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return null;
	}

	return new Promise((resolve) => {
		const image = new Image();
		image.crossOrigin = "anonymous";

		image.onload = () => {
			const width = image.naturalWidth || image.width;
			const height = image.naturalHeight || image.height;
			if (!width || !height) {
				resolve(null);
				return;
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext("2d");
			if (!context) {
				resolve(null);
				return;
			}

			context.drawImage(image, 0, 0, width, height);

			try {
				resolve(canvas.toDataURL("image/png"));
			} catch {
				resolve(null);
			}
		};

		image.onerror = () => resolve(null);
		image.src = logoPath;
	});
}
