// Overview tab: a card per year, plus what's coming up next.

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { classify, formatDate, mark, pct, type StatsMap } from "@/lib/grades";
import type { CourseTree } from "@/lib/types";

export function Overview({ course, stats }: { course: CourseTree; stats: StatsMap }) {
  // Every exam/coursework with a due date and no mark yet, soonest first.
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = course.years
    .flatMap((y) => y.semesters.flatMap((s) => s.modules.flatMap((m) => m.components.map((c) => ({ ...c, moduleName: m.name })))))
    .filter((c) => c.grade === null && c.due_date !== null)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
        {course.years.map((year) => {
          const s = stats[`year-${year.id}`];
          const modules = year.semesters.flatMap((sem) => sem.modules);
          return (
            <Card key={year.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {year.name}
                  <span className="tabular-nums">{mark(s.average)}</span>
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>{year.weight}% of degree</span>
                  {classify(s.average) && <Badge variant="outline">{classify(s.average)}</Badge>}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-1">
                  <Progress value={s.done * 100} />
                  <p className="text-xs text-muted-foreground">{pct(s.done)} of this year graded</p>
                </div>
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No modules added yet.</p>
                ) : (
                  <ul className="grid gap-1 text-sm">
                    {modules.map((m) => {
                      const ms = stats[`module-${m.id}`];
                      return (
                        <li key={m.id} className="flex justify-between gap-2">
                          <span className="truncate">{m.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {mark(ms.average)} <span className="text-xs">({pct(ms.done)} done)</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
          <CardDescription>Ungraded work with a due date</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet — add due dates to your exams and coursework.</p>
          ) : (
            <ul className="grid gap-3">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.moduleName} · {pct(stats[`component-${c.id}`].ofCourse)} of degree
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums">{formatDate(c.due_date!)}</p>
                    {c.due_date! < today && <p className="text-xs text-muted-foreground">awaiting mark</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
