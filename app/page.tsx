// Home page: your courses — and only yours.
// With no courses yet, it shows a placeholder card with an "Add new course" button.

import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { AddCourseCard } from "@/components/add-course-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUserId } from "@/lib/auth";
import { calculateCourse, classify, mark, pct } from "@/lib/grades";
import { getCourses, getCourseTree } from "@/lib/queries";

export default async function HomePage() {
  await connection(); // always load fresh data (don't build this page ahead of time)
  const userId = await getUserId();
  const courses = await getCourses(userId);

  // Load each course so we can show its average.
  const trees = await Promise.all(courses.map((c) => getCourseTree(c.id, userId)));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your courses</h1>
        {courses.length > 0 && (
          <Button asChild>
            <Link href="/setup">
              <Plus />
              New course
            </Link>
          </Button>
        )}
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

        {/* No courses yet: a placeholder card where your first course will go */}
        {courses.length === 0 && <AddCourseCard />}
      </div>
    </div>
  );
}
