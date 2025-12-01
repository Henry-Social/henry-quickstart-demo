import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";

export async function createHenryMCPClient() {
  const apiKey = process.env.HENRY_SDK_API_KEY || process.env.HENRY_API_KEY;

  if (!apiKey) {
    throw new Error("Missing HENRY_SDK_API_KEY environment variable");
  }

  // Filter out HENRY_SDK_BASE_URL to avoid "Ambiguous URL" error in @henrylabs/mcp
  const { HENRY_SDK_BASE_URL: _, ...filteredEnv } = process.env;

  const client = await createMCPClient({
    transport: new StdioMCPTransport({
      command: "npx",
      args: ["-y", "@henrylabs/mcp@latest"],
      env: {
        ...filteredEnv,
        HENRY_SDK_API_KEY: apiKey,
        HENRY_SDK_ENVIRONMENT: process.env.HENRY_SDK_ENVIRONMENT || "sandbox",
      },
    }),
  });

  return client;
}
