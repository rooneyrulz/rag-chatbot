import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db-config";
import { chats, documents } from "@/lib/db-schema";
import { ChatGrid } from "./chat-grid";

export default async function ChatListPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const rows = await db
        .select({
            chatId: chats.id,
            documentId: documents.id,
            title: documents.title,
            fileName: documents.fileName,
            status: documents.status,
            chunkCount: documents.chunkCount,
            updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(documents, eq(chats.documentId, documents.id))
        .where(and(eq(chats.userId, userId), isNull(documents.deletedAt)))
        .orderBy(desc(chats.updatedAt));

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <ChatGrid initialRows={rows} />
            </div>
        </div>
    );
}
