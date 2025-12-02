import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { getHenryMCPClient } from "@/lib/mcp";

export const maxDuration = 60;

const systemPrompt = `You are a helpful AI shopping assistant. You help users find products they're looking for.

When users ask about products, use the available tools to search for them. Present the results in a helpful way, highlighting key features, prices, and why certain products might be good choices.

Be conversational, friendly, and helpful. Use emojis naturally throughout your responses to make them more engaging and expressive. If a user's query is vague, ask clarifying questions to better understand what they're looking for.

When you find products, briefly describe what you found and let the user know they can click on any product to see more details.

IMPORTANT: Always format your responses using Markdown for better readability:
- Use **bold** for emphasis on important terms, prices, or product names
- Use bullet points or numbered lists when comparing products or listing features
- Use headings (##) to organize longer responses
- Use \`code\` formatting for specific values like prices or specs when appropriate`;

const modelId = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Use singleton MCP client - stays alive across requests
  const mcpClient = await getHenryMCPClient();
  const tools = await mcpClient.tools();

  // Convert UIMessage[] to ModelMessage[]
  const modelMessages = convertToModelMessages(messages);

  const result = streamText({
    model: anthropic(modelId),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
