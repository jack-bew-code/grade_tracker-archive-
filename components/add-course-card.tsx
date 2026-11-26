// A "skeleton" course card with a + in the middle.
// Shown in place of your courses when you don't have any yet.

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AddCourseCard() {
  return (
    <Link href="/setup" className="group">
      <Card className="relative border-2 border-dashed bg-transparent shadow-none transition-colors group-hover:border-primary/50 group-hover:bg-muted/50">
        {/* Faded placeholder lines that look like a course card */}
        <CardHeader className="opacity-40">
          <Skeleton className="h-5 w-2/3 animate-none" />
          <Skeleton className="h-4 w-1/4 animate-none" />
        </CardHeader>
        <CardContent className="grid gap-2 opacity-40">
          <Skeleton className="h-8 w-20 animate-none" />
          <Skeleton className="h-2 w-full animate-none" />
          <Skeleton className="h-3 w-1/2 animate-none" />
        </CardContent>

        {/* The + button on top */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Plus className="size-6" />
          </div>
          <span className="font-medium">Add new course</span>
        </div>
      </Card>
    </Link>
  );
}
