import { sql } from "drizzle-orm";
import {
    bigserial,
    boolean,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    vector,
    customType
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const documentStatusEnum = pgEnum("document_status", [
    "processing",
    "ready",
    "failed",
]);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
    "user",
    "assistant",
    "system",
]);

export const documents = pgTable(
    "documents",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id").notNull(),
        title: text("title").notNull(),
        fileName: text("file_name").notNull(),
        status: documentStatusEnum("status").notNull().default("processing"),
        chunkCount: integer("chunk_count").notNull().default(0),
        // Soft delete: lets you decouple "hide from UI" (instant) from
        // "cascade-delete thousands of chunk rows" (background job).
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index("documents_user_id_updated_at_idx").on(
            table.userId,
            table.updatedAt.desc(),
        ),
        index("documents_user_id_ready_idx")
            .on(table.userId)
            .where(
                sql`${table.status} = 'ready' AND ${table.deletedAt} IS NULL`,
            ),
    ],
);

export const documentChunks = pgTable(
    "document_chunks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        // Denormalized from documents.userId. This is the single most important
        // change: every vector-search query site can now filter chunks by owner
        // directly, without a join to `documents`, so tenant isolation doesn't
        // depend on remembering to join in every call site (admin routes,
        // background jobs, etc). Keep in sync at insert time; it never changes
        // after that since chunks aren't reassigned between users.
        userId: text("user_id").notNull(),
        chunkIndex: integer("chunk_index").notNull(),
        content: text("content").notNull(),
        contentTsv: tsvector("content_tsv"),
        // Free-form per-chunk metadata: page number, char offsets, section
        // heading, source sheet/slide, etc. Cheap to capture at ingest time,
        // expensive to backfill later once you want citations in the UI.
        metadata: jsonb("metadata").$type<Record<string, unknown>>(),
        embedding: vector("embedding", { dimensions: 1024 }).notNull(),
        // Which HF model produced this vector. Lets you run multiple embedding
        // model generations side by side during a migration instead of doing a
        // blind, all-at-once reprocess, and stops old/new vectors from being
        // silently compared as if they lived in the same space.
        embeddingModel: text("embedding_model")
            .notNull()
            .default("BAAI/bge-large-en-v1.5"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        // Was non-unique before — nothing stopped a retried ingest job from
        // writing two chunks at the same index for the same document.
        uniqueIndex("document_chunks_document_id_chunk_index_unique").on(
            table.documentId,
            table.chunkIndex,
        ),
        index("document_chunks_user_id_idx").on(table.userId),
        index("document_chunks_embedding_idx")
            .using("hnsw", table.embedding.op("vector_cosine_ops"))
            .with({ m: 16, ef_construction: 64 }),
    ],
);

export const chats = pgTable(
    "chats",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        userId: text("user_id").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        uniqueIndex("chats_document_id_unique").on(table.documentId),
        index("chats_user_id_updated_at_idx").on(
            table.userId,
            table.updatedAt.desc(),
        ),
    ],
);

export const chatMessages = pgTable(
    "chat_messages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        // Monotonic tiebreaker for ordering. `createdAt` alone can't guarantee
        // stable order when a user message and a fast Groq-streamed assistant
        // reply land within the same timestamp resolution window, or during a
        // bulk import/replay. Random uuid ids can't break ties either.
        sequence: bigserial("sequence", { mode: "number" }).notNull(),
        chatId: uuid("chat_id")
            .notNull()
            .references(() => chats.id, { onDelete: "cascade" }),
        role: chatMessageRoleEnum("role").notNull(),
        content: text("content").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex("chat_messages_sequence_unique").on(table.sequence),
        index("chat_messages_chat_id_sequence_idx").on(
            table.chatId,
            table.sequence,
        ),
    ],
);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;
export type SelectDocumentChunk = typeof documentChunks.$inferSelect;
export type InsertChat = typeof chats.$inferInsert;
export type SelectChat = typeof chats.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type SelectChatMessage = typeof chatMessages.$inferSelect;
