"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import pdf from "pdf-parse";
import { db } from "@/lib/db-config";
import { documentChunks, documents } from "@/lib/db-schema";
import { chunkContent } from "@/lib/chunking";
import { EMBEDDING_MODEL, generateEmbeddings } from "@/lib/embeddings";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

function cleanText(text: string): string {
    return text
        .replace(/\x00/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();
}

export async function processPDFFile(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        return {
            success: false,
            error: "You must be signed in to upload files",
        };
    }

    const file = formData.get("pdf");
    if (!(file instanceof File) || file.size === 0) {
        return { success: false, error: "No file provided" };
    }

    if (file.type !== "application/pdf") {
        return { success: false, error: "File must be a PDF" };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { success: false, error: "File exceeds the 20MB limit" };
    }

    // Track this once we've created the row, so a failure partway through
    // processing can flip status to "failed" instead of leaving it stuck on
    // "processing" forever.
    let documentId: string | undefined;

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const data = await pdf(buffer);
        if (!data.text || data.text.trim().length === 0) {
            return { success: false, error: "Could not extract text from PDF" };
        }

        const content = cleanText(data.text);
        const chunks = await chunkContent(content);

        if (!chunks || chunks.length === 0) {
            return {
                success: false,
                error: "No content could be extracted from PDF",
            };
        }

        const [document] = await db
            .insert(documents)
            .values({
                userId,
                title: file.name.replace(/\.pdf$/i, ""),
                fileName: file.name,
                status: "processing",
            })
            .returning({ id: documents.id });

        documentId = document.id;

        const embeddings = await generateEmbeddings(chunks);

        if (embeddings.length !== chunks.length) {
            throw new Error("Embedding count does not match chunk count");
        }

        const records = chunks.map((chunk, index) => ({
            documentId: document.id,
            userId,
            chunkIndex: index,
            content: chunk,
            embedding: embeddings[index],
            embeddingModel: EMBEDDING_MODEL,
        }));

        await db.insert(documentChunks).values(records);

        await db
            .update(documents)
            .set({ status: "ready", chunkCount: records.length })
            .where(eq(documents.id, document.id));

        return {
            success: true,
            message: `Processed ${records.length} chunks`,
            documentId: document.id,
        };
    } catch (error) {
        console.error("Error processing PDF file:", error);

        if (documentId) {
            await db
                .update(documents)
                .set({ status: "failed" })
                .where(eq(documents.id, documentId))
                .catch((updateError) => {
                    console.error(
                        "Failed to mark document as failed:",
                        updateError,
                    );
                });
        }

        return { success: false, error: "Error processing PDF file" };
    }
}
