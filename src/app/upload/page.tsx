"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    FileText,
    Loader2,
    UploadCloud,
    XCircle,
} from "lucide-react";
import { processPDFFile } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB, keep in sync with actions.ts

export default function PDFUpload() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFile, setActiveFile] = useState<{ name: string } | null>(null);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const processFile = async (file: File) => {
        setMessage(null);

        if (file.type !== "application/pdf") {
            setMessage({ type: "error", text: "File must be a PDF" });
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setMessage({ type: "error", text: "File exceeds the 20MB limit" });
            return;
        }

        setActiveFile({ name: file.name });
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("pdf", file);

            const result = await processPDFFile(formData);
            if (result.success) {
                setMessage({
                    type: "success",
                    text: result.message || "PDF processed successfully",
                });
                if (result.documentId) {
                    router.push(`/chat/${result.documentId}`);
                }
            } else {
                setMessage({
                    type: "error",
                    text: result.error || "Failed to process PDF",
                });
                setActiveFile(null);
            }
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred",
            });
            setActiveFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) processFile(file);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (isLoading) return;
        const file = event.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!isLoading) setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const openFilePicker = () => {
        if (!isLoading) fileInputRef.current?.click();
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UploadCloud className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Upload a document
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        We'll read it, index it, and have it ready for you to
                        chat with.
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div
                            role="button"
                            tabIndex={isLoading ? -1 : 0}
                            onClick={openFilePicker}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault();
                                    openFilePicker();
                                }
                            }}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={cn(
                                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                isLoading
                                    ? "cursor-not-allowed border-border bg-muted/30"
                                    : "cursor-pointer border-border hover:border-primary/40 hover:bg-muted/30",
                                isDragging &&
                                    !isLoading &&
                                    "border-primary bg-primary/5",
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                disabled={isLoading}
                                onChange={handleInputChange}
                                className="hidden"
                            />

                            {isLoading ? (
                                <>
                                    <Loader2 className="h-9 w-9 animate-spin text-primary" />
                                    <p className="mt-4 text-sm font-medium text-foreground">
                                        Processing {activeFile?.name}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        This can take a moment for larger files.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <p className="mt-4 text-sm font-medium text-foreground">
                                        Drag and drop your PDF here
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        or{" "}
                                        <span className="font-medium text-primary">
                                            browse
                                        </span>{" "}
                                        to choose a file
                                    </p>
                                    <p className="mt-4 text-xs text-muted-foreground">
                                        PDF only · Max 20MB
                                    </p>
                                </>
                            )}
                        </div>

                        {message && (
                            <Alert
                                variant={
                                    message.type === "error"
                                        ? "destructive"
                                        : "default"
                                }
                                className="mt-5"
                            >
                                {message.type === "success" ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>
                                    {message.type === "success"
                                        ? "Success"
                                        : "Error"}
                                </AlertTitle>
                                <AlertDescription>
                                    {message.text}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
