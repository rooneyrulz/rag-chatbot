import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/nextjs";
import {
    Bot,
    LogIn,
    MessagesSquare,
    UploadCloud,
    UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navigation() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-foreground">
                        Contexo
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <SignedIn>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hidden gap-2 sm:inline-flex"
                        >
                            <Link href="/chat">
                                <MessagesSquare className="h-4 w-4" />
                                Chats
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hidden gap-2 sm:inline-flex"
                        >
                            <Link href="/upload">
                                <UploadCloud className="h-4 w-4" />
                                Upload
                            </Link>
                        </Button>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>

                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <LogIn className="h-4 w-4" />
                                Sign In
                            </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button size="sm" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </SignedOut>
                </div>
            </nav>
        </header>
    );
}
