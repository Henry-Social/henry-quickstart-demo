import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createHenryMcpClient } from "@/lib/henryMcpClient";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are Henry, a concise shopping copilot.
- Use the Henry Labs MCP tools for product discovery and details whenever the user asks about products.
- Prefer searching first before recommending items. When sharing results, include product ids, names, prices, and merchants.
- Keep replies short and scannable. Avoid markdown tables.
- If a tool result includes product ids, surface them in your response so the UI can deeplink to details.
`.trim();

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await req.json()) as { messages?: unknown };
  const messages = (Array.isArray(body?.messages) ? body.messages : []) as unknown[];

  let mcpClient: Awaited<ReturnType<typeof createHenryMcpClient>> | null = null;

  try {
    mcpClient = await createHenryMcpClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to initialize Henry MCP client";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const tools = await mcpClient.tools();
    let closed = false;
    const closeMcp = async () => {
      if (closed) return;
      closed = true;
      await mcpClient?.close();
    };

    const result = streamText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      system: SYSTEM_PROMPT,
      messages: messages as any,
      tools,
      onFinish: closeMcp,
      onError: closeMcp,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await mcpClient?.close().catch(() => {});
    console.error("AI route error", error);
    return new Response(JSON.stringify({ error: "AI request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
