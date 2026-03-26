const FALLBACK_HEX_RADIX = 16;

function randomHex(byteCount: number) {
	const cryptoApi = globalThis.crypto;

	if (cryptoApi?.getRandomValues) {
		return Array.from(cryptoApi.getRandomValues(new Uint8Array(byteCount)))
			.map((byte) => byte.toString(FALLBACK_HEX_RADIX).padStart(2, "0"))
			.join("");
	}

	let hex = "";

	for (let index = 0; index < byteCount; index += 1) {
		hex += Math.floor(Math.random() * 256)
			.toString(FALLBACK_HEX_RADIX)
			.padStart(2, "0");
	}

	return hex;
}

export function createClientSafeId() {
	const cryptoApi = globalThis.crypto;

	if (cryptoApi?.randomUUID) {
		return cryptoApi.randomUUID();
	}

	return [
		randomHex(4),
		randomHex(2),
		randomHex(2),
		randomHex(2),
		randomHex(6),
	].join("-");
}
