DROP INDEX "chat_messages_chat_id_created_at_idx";--> statement-breakpoint
DROP INDEX "document_chunks_document_id_idx";--> statement-breakpoint
DROP INDEX "document_chunks_document_id_chunk_index_idx";--> statement-breakpoint
DROP INDEX "document_chunks_embedding_idx";--> statement-breakpoint
DROP INDEX "documents_user_id_ready_idx";--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "sequence" bigserial NOT NULL;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "embedding_model" text DEFAULT 'BAAI/bge-large-en-v1.5' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_messages_sequence_unique" ON "chat_messages" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_sequence_idx" ON "chat_messages" USING btree ("chat_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunks_document_id_chunk_index_unique" ON "document_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "document_chunks_user_id_idx" ON "document_chunks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "document_chunks_embedding_idx" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "documents_user_id_ready_idx" ON "documents" USING btree ("user_id") WHERE "documents"."status" = 'ready' AND "documents"."deleted_at" IS NULL;