import { anthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createHenryMCPClient } from "@/lib/mcp";

export const maxDuration = 60;

const systemPrompt = `You are Henry, a helpful AI shopping assistant. You help users find products they're looking for.

When users ask about products, use the available tools to search for them. Present the results in a helpful way, highlighting key features, prices, and why certain products might be good choices.

Be conversational, friendly, and helpful. If a user's query is vague, ask clarifying questions to better understand what they're looking for.

When you find products, briefly describe what you found and let the user know they can click on any product to see more details.`;

const modelId = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const mcpClient = await createHenryMCPClient();
  const tools = await mcpClient.tools();

  // Convert UIMessage[] to ModelMessage[]
  const modelMessages = convertToModelMessages(messages);

  const result = streamText({
    model: anthropic(modelId),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async () => {
      await mcpClient.close();
    },
  });

  return result.toUIMessageStreamResponse();
}
