/**
 * Astro integration: alumni-encrypt
 *
 * Pulls alumni data from Airtable at build time, transforms it (consent
 * gating, geocoding — see src/build/), encrypts it, and serves it as
 * /data/alumni.enc.
 *
 * At dev time  → serves /data/alumni.enc from memory via Vite middleware
 *                (Airtable is fetched once per dev-server run).
 * At build time → writes dist/data/alumni.enc; the build FAILS if Airtable
 *                is unreachable so a broken deploy never replaces a good one.
 *
 * Secrets:     AIRTABLE_TOKEN and ALUMNI_SECRET_KEY in the environment / .env
 * Wire format: base64url( IV[12 bytes] || AES-GCM ciphertext )
 */

import { mkdirSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import { loadAlumni } from "../build/alumni-source";
import { encodeAlumni } from "../lib/alumni-codec";

// --- Crypto helpers -----------------------------------------------------------

const PBKDF2_SALT = new TextEncoder().encode("hive-alumni-v1");

async function deriveKey(
	passphrase: string,
	usage: KeyUsage,
): Promise<CryptoKey> {
	const { subtle } = globalThis.crypto;
	const raw = await subtle.importKey(
		"raw",
		new TextEncoder().encode(passphrase),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return subtle.deriveKey(
		{ name: "PBKDF2", salt: PBKDF2_SALT, iterations: 100_000, hash: "SHA-256" },
		raw,
		{ name: "AES-GCM", length: 256 },
		false,
		[usage],
	);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function encrypt(plaintext: string, passphrase: string): Promise<string> {
	const { subtle } = globalThis.crypto;
	const key = await deriveKey(passphrase, "encrypt");
	const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		new TextEncoder().encode(plaintext),
	);
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(ciphertext), iv.length);
	return base64UrlEncode(combined.buffer);
}

// --- Integration --------------------------------------------------------------

export default function alumniEncrypt(): AstroIntegration {
	let root = "";
	let secretKey: string | undefined;
	let airtableToken: string | undefined;

	/** Fetch + transform + encode, memoized for the dev server's lifetime. */
	let blobPromise: Promise<string> | undefined;
	function loadBlob(logger: AstroIntegrationLogger): Promise<string> {
		if (!airtableToken) {
			return Promise.reject(
				new Error("[alumni-encrypt] AIRTABLE_TOKEN is not set."),
			);
		}
		blobPromise ??= loadAlumni({
			airtableToken,
			geocodeCachePath: join(root, "data", "geocode-cache.json"),
			logger: {
				info: (m) => logger.info(m),
				warn: (m) => logger.warn(m),
			},
		}).then(encodeAlumni);
		return blobPromise;
	}

	return {
		name: "alumni-encrypt",
		hooks: {
			"astro:config:setup": ({ config, command, updateConfig, logger }) => {
				root = fileURLToPath(config.root);
				const env = loadEnv(
					command === "dev" ? "development" : "production",
					root,
					"",
				);
				secretKey = env.ALUMNI_SECRET_KEY || undefined;
				airtableToken = env.AIRTABLE_TOKEN || undefined;

				if (!secretKey) {
					logger.warn(
						"[alumni-encrypt] ALUMNI_SECRET_KEY is not set — alumni data will not load.",
					);
				}
				if (!airtableToken) {
					logger.warn(
						"[alumni-encrypt] AIRTABLE_TOKEN is not set — cannot fetch alumni data.",
					);
				}

				const vitePlugin: Plugin = {
					name: "vite-alumni-encrypt",

					configureServer(server: ViteDevServer) {
						server.middlewares.use(
							"/data/alumni.enc",
							async (
								_req: IncomingMessage,
								res: ServerResponse,
								next: (err?: unknown) => void,
							) => {
								if (!secretKey || !airtableToken) return next();
								try {
									const encrypted = await encrypt(
										await loadBlob(logger),
										secretKey,
									);
									res.setHeader("Content-Type", "text/plain; charset=utf-8");
									res.setHeader("Cache-Control", "no-store");
									res.end(encrypted);
								} catch (err) {
									next(err);
								}
							},
						);
					},
				};

				updateConfig({ vite: { plugins: [vitePlugin] } });
			},

			"astro:build:done": async ({ dir, logger }) => {
				if (!secretKey || !airtableToken) {
					throw new Error(
						"[alumni-encrypt] ALUMNI_SECRET_KEY and AIRTABLE_TOKEN must be set to build.",
					);
				}

				const blob = await loadBlob(logger);
				const outDir = join(fileURLToPath(dir), "data");
				mkdirSync(outDir, { recursive: true });
				const encrypted = await encrypt(blob, secretKey);
				writeFileSync(join(outDir, "alumni.enc"), encrypted, "utf-8");
				logger.info("[alumni-encrypt] alumni.enc written → dist/data/");
			},
		},
	};
}
