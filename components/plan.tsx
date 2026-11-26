"use client";

// Plan tab: set a target grade and see what you need on everything that's left.
// Also compares your real grades with your "what-if" predictions.

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmitButton } from "@/components/forms/form-dialog";
import { setTargetGrade } from "@/lib/actions";
import { classify, mark, pct, type Stats, type StatsMap } from "@/lib/grades";
import type { CourseTree } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { course: CourseTree; stats: StatsMap; whatIfStats: StatsMap };

const PRESETS = [
  { label: "First", value: 70 },
  { label: "2:1", value: 60 },
  { label: "2:2", value: 50 },
];

export function Plan({ course, stats, whatIfStats }: Props) {
  const target = course.target_grade;
  const s = stats.course;
  const w = whatIfStats.course;

  async function saveTarget(formData: FormData) {
    const value = String(formData.get("target") ?? "");
    const result = await setTargetGrade(course.id, value === "" ? null : Number(value));
    if (result.error) toast.error(result.error);
    else toast.success("Target saved");
  }

  async function pickPreset(value: number) {
    await setTargetGrade(course.id, value);
    toast.success(`Target set to ${value}%`);
  }

  // Rows for the table: each year, then its modules.
  const rows: { key: string; name: string; level: "year" | "module"; stats: Stats }[] = [];
  for (const year of course.years) {
    rows.push({ key: `y${year.id}`, name: year.name, level: "year", stats: stats[`year-${year.id}`] });
    for (const module of year.semesters.flatMap((sem) => sem.modules)) {
      rows.push({ key: `m${module.id}`, name: module.name, level: "module", stats: stats[`module-${module.id}`] });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Target grade</CardTitle>
          <CardDescription>What final mark are you aiming for?</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={saveTarget} className="flex gap-2">
            <Input
              key={target ?? "none"}
              name="target"
              type="number"
              step="any"
              min={0}
              max={100}
              placeholder="e.g. 70"
              defaultValue={target ?? ""}
              className="w-32"
            />
            <SubmitButton label="Save" />
          </form>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.value} variant={target === p.value ? "default" : "outline"} size="sm" onClick={() => pickPreset(p.value)}>
                {p.label} ({p.value}%)
              </Button>
            ))}
          </div>
          {target !== null && <NeededMessage stats={s} target={target} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What-if</CardTitle>
          <CardDescription>Your real marks vs. your real marks plus what-if marks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Real marks only</p>
            <p className="text-2xl font-semibold tabular-nums">{mark(s.average)}</p>
            <p className="text-xs text-muted-foreground">across {pct(s.done)} of the degree</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">With what-if marks</p>
            <p className="text-2xl font-semibold tabular-nums">{mark(w.average)}</p>
            <p className="text-xs text-muted-foreground">across {pct(w.done)} of the degree</p>
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            Add what-if marks when entering a mark (or editing an exam/coursework). Switch on “What-if” at the top to see them in the tree.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>What you need, item by item</CardTitle>
          <CardDescription>
            {target === null
              ? "Set a target above to see the average you need on what's left."
              : `The average needed on the remaining work in each year and module to hit ${target}% in it.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Worth</TableHead>
                <TableHead className="text-right">Graded</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key} className={cn(row.level === "year" && "bg-muted/50 font-medium")}>
                  <TableCell className={cn(row.level === "module" && "pl-6")}>{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(row.stats.ofCourse)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(row.stats.done)}</TableCell>
                  <TableCell className="text-right tabular-nums">{mark(row.stats.average)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Needed value={row.stats.needed} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NeededMessage({ stats, target }: { stats: Stats; target: number }) {
  if (stats.needed === null) {
    return <p className="text-sm">Everything is graded — you finished on {mark(stats.average)}.</p>;
  }
  if (stats.needed <= 0) {
    return <p className="text-sm">You&apos;ve already secured {target}% overall. 🎉</p>;
  }
  if (stats.needed > 100) {
    return <p className="text-sm">{target}% is no longer reachable — even 100% on everything left would fall short.</p>;
  }
  return (
    <p className="text-sm">
      To finish on <b>{target}%</b> ({classify(target)}) you need an average of <b>{mark(stats.needed)}</b> on the remaining{" "}
      {pct(1 - stats.done)} of your degree.
    </p>
  );
}

function Needed({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  if (value <= 0) return <span className="text-green-600">Secured</span>;
  if (value > 100) return <span className="text-destructive">Not reachable</span>;
  return <span>{mark(value)}</span>;
}
