import { streamText, UIMessage, convertToModelMessages } from "ai";
import { groq } from "@ai-sdk/groq";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: groq("gpt-4o"),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
