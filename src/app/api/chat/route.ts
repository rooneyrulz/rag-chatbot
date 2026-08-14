import { auth } from "@clerk/nextjs/server";
import {
    streamText,
    type UIMessage,
    convertToModelMessages,
    type InferUITools,
    type UIDataTypes,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db-config";
import { chatMessages, chats } from "@/lib/db-schema";
import { formatSearchResults, searchDocuments } from "@/lib/search";

export type ChatTools = InferUITools<Record<string, never>>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

function getLastUserQuery(messages: ChatMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.role !== "user") continue;

        return message.parts
            .filter(
                (part): part is { type: "text"; text: string } =>
                    part.type === "text",
            )
            .map((part) => part.text)
            .join("\n")
            .trim();
    }

    return "";
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const {
            messages,
            documentId,
        }: { messages: ChatMessage[]; documentId?: string } = await req.json();

        if (!documentId) {
            return new Response("Missing documentId", { status: 400 });
        }

        // Re-derive the chat from documentId + userId server-side rather than
        // trusting a client-supplied chatId. This is also the ownership check:
        // if this user doesn't own a chat for this document, they get a 404,
        // not another user's document context.
        const [chat] = await db
            .select()
            .from(chats)
            .where(
                and(eq(chats.documentId, documentId), eq(chats.userId, userId)),
            )
            .limit(1);

        if (!chat) {
            return new Response("Not Found", { status: 404 });
        }

        const query = getLastUserQuery(messages);

        // Persist the user's message before generating a reply, so it survives
        // in history even if generation fails partway through.
        if (query) {
            await db.insert(chatMessages).values({
                chatId: chat.id,
                role: "user",
                content: query,
            });
        }

        const results = query
            ? await searchDocuments(query, documentId, userId, 8)
            : [];
        const context = formatSearchResults(results);

        const result = streamText({
            model: groq("openai/gpt-oss-120b"),
            messages: convertToModelMessages(messages),
            system: `You are a helpful assistant that answers questions based on uploaded PDF documents.

Use ONLY the retrieved context below to answer. Follow these rules:
- Answer directly and concisely using facts from the context.
- If the context does not contain enough information, say "I couldn't find relevant information in the uploaded documents."
- Do not invent facts or use knowledge outside the provided context.
- When helpful, mention which chunkIndex of the context your answer comes from.

Retrieved context:
${context}`,
            onFinish: async ({ text }) => {
                if (!text) return;
                await db.insert(chatMessages).values({
                    chatId: chat.id,
                    role: "assistant",
                    content: text,
                });
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error(error);
        return new Response("Internal Server Error", {
            status: 500,
        });
    }
}
