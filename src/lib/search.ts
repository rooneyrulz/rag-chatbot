import { cosineDistance, desc, sql } from "drizzle-orm";
import { documents } from "@/lib/db-schema";
import { db } from "@/lib/db-config";
import { generateEmbedding } from "./embeddings";

export type SearchResult = {
  id: number;
  content: string;
  similarity: number;
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
  limit: number = 8
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(
    documents.embedding,
    embedding
  )})`;

  const results = await db
    .select({
      id: documents.id,
      content: documents.content,
      similarity,
    })
    .from(documents)
    .orderBy(desc(similarity))
    .limit(limit);

  return deduplicateResults(results);
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No relevant documents found.";
  }

  return results
    .map(
      (result, index) =>
        `[${index + 1}] (relevance: ${result.similarity.toFixed(2)})\n${result.content}`
    )
    .join("\n\n---\n\n");
}
