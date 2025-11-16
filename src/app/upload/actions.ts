"use server";

import pdf from "pdf-parse";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";

function cleanText(text: string): string {
  // Remove null bytes and other non-printable characters
  return text
    .replace(/\x00/g, "") // Remove null bytes
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove other control characters
    .trim();
}

export async function processPDFFile(formData: FormData) {
  try {
    const file = formData.get("pdf") as File;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const data = await pdf(buffer);
    if (!data.text || data.text.trim().length === 0) {
      return {
        success: false,
        error: "Invalid PDF file",
      };
    }

    const content = cleanText(data.text);
    const chunks = await chunkContent(content);
    const embeddings = await generateEmbeddings(chunks);

    const records = chunks?.map((chunk, index) => ({
      content: chunk,
      embedding: embeddings[index],
    }));

    console.log("records: ", records);

    await db.insert(documents).values(records);

    return {
      success: true,
      message: `DB updated with ${records.length} records`,
    };
  } catch (error) {
    console.error("Error processing PDF file:", error);
    return {
      success: false,
      error: "Error processing PDF file",
    };
  }
}
