import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";

const serverUrl =
  process.env.HENRY_MCP_SERVER_URL ??
  process.env.HENRY_MCP_URL ??
  process.env.HENRY_MCP_HTTP_URL;

const mcpApiKey = process.env.HENRY_MCP_API_KEY ?? process.env.HENRY_API_KEY;

function buildHeaders() {
  if (!mcpApiKey) {
    return undefined;
  }
  return {
    Authorization: `Bearer ${mcpApiKey}`,
  };
}

export async function createHenryMcpClient() {
  if (!serverUrl) {
    throw new Error("Missing MCP server URL. Set HENRY_MCP_SERVER_URL.");
  }

  return createMCPClient({
    transport: {
      type: "http",
      url: serverUrl,
      headers: buildHeaders(),
    },
  });
}
