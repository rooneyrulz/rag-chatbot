import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  MessageSquareText,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
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
import { chats } from "@/lib/db-schema";

const features = [
  {
    step: "Step 1",
    icon: UploadCloud,
    title: "Upload your documents",
    description:
      "Add a PDF in seconds. We split and index the content automatically so it's ready to search.",
  },
  {
    step: "Step 2",
    icon: MessageSquareText,
    title: "Ask in plain language",
    description:
      "Chat naturally about what's inside instead of skimming pages for the right paragraph.",
  },
  {
    step: "Step 3",
    icon: BookOpenCheck,
    title: "Get grounded answers",
    description:
      "Every response is generated from your own content, with page references so you can verify it.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  // Signed-out visitors go to sign-up (both /chat and /upload are behind
  // the auth middleware anyway, so sending them there first just adds a
  // redirect hop). Signed-in users go straight to their most useful place:
  // an existing chat if they have one, otherwise the upload flow.
  let ctaHref = "/sign-up";
  let ctaLabel = "Get started";

  if (userId) {
    const [existingChat] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.userId, userId))
      .limit(1);

    ctaHref = existingChat ? "/chat" : "/upload";
  }

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-24 text-center sm:pt-32">
        {/* Signature: document becomes conversation */}
        <div className="relative mb-10 h-20 w-24">
          <div className="absolute top-0 left-0 flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl border bg-card shadow-sm">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="absolute right-0 bottom-0 flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <MessageSquareText className="h-7 w-7" />
          </div>
        </div>

        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered document assistant
        </Badge>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Chat with your <span className="text-primary">documents</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Upload a PDF and ask questions in plain language. Get accurate,
          cited answers grounded in your own content — nothing invented,
          every claim traceable to a page.
        </p>

        <Button asChild size="lg" className="mt-8 gap-2">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <div className="mt-24 grid w-full grid-cols-1 gap-6 text-left md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border/60">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {feature.step}
                  </p>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
