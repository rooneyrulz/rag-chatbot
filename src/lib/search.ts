import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { documents } from "@/lib/db-schema";
import { db } from "@/lib/db-config";
import { generateEmbedding } from "./embeddings";

export async function searchDocuments(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
) {
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
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);

  return results;
}
