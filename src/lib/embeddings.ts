import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const EMBEDDING_MODEL = "gemini-embedding-001";

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replace(/\n/g, " ");
  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: input,
      config: {
        outputDimensionality: 1024, // Matches your previous mxbai dimension size
      },
    });
    return response.embeddings?.[0]?.values ?? [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((text) => text.replace(/\n/g, " "));
  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: inputs,
      config: {
        outputDimensionality: 1024,
      },
    });
    return response.embeddings?.map((e) => e.values ?? []) ?? [];
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}
