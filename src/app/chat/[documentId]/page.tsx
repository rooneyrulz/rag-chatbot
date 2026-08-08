import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db-config";
import { chatMessages, chats, documents } from "@/lib/db-schema";
import { ChatClient } from "./chat-client";

type ChatPageProps = {
    params: Promise<{ documentId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
    const { documentId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Ownership check happens here, not just in middleware — a signed-in user
    // hitting someone else's documentId should get a 404, not another user's
    // document/chat history.
    const [document] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
        .limit(1);

    if (!document) {
        notFound();
    }

    if (document.status !== "ready") {
        // Still processing (or failed) — nothing to chat against yet.
        redirect("/upload");
    }

    let [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.documentId, documentId))
        .limit(1);

    if (!chat) {
        // documents -> chats is 1:1 (chats.documentId is unique), so this only
        // ever runs once per document, the first time its chat route is opened.
        [chat] = await db
            .insert(chats)
            .values({ documentId, userId })
            .returning();
    }

    const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, chat.id))
        .orderBy(asc(chatMessages.sequence));

    const initialMessages = history.map((message) => ({
        id: message.id,
        role: message.role,
        parts: [{ type: "text" as const, text: message.content }],
    }));

    return (
        <ChatClient
            chatId={chat.id}
            documentId={document.id}
            documentTitle={document.title}
            initialMessages={initialMessages}
        />
    );
}
