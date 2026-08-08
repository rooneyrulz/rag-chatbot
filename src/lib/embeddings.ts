export const EMBEDDING_MODEL = "mixedbread-ai/mxbai-embed-large-v1";

import { HfInference } from "@huggingface/inference";

if (!process.env.HUGGINGFACE_ACCESS_TOKEN) {
  throw new Error("HUGGINGFACE_ACCESS_TOKEN environment variable is required");
}

const hf = new HfInference(process.env.HUGGINGFACE_ACCESS_TOKEN);

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replace(/\n/g, " ");
  try {
    const response = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: input,
    });
    console.log("embedding generated: ", response);
    return response as number[];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((text) => text.replace(/\n/g, " "));
  try {
    const response = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs,
    });
    return response as number[][];
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}
