import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Grade Tracker",
  description: "Plan your degree and track your grades",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-muted/30">
        {/* ClerkProvider makes login available everywhere in the app */}
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" appearance={{ theme: shadcn }}>
          <TooltipProvider>
            <header className="border-b bg-background">
              <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <GraduationCap className="size-5" />
                  Grade Tracker
                </Link>
                {/* Signed out: sign in / sign up buttons. Signed in: your account menu. */}
                <Suspense>
                  <Show when="signed-out">
                    <div className="flex gap-2">
                      <SignInButton>
                        <Button variant="ghost" size="sm">Sign in</Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button size="sm">Sign up</Button>
                      </SignUpButton>
                    </div>
                  </Show>
                  <Show when="signed-in">
                    <UserButton />
                  </Show>
                </Suspense>
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
            <Toaster />
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
