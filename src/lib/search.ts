import { and, cosineDistance, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db-config";
import { documentChunks } from "@/lib/db-schema";
import { generateEmbedding } from "./embeddings";

export type SearchResult = {
    id: string;
    content: string;
    chunk_index: number;
    similarity: number;
    page: number | null;
};

function deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
        const key = result.content.trim().slice(0, 200);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export async function searchDocuments(
    query: string,
    documentId: string,
    userId: string,
    limit: number = 8,
): Promise<SearchResult[]> {
    const embedding = await generateEmbedding(query);
    const similarity = sql<number>`1 - (${cosineDistance(
        documentChunks.embedding,
        embedding,
    )})`;

    const results = await db
        .select({
            id: documentChunks.id,
            content: documentChunks.content,
            chunk_index: documentChunks.chunkIndex,
            similarity,
            page: sql<
                number | null
            >`(${documentChunks.metadata}->>'page')::int`,
        })
        .from(documentChunks)
        .where(
            and(
                // Scopes retrieval to the document actually being chatted with —
                // without this, results mix chunks from every document.
                eq(documentChunks.documentId, documentId),
                // Defense in depth: even though the caller (route.ts) already
                // verifies chat ownership, scoping by userId here too means this
                // function can never leak another user's chunks even if called
                // from somewhere that skipped the ownership check upstream.
                eq(documentChunks.userId, userId),
            ),
        )
        .orderBy(desc(similarity))
        .limit(limit);

    return deduplicateResults(results);
}

export function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
        return "No relevant documents found.";
    }

    return results
        .map((result, index) => {
            const pageLabel = result.page ? ` p.${result.page}` : "";
            return `[${index + 1}]${pageLabel} (relevance: ${result.similarity.toFixed(2)})\n${result.content} chunkIndex: ${result.chunk_index}`;
        })
        .join("\n\n---\n\n");
}
