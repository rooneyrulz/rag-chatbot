"use client";

import { Fragment, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import {
    PromptInput,
    PromptInputBody,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";

type ChatClientProps = {
    chatId: string;
    documentId: string;
    documentTitle: string;
    initialMessages: UIMessage[];
};

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

    return (
        <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh)]">
            <div className="flex flex-col h-full">
                <h1 className="text-lg font-semibold mb-2 truncate">
                    {documentTitle}
                </h1>

                <Conversation className="h-full">
                    <ConversationContent>
                        {messages?.map((message) => (
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
                        ))}
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
                        />
                    </PromptInputBody>
                    <PromptInputToolbar>
                        <PromptInputTools />
                        <PromptInputSubmit status={status} />
                    </PromptInputToolbar>
                </PromptInput>
            </div>
        </div>
    );
}
