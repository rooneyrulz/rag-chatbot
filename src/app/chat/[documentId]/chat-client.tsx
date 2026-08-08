"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";

import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
    PromptInput,
    PromptInputBody,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";

type ChatClientProps = {
    chatId: string;
    documentId: string;
    documentTitle: string;
    initialMessages: UIMessage[];
};

const SUGGESTED_PROMPTS = [
    "Summarize this document",
    "What are the key takeaways?",
    "Are there any important dates or numbers?",
];

export function ChatClient({
    chatId,
    documentId,
    documentTitle,
    initialMessages,
}: ChatClientProps) {
    const [input, setInput] = useState("");

    // `id: chatId` keys the chat to this document's conversation instead of a
    // fresh anonymous session, and `messages: initialMessages` hydrates prior
    // history loaded server-side. `documentId` rides along in the request body
    // so /api/chat can scope retrieval to this document's chunks only.
    //
    // Verify DefaultChatTransport's exact options against your installed
    // "ai" version's docs — this API has shifted across v5 releases.
    const { messages, sendMessage, status } = useChat({
        id: chatId,
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: { documentId },
        }),
    });

    const handleSubmit = (message: PromptInputMessage) => {
        if (!message.text) return;
        sendMessage({ text: message.text });
        setInput("");
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col p-6">
            {/* Document context header */}
            <div className="mb-4 flex items-center gap-3 border-b pb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="shrink-0"
                >
                    <Link href="/chat">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <h1 className="truncate text-sm font-semibold text-foreground">
                        {documentTitle}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Chatting with this document
                    </p>
                </div>
            </div>

            <Conversation className="flex-1">
                <ConversationContent>
                    {isEmpty ? (
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h2 className="mt-4 text-base font-medium text-foreground">
                                Ask anything about this document
                            </h2>
                            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                                Answers are generated from its content, with
                                page references where relevant.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() =>
                                            sendMessage({ text: prompt })
                                        }
                                        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id}>
                                {message.parts.map((part, index) => {
                                    switch (part.type) {
                                        case "text":
                                            return (
                                                <Fragment
                                                    key={`${message.id}-${index}`}
                                                >
                                                    <Message
                                                        from={message.role}
                                                    >
                                                        <MessageContent>
                                                            <Response>
                                                                {part.text}
                                                            </Response>
                                                        </MessageContent>
                                                    </Message>
                                                </Fragment>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        ))
                    )}
                    {(status === "submitted" || status === "streaming") && (
                        <Loader />
                    )}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>

            <PromptInput className="mt-4" onSubmit={handleSubmit}>
                <PromptInputBody>
                    <PromptInputTextarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about this document..."
                    />
                </PromptInputBody>
                <PromptInputToolbar>
                    <PromptInputTools />
                    <PromptInputSubmit status={status} />
                </PromptInputToolbar>
            </PromptInput>
            <p className="mt-2 text-center text-xs text-muted-foreground">
                Answers are generated from this document and may be incomplete
                or inaccurate.
            </p>
        </div>
    );
}
