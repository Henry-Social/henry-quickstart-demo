import HenrySDK from "@henrylabs/sdk";

// Centralized Henry SDK client instance for server-side usage.
//
// Env vars supported:
// - HENRY_API_KEY (preferred in this repo) or HENRY_SDK_API_KEY
// - HENRY_ENV: 'sandbox' | 'production' (optional; defaults to 'sandbox')
// - HENRY_SDK_BASE_URL or HENRY_API_URL (optional override for base URL)

const apiKey = process.env.HENRY_API_KEY ?? process.env.HENRY_SDK_API_KEY;
if (!apiKey) {
  throw new Error(
    "Henry SDK: missing API key. Set HENRY_API_KEY or HENRY_SDK_API_KEY in your environment.",
  );
}

const environment = (process.env.HENRY_ENV as "sandbox" | "production" | undefined) ?? undefined;
const baseURL = process.env.HENRY_SDK_BASE_URL ?? process.env.HENRY_API_URL ?? undefined;

export const henry = new HenrySDK({
  apiKey,
  ...(environment ? { environment } : {}),
  ...(baseURL ? { baseURL } : {}),
});

export type HenryClient = typeof henry;
