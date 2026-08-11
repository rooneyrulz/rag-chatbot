"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";

export async function deleteDocuments(documentIds: string[]) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    if (documentIds.length === 0) {
        return { success: false, error: "No documents selected" };
    }

    // Soft delete (documents.deletedAt), not a hard DELETE — avoids a
    // synchronous cascade through potentially thousands of documentChunks
    // rows inside a request. The userId filter means any id that doesn't
    // belong to this user is silently excluded rather than erroring, so a
    // tampered id list can't be used to probe for other users' documents.
    const updated = await db
        .update(documents)
        .set({ deletedAt: new Date() })
        .where(
            and(
                inArray(documents.id, documentIds),
                eq(documents.userId, userId),
            ),
        )
        .returning({ id: documents.id });

    revalidatePath("/chat");

    return { success: true, deletedCount: updated.length };
}
