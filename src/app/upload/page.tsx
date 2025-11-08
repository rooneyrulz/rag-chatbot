"use client";

import { useState } from "react";
import { processPDFFile } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTitle, AlertDescription, Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function PDFUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessages(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const result = await processPDFFile(formData);
      if (result.success) {
        setMessages({
          type: "success",
          text: result.message || "PDF processed successfully",
        });
        event.target.value = "";
      } else {
        setMessages({
          type: "error",
          text: result.error || "Failed to process PDF",
        });
      }
    } catch (error) {
      setMessages({
        type: "error",
        text:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Upload PDF
        </h1>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label htmlFor="file">Upload PDF</Label>
              <Input
                type="file"
                id="file"
                accept=".pdf"
                disabled={isLoading}
                className="mt-2"
                onChange={handleFileUpload}
              />
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-muted-foreground">
                    Processing PDF...
                  </span>
                </div>
              )}
              {messages && (
                <Alert className="mt-4">
                  <AlertTitle>
                    {messages.type === "success" ? "Success" : "Error"}
                  </AlertTitle>
                  <AlertDescription>{messages.text}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
