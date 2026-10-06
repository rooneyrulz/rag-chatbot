import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export type PageContent = {
    pageNumber: number;
    content: string;
};

export type DocumentChunk = {
    content: string;
    metadata: {
        pageNumber?: number;
        source?: string;
    };
};

export const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
});

export async function chunkContent(
    pages: PageContent[],
): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    for (const page of pages) {
        const pageChunks = await textSplitter.splitText(page.content.trim());

        for (const chunk of pageChunks) {
            chunks.push({
                content: chunk,
                metadata: {
                    pageNumber: page.pageNumber,
                    source: "pdf",
                },
            });
        }
    }

    return chunks;
}

// export async function chunkContent(content: string) {
//   return await textSplitter.splitText(content.trim());
// }
