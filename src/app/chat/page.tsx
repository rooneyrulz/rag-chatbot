import { auth } from "@clerk/nextjs/server";
import { formatDistanceToNow } from "date-fns";
import { desc, eq } from "drizzle-orm";
import {
    AlertTriangle,
    File,
    FileText,
    FileType2,
    Loader2,
    MessageSquare,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db-config";
import { chats, documents } from "@/lib/db-schema";

function getFileIcon(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return FileText;
    if (ext === "doc" || ext === "docx") return FileType2;
    return File;
}

function getFileKind(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "doc" || ext === "docx") return "Word";
    return ext ? ext.toUpperCase() : "File";
}

export default async function ChatListPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const rows = await db
        .select({
            chatId: chats.id,
            documentId: documents.id,
            title: documents.title,
            fileName: documents.fileName,
            status: documents.status,
            chunkCount: documents.chunkCount,
            updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(documents, eq(chats.documentId, documents.id))
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.updatedAt));

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Your chats
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {rows.length > 0
                                ? `${rows.length} document${rows.length === 1 ? "" : "s"} you can ask questions about`
                                : "Upload a document to start your first conversation"}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/upload">
                            <Upload className="h-4 w-4" />
                            Upload document
                        </Link>
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="mt-4 text-base font-medium text-foreground">
                                No chats yet
                            </h2>
                            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                                Upload a document and it'll show up here as a
                                chat you can open anytime.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/upload">
                                    <Upload className="h-4 w-4" />
                                    Upload your first document
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {rows.map((row) => {
                            const Icon = getFileIcon(row.fileName);
                            const kind = getFileKind(row.fileName);
                            const isReady = row.status === "ready";
                            const isProcessing = row.status === "processing";
                            const isFailed = row.status === "failed";

                            const cardContent = (
                                <>
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div
                                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                                                isFailed
                                                    ? "bg-destructive/10 text-destructive"
                                                    : isProcessing
                                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                      : "bg-primary/10 text-primary"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        {isProcessing && (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
                                            >
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Processing
                                            </Badge>
                                        )}
                                        {isFailed && (
                                            <Badge
                                                variant="destructive"
                                                className="gap-1"
                                            >
                                                <AlertTriangle className="h-3 w-3" />
                                                Failed
                                            </Badge>
                                        )}
                                    </CardHeader>

                                    <CardContent>
                                        <CardTitle className="line-clamp-2 text-sm">
                                            {row.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1 truncate text-xs">
                                            {row.fileName}
                                        </CardDescription>

                                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {kind}
                                                {isReady
                                                    ? ` · ${row.chunkCount} ${row.chunkCount === 1 ? "chunk" : "chunks"}`
                                                    : ""}
                                            </span>
                                            <span>
                                                {formatDistanceToNow(
                                                    row.updatedAt,
                                                    {
                                                        addSuffix: true,
                                                    },
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </>
                            );

                            if (!isReady) {
                                return (
                                    <Card
                                        key={row.chatId}
                                        className="cursor-not-allowed opacity-70"
                                        aria-disabled="true"
                                    >
                                        {cardContent}
                                    </Card>
                                );
                            }

                            return (
                                <Link
                                    key={row.chatId}
                                    href={`/chat/${row.documentId}`}
                                    className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                                        {cardContent}
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
