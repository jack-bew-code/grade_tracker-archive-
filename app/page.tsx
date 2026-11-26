// Home page: your courses. With no courses yet, it sends you to setup.

import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateCourse, classify, mark, pct } from "@/lib/grades";
import { getCourses, getCourseTree } from "@/lib/queries";

export default async function HomePage() {
  await connection(); // always load fresh data (don't build this page ahead of time)
  const courses = await getCourses();
  if (courses.length === 0) redirect("/setup");

  // Load each course so we can show its average.
  const trees = await Promise.all(courses.map((c) => getCourseTree(c.id)));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your courses</h1>
        <Button asChild>
          <Link href="/setup">
            <Plus />
            New course
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {trees.map((course) => {
          if (!course) return null;
          const s = calculateCourse(course).course;
          return (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription>{course.years.length} years</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold tabular-nums">{mark(s.average)}</span>
                    {classify(s.average) && <Badge variant="outline">{classify(s.average)}</Badge>}
                  </div>
                  <Progress value={s.done * 100} />
                  <p className="text-xs text-muted-foreground">{pct(s.done)} of the degree graded</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
