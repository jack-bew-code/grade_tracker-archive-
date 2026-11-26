// One course: a summary at the top, then the Tree / Overview / Plan tabs.

import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseSettings } from "@/components/course-settings";
import { CourseTree } from "@/components/course-tree";
import { Overview } from "@/components/overview";
import { Plan } from "@/components/plan";
import { WhatIfSwitch } from "@/components/what-if-switch";
import { getUserId } from "@/lib/auth";
import { calculateCourse, classify, mark, pct } from "@/lib/grades";
import { getCourseTree } from "@/lib/queries";

type Props = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ whatif?: string }>;
};

export default async function CoursePage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { whatif } = await searchParams;
  const whatIfOn = whatif === "1";

  const userId = await getUserId();
  const course = await getCourseTree(Number(courseId), userId);
  if (!course) notFound(); // doesn't exist, or isn't yours

  const realStats = calculateCourse(course);
  const whatIfStats = calculateCourse(course, { whatIf: true });
  const stats = whatIfOn ? whatIfStats : realStats; // what the tree and overview show
  const s = stats.course;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{course.name}</h1>
        <div className="flex items-center gap-4">
          <WhatIfSwitch on={whatIfOn} />
          <CourseSettings course={course} />
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">{whatIfOn ? "Projected average (what-if)" : "Average so far"}</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold tabular-nums">{mark(s.average)}</span>
              {classify(s.average) && <Badge>{classify(s.average)}</Badge>}
            </div>
          </div>
          <div className="grid content-start gap-2">
            <p className="text-sm text-muted-foreground">Degree graded</p>
            <Progress value={s.done * 100} />
            <p className="text-sm">
              You&apos;ve banked <b>{pct(s.earned)}</b> of the <b>{pct(s.done)}</b> of your degree that&apos;s been graded.
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Target</p>
            {course.target_grade === null ? (
              <p className="text-sm">No target set — add one in the Plan tab.</p>
            ) : realStats.course.needed === null ? (
              <p className="text-sm">All graded.</p>
            ) : (
              <p className="text-sm">
                Need <b>{realStats.course.needed <= 0 ? "nothing more" : mark(realStats.course.needed)}</b> average on the remaining{" "}
                {pct(1 - realStats.course.done)} for {course.target_grade}%
                {realStats.course.needed > 100 && " (not reachable)"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree">Tree</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="tree">
          <CourseTree course={course} stats={stats} />
        </TabsContent>
        <TabsContent value="overview">
          <Overview course={course} stats={stats} />
        </TabsContent>
        <TabsContent value="plan">
          <Plan course={course} stats={realStats} whatIfStats={whatIfStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
