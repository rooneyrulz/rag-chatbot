"use client";

import { useState } from "react";
// import { useChat } from "ai";

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

export default function RAGChatBot() {
  const [input, setInput] = useState("");


  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>Message will go here</ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput className="mt-4" onSubmit={() => {}}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools />
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
