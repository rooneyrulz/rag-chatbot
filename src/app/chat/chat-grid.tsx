"use client";

import { formatDistanceToNow } from "date-fns";
import {
    AlertTriangle,
    File,
    FileText,
    FileType2,
    ListChecks,
    Loader2,
    MessageSquare,
    Trash2,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDocuments } from "./actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export type ChatListRow = {
    chatId: string;
    documentId: string;
    title: string;
    fileName: string;
    status: "processing" | "ready" | "failed";
    chunkCount: number;
    updatedAt: Date;
};

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

export function ChatGrid({ initialRows }: { initialRows: ChatListRow[] }) {
    const router = useRouter();
    const [rows, setRows] = useState(initialRows);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(
        null,
    );
    const [isDeleting, startTransition] = useTransition();

    const toggleSelectionMode = () => {
        setSelectionMode((prev) => !prev);
        setSelectedIds(new Set());
    };

    const toggleSelected = (documentId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(documentId)) {
                next.delete(documentId);
            } else {
                next.add(documentId);
            }
            return next;
        });
    };

    const confirmDelete = () => {
        if (!pendingDeleteIds || pendingDeleteIds.length === 0) return;
        const idsToDelete = pendingDeleteIds;

        startTransition(async () => {
            const result = await deleteDocuments(idsToDelete);
            setPendingDeleteIds(null);

            if (result.success) {
                setRows((prev) =>
                    prev.filter((row) => !idsToDelete.includes(row.documentId)),
                );
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    idsToDelete.forEach((id) => next.delete(id));
                    return next;
                });
                if (selectedIds.size === 0) setSelectionMode(false);
                router.refresh();
            }
            // On failure the optimistic local state is untouched — the card(s)
            // simply remain in the grid, which is the correct failure state
            // here (nothing was actually deleted).
        });
    };

    return (
        <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Your chats
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {selectionMode
                            ? `${selectedIds.size} selected`
                            : rows.length > 0
                              ? `${rows.length} document${rows.length === 1 ? "" : "s"} you can ask questions about`
                              : "Upload a document to start your first conversation"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {selectionMode ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleSelectionMode}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={selectedIds.size === 0}
                                onClick={() =>
                                    setPendingDeleteIds(Array.from(selectedIds))
                                }
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                                {selectedIds.size > 0
                                    ? ` (${selectedIds.size})`
                                    : ""}
                            </Button>
                        </>
                    ) : (
                        rows.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectionMode}
                                className="gap-2"
                            >
                                <ListChecks className="h-4 w-4" />
                                Select
                            </Button>
                        )
                    )}
                    <Button asChild size="sm">
                        <Link href="/upload">Upload document</Link>
                    </Button>
                </div>
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
                            Upload a document and it'll show up here as a chat
                            you can open anytime.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/upload">
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
                        const isSelected = selectedIds.has(row.documentId);

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

                                    <div className="flex items-center gap-1">
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
                                        {!selectionMode && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                                                aria-label={`Delete ${row.title}`}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    setPendingDeleteIds([
                                                        row.documentId,
                                                    ]);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
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

                        const cardClassName = `group relative h-full transition-all ${
                            isSelected
                                ? "border-primary ring-1 ring-primary"
                                : ""
                        } ${
                            !selectionMode && isReady
                                ? "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                                : ""
                        } ${!isReady ? "opacity-70" : ""}`;

                        if (selectionMode) {
                            return (
                                // A plain div, not a nested <button>, since the Checkbox
                                // below is itself a Radix button under the hood — button
                                // inside button is invalid HTML. The checkbox is visual
                                // only (pointer-events-none); this wrapper owns the click.
                                <div
                                    key={row.chatId}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                        toggleSelected(row.documentId)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();
                                            toggleSelected(row.documentId);
                                        }
                                    }}
                                    className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                                >
                                    <Card className={cardClassName}>
                                        <div className="absolute top-3 right-3 z-10">
                                            <Checkbox
                                                checked={isSelected}
                                                className="pointer-events-none"
                                                aria-hidden="true"
                                                tabIndex={-1}
                                            />
                                        </div>
                                        {cardContent}
                                    </Card>
                                </div>
                            );
                        }

                        if (!isReady) {
                            return (
                                <Card
                                    key={row.chatId}
                                    className={cardClassName}
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
                                <Card className={cardClassName}>
                                    {cardContent}
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            <AlertDialog
                open={pendingDeleteIds !== null}
                onOpenChange={(open) => !open && setPendingDeleteIds(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete{" "}
                            {pendingDeleteIds && pendingDeleteIds.length > 1
                                ? `${pendingDeleteIds.length} chats`
                                : "this chat"}
                            ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the document and its conversation
                            history. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
