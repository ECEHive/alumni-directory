/**
 * Client-side AES-GCM decryption for alumni data.
 *
 * The encrypted blob is produced at build time by the alumni-encrypt integration.
 * The passphrase is provided via the URL fragment (#your-key) and never sent to
 * any server — URL fragments are strictly client-side.
 *
 * Wire format: base64url( IV[12 bytes] || AES-GCM ciphertext )
 */

const PBKDF2_SALT = new TextEncoder().encode("hive-alumni-v1");

async function deriveKey(passphrase: string): Promise<CryptoKey> {
	const { subtle } = globalThis.crypto;
	const keyMaterial = await subtle.importKey(
		"raw",
		new TextEncoder().encode(passphrase),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: PBKDF2_SALT,
			iterations: 100_000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["decrypt"],
	);
}

export async function decryptAlumniData(
	encoded: string,
	passphrase: string,
): Promise<string> {
	const key = await deriveKey(passphrase);

	// Decode base64url → bytes
	const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
	const binary = atob(padded);
	const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

	const iv = bytes.slice(0, 12);
	const ciphertext = bytes.slice(12);

	const decrypted = await globalThis.crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		ciphertext,
	);
	return new TextDecoder().decode(decrypted);
}
