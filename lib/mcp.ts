import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { resolve } from "path";

type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

// Singleton MCP client that persists across requests
let mcpClientInstance: MCPClient | null = null;
let mcpClientPromise: Promise<MCPClient> | null = null;

function getMCPBinaryPath(): string {
  // Use the installed binary from node_modules
  return resolve(process.cwd(), "node_modules/.bin/mcp-server");
}

async function createClient(): Promise<MCPClient> {
  const apiKey = process.env.HENRY_API_KEY_MCP;

  if (!apiKey) {
    throw new Error("Missing HENRY_API_KEY environment variable");
  }

  const environment =
    process.env.HENRY_MCP_ENV || process.env.HENRY_ENV || "sandbox";

  // Filter out SDK base URL to avoid "Ambiguous URL" error in @henrylabs/mcp
  const {
    HENRY_SDK_BASE_URL: _,
    HENRY_API_KEY: __,
    ...filteredEnv
  } = process.env;

  const client = await createMCPClient({
    transport: new StdioMCPTransport({
      command: getMCPBinaryPath(),
      args: [],
      env: {
        ...filteredEnv,
        // MCP server uses HENRY_SDK_* naming convention
        HENRY_SDK_API_KEY: apiKey,
        HENRY_SDK_ENVIRONMENT: environment
      }
    })
  });

  return client;
}

export async function getHenryMCPClient(): Promise<MCPClient> {
  // If we already have a working client, return it
  if (mcpClientInstance) {
    return mcpClientInstance;
  }

  // If client creation is in progress, wait for it
  if (mcpClientPromise) {
    return mcpClientPromise;
  }

  // Create new client
  mcpClientPromise = createClient()
    .then((client) => {
      mcpClientInstance = client;
      mcpClientPromise = null;
      return client;
    })
    .catch((error) => {
      mcpClientPromise = null;
      throw error;
    });

  return mcpClientPromise;
}

// For graceful shutdown
export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.close();
    mcpClientInstance = null;
  }
}

// Legacy function name for backwards compatibility
export const createHenryMCPClient = getHenryMCPClient;
