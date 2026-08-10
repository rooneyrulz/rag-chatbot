import { and, cosineDistance, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db-config";
import { documentChunks } from "@/lib/db-schema";
import { generateEmbedding } from "./embeddings";

export type SearchResult = {
    id: string;
    content: string;
    chunk_index: number;
    // Vector cosine similarity, populated when this chunk was found by the
    // vector pass. null doesn't mean "irrelevant" — it means the chunk was
    // only surfaced by full-text search, which is exactly the case hybrid
    // search exists to catch (an exact term an embedding blurred past
    // relevance, e.g. a specific figure, name, or acronym).
    similarity: number | null;
    page: number | null;
    // Reciprocal Rank Fusion score — the actual signal used to rank and
    // limit final results. Not a probability or similarity; a fused rank
    // score with no fixed scale, higher is better.
    score: number;
};

type CandidateRow = {
    id: string;
    content: string;
    chunk_index: number;
    page: number | null;
    similarity?: number;
};

const RRF_K = 60; // standard constant from the RRF literature, rarely needs tuning
const CANDIDATE_POOL_SIZE = 20; // pull more than `limit` from each pass before fusing

function deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
        const key = result.content.trim().slice(0, 200);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function reciprocalRankFusion(
    vectorResults: CandidateRow[],
    keywordResults: CandidateRow[],
    limit: number,
): SearchResult[] {
    const fused = new Map<
        string,
        {
            content: string;
            chunk_index: number;
            page: number | null;
            similarity: number | null;
            score: number;
        }
    >();

    vectorResults.forEach((row, index) => {
        const entry = fused.get(row.id) ?? {
            content: row.content,
            chunk_index: row.chunk_index,
            page: row.page,
            similarity: null,
            score: 0,
        };
        entry.similarity = row.similarity ?? entry.similarity;
        entry.score += 1 / (RRF_K + index + 1);
        fused.set(row.id, entry);
    });

    keywordResults.forEach((row, index) => {
        const entry = fused.get(row.id) ?? {
            content: row.content,
            chunk_index: row.chunk_index,
            page: row.page,
            similarity: null,
            score: 0,
        };
        entry.score += 1 / (RRF_K + index + 1);
        fused.set(row.id, entry);
    });

    return Array.from(fused.entries())
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
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

    const scope = and(
        eq(documentChunks.documentId, documentId),
        eq(documentChunks.userId, userId),
    );

    // Vector pass and keyword pass run concurrently, each scoped identically
    // by document + user, each using its own index (HNSW for the vector
    // ORDER BY, GIN for the tsvector @@ match) — they don't contend with
    // each other, just two independent reads fused in application code.
    const [vectorResults, keywordResults] = await Promise.all([
        db
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
            .where(scope)
            .orderBy(desc(similarity))
            .limit(CANDIDATE_POOL_SIZE),

        db
            .select({
                id: documentChunks.id,
                content: documentChunks.content,
                chunk_index: documentChunks.chunkIndex,
                page: sql<
                    number | null
                >`(${documentChunks.metadata}->>'page')::int`,
            })
            .from(documentChunks)
            .where(
                and(
                    scope,
                    sql`${documentChunks.contentTsv} @@ websearch_to_tsquery('english', ${query})`,
                ),
            )
            .orderBy(
                desc(
                    sql`ts_rank(${documentChunks.contentTsv}, websearch_to_tsquery('english', ${query}))`,
                ),
            )
            .limit(CANDIDATE_POOL_SIZE),
    ]);

    // Fuse with headroom above `limit` so post-fusion deduplication doesn't
    // leave you with fewer than `limit` results when both passes overlap.
    const fused = reciprocalRankFusion(
        vectorResults,
        keywordResults,
        limit * 2,
    );
    return deduplicateResults(fused).slice(0, limit);
}

export function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
        return "No relevant documents found.";
    }

    return results
        .map((result, index) => {
            const pageLabel = result.page ? ` p.${result.page}` : "";
            return `[${index + 1}]${pageLabel} (relevance: ${result.score.toFixed(4)})\n${result.content} chunkIndex: ${result.chunk_index}`;
        })
        .join("\n\n---\n\n");
}
