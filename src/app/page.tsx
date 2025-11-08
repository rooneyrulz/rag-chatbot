import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <h1 className="text-4xl font-bold">RAG Chatbot</h1>
      <Button className="mt-4" variant="default" size="lg" asChild>
        <Link href="/chat">GO TO CHAT</Link>
      </Button>
    </div>
  );
}
