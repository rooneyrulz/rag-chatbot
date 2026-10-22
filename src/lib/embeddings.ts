import { GoogleGenAI } from "@google/genai";

export const EMBEDDING_MODEL = "gemini-embedding-001";

// Keep 1024 so your existing vector DB schema (mxbai = 1024 dims) doesn't change
const OUTPUT_DIMENSIONS = 1024;
const MAX_BATCH_SIZE = 100; // API limit per embedContent request

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini only returns pre-normalized vectors at the full 3072 dims.
// At 1024 dims we must normalize ourselves for cosine / dot-product search.
function normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return norm === 0 ? vec : vec.map((v) => v / norm);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(
    texts: string[],
    taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT",
    retries = 3,
): Promise<number[][]> {
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await ai.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: texts,
                config: { taskType, outputDimensionality: OUTPUT_DIMENSIONS },
            });

            const embeddings = response.embeddings;
            if (!embeddings || embeddings.length !== texts.length) {
                throw new Error("Unexpected embedding response from Gemini");
            }
            return embeddings.map((e) => normalize(e.values ?? []));
        } catch (error: any) {
            const retryable = error?.status === 429 || error?.status === 503;
            if (retryable && attempt < retries) {
                await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s backoff
                continue;
            }
            throw error;
        }
    }
}

// Same signature as before: single text -> one vector.
// Used for search queries, so it uses the RETRIEVAL_QUERY task type.
export async function generateEmbedding(text: string): Promise<number[]> {
    const input = text.replace(/\n/g, " ");
    try {
        const [embedding] = await embedBatch([input], "RETRIEVAL_QUERY");
        return embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

// Same signature as before: many texts -> many vectors.
// Used for indexing documents, so it uses the RETRIEVAL_DOCUMENT task type.
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const inputs = texts.map((text) => text.replace(/\n/g, " "));
    try {
        const results: number[][] = [];
        for (let i = 0; i < inputs.length; i += MAX_BATCH_SIZE) {
            const batch = inputs.slice(i, i + MAX_BATCH_SIZE);
            results.push(...(await embedBatch(batch, "RETRIEVAL_DOCUMENT")));
        }
        return results;
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
    }
}
