import {
  streamText,
  UIMessage,
  convertToModelMessages,
  InferUITools,
  UIDataTypes,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { formatSearchResults, searchDocuments } from "@/lib/search";

export type ChatTools = InferUITools<Record<string, never>>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

function getLastUserQuery(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;

    return message.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text"
      )
      .map((part) => part.text)
      .join("\n")
      .trim();
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    const query = getLastUserQuery(messages);
    const results = query ? await searchDocuments(query, 8) : [];
    const context = formatSearchResults(results);

    const result = streamText({
      model: groq("llama-3.1-8b-instant"),
      messages: convertToModelMessages(messages),
      system: `You are a helpful assistant that answers questions based on uploaded PDF documents.

Use ONLY the retrieved context below to answer. Follow these rules:
- Answer directly and concisely using facts from the context.
- If the context does not contain enough information, say "I couldn't find relevant information in the uploaded documents."
- Do not invent facts or use knowledge outside the provided context.
- When helpful, mention which part of the context your answer comes from.

Retrieved context:
${context}`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
