CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "embedding_idx" ON "documents" USING hnsw ("embedding" vector_cosine_ops);