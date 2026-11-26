"use client";

// The degree tree: Degree > Years > Semesters > Modules > Exams/Coursework.
// Every row shows how much it's worth, how much is graded and your average.
// The "⋯" menu on each row lets you add, edit or delete things.

import { useState } from "react";
import {
  BookOpen,
  CalendarRange,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  MoreHorizontal,
  PenLine,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteDialog } from "@/components/delete-dialog";
import { ComponentForm } from "@/components/forms/component-form";
import { GradeForm } from "@/components/forms/grade-form";
import { ModuleForm } from "@/components/forms/module-form";
import { SemesterForm } from "@/components/forms/semester-form";
import { YearForm } from "@/components/forms/year-form";
import { classify, creditsToPercent, formatDate, mark, pct, type Stats, type StatsMap } from "@/lib/grades";
import type { Component, CourseTree as CourseTreeData, Module, Semester, Year } from "@/lib/types";
import { cn } from "@/lib/utils";

type TreeProps = { course: CourseTreeData; stats: StatsMap };

export function CourseTree({ course, stats }: TreeProps) {
  const dialogs = useDialogs<"addYear">();
  const s = stats.course;

  return (
    <div className="rounded-xl border bg-card p-2 sm:p-3">
      <TreeRow
        icon={GraduationCap}
        title={course.name}
        badge="Whole degree"
        subtitle={`${pct(s.done)} graded · banked ${pct(s.earned)} of ${pct(s.done)}`}
        stats={s}
        menu={<ItemMenu actions={[{ label: "Add year", icon: Plus, onSelect: () => dialogs.show("addYear") }]} />}
      >
        {course.years.map((year) => (
          <YearRow key={year.id} year={year} course={course} stats={stats} />
        ))}
        {course.years.length === 0 && <AddButton onClick={() => dialogs.show("addYear")}>Add a year</AddButton>}
      </TreeRow>

      <YearForm {...dialogs.props("addYear")} courseId={course.id} nextNumber={course.years.length + 1} />
    </div>
  );
}

// ---------- one row per level ----------

function YearRow({ year, course, stats }: { year: Year; course: CourseTreeData; stats: StatsMap }) {
  const dialogs = useDialogs<"add" | "edit" | "delete">();
  const s = stats[`year-${year.id}`];

  return (
    <>
      <TreeRow
        icon={CalendarRange}
        title={year.name}
        badge={`${year.weight}% of degree`}
        subtitle={describe(s)}
        stats={s}
        menu={
          <ItemMenu
            actions={[
              { label: "Add semester", icon: Plus, onSelect: () => dialogs.show("add") },
              { label: "Edit year", icon: PenLine, onSelect: () => dialogs.show("edit") },
              { label: "Delete year", icon: Trash2, onSelect: () => dialogs.show("delete"), destructive: true },
            ]}
          />
        }
      >
        {year.semesters.map((semester) => (
          <SemesterRow key={semester.id} semester={semester} year={year} course={course} stats={stats} />
        ))}
        {year.semesters.length === 0 && <AddButton onClick={() => dialogs.show("add")}>Add a semester</AddButton>}
      </TreeRow>

      <SemesterForm {...dialogs.props("add")} yearId={year.id} nextNumber={year.semesters.length + 1} />
      <YearForm {...dialogs.props("edit")} courseId={course.id} year={year} />
      <DeleteDialog {...dialogs.props("delete")} type="year" id={year.id} name={year.name} />
    </>
  );
}

function SemesterRow({ semester, year, course, stats }: { semester: Semester; year: Year; course: CourseTreeData; stats: StatsMap }) {
  const dialogs = useDialogs<"add" | "edit" | "delete">();
  const s = stats[`semester-${semester.id}`];

  return (
    <>
      <TreeRow
        icon={Layers}
        title={semester.name}
        badge={`${pct(s.share)} of year`}
        subtitle={describe(s)}
        stats={s}
        menu={
          <ItemMenu
            actions={[
              { label: "Add module", icon: Plus, onSelect: () => dialogs.show("add") },
              { label: "Rename semester", icon: PenLine, onSelect: () => dialogs.show("edit") },
              { label: "Delete semester", icon: Trash2, onSelect: () => dialogs.show("delete"), destructive: true },
            ]}
          />
        }
      >
        {semester.modules.map((module) => (
          <ModuleRow key={module.id} module={module} year={year} course={course} stats={stats} />
        ))}
        {semester.modules.length === 0 && <AddButton onClick={() => dialogs.show("add")}>Add a module</AddButton>}
      </TreeRow>

      <ModuleForm {...dialogs.props("add")} semesterId={semester.id} mode={course.weighting_mode} yearCredits={year.total_credits} />
      <SemesterForm {...dialogs.props("edit")} yearId={year.id} semester={semester} />
      <DeleteDialog {...dialogs.props("delete")} type="semester" id={semester.id} name={semester.name} />
    </>
  );
}

function ModuleRow({ module, year, course, stats }: { module: Module; year: Year; course: CourseTreeData; stats: StatsMap }) {
  const dialogs = useDialogs<"add" | "edit" | "delete">();
  const s = stats[`module-${module.id}`];
  const usedWeight = module.components.reduce((sum, c) => sum + c.weight, 0);

  // e.g. "20 credits · 16.7% of year" or "25% of year"
  const badge =
    course.weighting_mode === "credits"
      ? `${module.credits ?? "?"} credits · ${pct(creditsToPercent(module.credits ?? 0, year.total_credits) / 100)} of year`
      : module.weight === null
        ? "?% of year"
        : `${pct(module.weight / 100)} of year`;

  return (
    <>
      <TreeRow
        icon={BookOpen}
        title={module.name}
        badge={badge}
        subtitle={describe(s)}
        stats={s}
        menu={
          <ItemMenu
            actions={[
              { label: "Add exam or coursework", icon: Plus, onSelect: () => dialogs.show("add") },
              { label: "Edit module", icon: PenLine, onSelect: () => dialogs.show("edit") },
              { label: "Delete module", icon: Trash2, onSelect: () => dialogs.show("delete"), destructive: true },
            ]}
          />
        }
      >
        {module.components.map((component) => (
          <ComponentRow key={component.id} component={component} stats={stats} />
        ))}
        {usedWeight < 100 && (
          <AddButton onClick={() => dialogs.show("add")}>
            Add exam or coursework {module.components.length > 0 && `(${Math.round((100 - usedWeight) * 10) / 10}% left)`}
          </AddButton>
        )}
      </TreeRow>

      <ComponentForm {...dialogs.props("add")} moduleId={module.id} remainingWeight={100 - usedWeight} />
      <ModuleForm {...dialogs.props("edit")} semesterId={module.semester_id} mode={course.weighting_mode} yearCredits={year.total_credits} module={module} />
      <DeleteDialog {...dialogs.props("delete")} type="module" id={module.id} name={module.name} />
    </>
  );
}

function ComponentRow({ component, stats }: { component: Component; stats: StatsMap }) {
  const dialogs = useDialogs<"grade" | "edit" | "delete">();
  const s = stats[`component-${component.id}`];

  const parts = [`${pct(s.ofCourse)} of degree`, component.kind];
  if (component.due_date) parts.push(`due ${formatDate(component.due_date)}`);

  return (
    <>
      <TreeRow
        icon={FileText}
        title={component.name}
        badge={`${component.weight}% of module`}
        subtitle={parts.join(" · ")}
        stats={s}
        right={<GradeButton component={component} onClick={() => dialogs.show("grade")} />}
        menu={
          <ItemMenu
            actions={[
              { label: "Enter mark", icon: PenLine, onSelect: () => dialogs.show("grade") },
              { label: "Edit details", icon: PenLine, onSelect: () => dialogs.show("edit") },
              { label: "Delete", icon: Trash2, onSelect: () => dialogs.show("delete"), destructive: true },
            ]}
          />
        }
      />

      <GradeForm {...dialogs.props("grade")} component={component} />
      <ComponentForm {...dialogs.props("edit")} moduleId={component.module_id} component={component} />
      <DeleteDialog {...dialogs.props("delete")} type="component" id={component.id} name={component.name} />
    </>
  );
}

// ---------- building blocks ----------

type TreeRowProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge: string;
  subtitle: string;
  stats: Stats;
  menu: React.ReactNode;
  right?: React.ReactNode; // replaces the average on the right (used for marks)
  children?: React.ReactNode; // rows inside this one; leave out for exams/coursework
};

function TreeRow({ icon: Icon, title, badge, subtitle, stats, menu, right, children }: TreeRowProps) {
  const [open, setOpen] = useState(true);
  const canOpen = children !== undefined;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-muted/50">
        {canOpen ? (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={open ? "Collapse" : "Expand"}>
              <ChevronRight className={cn("transition-transform", open && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        <Icon className="size-4 shrink-0 text-muted-foreground" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-medium">{title}</span>
            <Badge variant="secondary">{badge}</Badge>
            {stats.warnings.length > 0 && <Warnings warnings={stats.warnings} />}
          </div>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>

        {right ?? <Average stats={stats} />}
        {menu}
      </div>

      {canOpen && (
        <CollapsibleContent>
          <div className="ml-4 border-l pl-2 sm:ml-5 sm:pl-3">{children}</div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

// Average on the right, with a small bar showing how much is graded.
function Average({ stats }: { stats: Stats }) {
  const grade = classify(stats.average);
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="hidden w-20 sm:block">
        <Progress value={stats.done * 100} />
      </div>
      <div className="w-16 text-right">
        <div className="font-semibold tabular-nums">{mark(stats.average)}</div>
        {grade && <div className="text-xs text-muted-foreground">{grade}</div>}
      </div>
    </div>
  );
}

// The mark for one exam/coursework. Click it to enter or change the mark.
function GradeButton({ component, onClick }: { component: Component; onClick: () => void }) {
  let label = "Add mark";
  if (component.grade !== null) label = mark(component.grade);
  else if (component.predicted !== null) label = `~${mark(component.predicted)}`;

  return (
    <Button
      variant={component.grade !== null ? "secondary" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("w-[5.5rem] shrink-0 tabular-nums", component.grade === null && "text-muted-foreground")}
      title={component.grade === null && component.predicted !== null ? "What-if mark (not a real grade)" : undefined}
    >
      {label}
    </Button>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TriangleAlert className="size-4 text-amber-500" aria-label="Warning" />
      </TooltipTrigger>
      <TooltipContent>
        {warnings.map((w) => (
          <p key={w}>{w}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

type MenuAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  destructive?: boolean;
};

function ItemMenu({ actions }: { actions: MenuAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More options">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <div key={action.label}>
            {action.destructive && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={action.onSelect} variant={action.destructive ? "destructive" : "default"}>
              <action.icon />
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="my-1 ml-7 text-muted-foreground">
      <Plus />
      {children}
    </Button>
  );
}

// ---------- helpers ----------

// Keeps track of which popup (if any) is open on a row.
function useDialogs<Name extends string>() {
  const [openName, setOpenName] = useState<Name | null>(null);
  return {
    show: (name: Name) => setOpenName(name),
    props: (name: Name) => ({
      open: openName === name,
      onOpenChange: (open: boolean) => setOpenName(open ? name : null),
    }),
  };
}

// e.g. "1.67% of degree · 40% graded · banked 0.5% of 0.67% · 60% set up"
function describe(s: Stats) {
  const parts = [`${pct(s.ofCourse)} of degree`, `${pct(s.done)} graded`];
  if (s.done > 0) parts.push(`banked ${pct(s.earned * s.ofCourse)} of ${pct(s.done * s.ofCourse)}`);
  if (s.defined < 0.999) parts.push(`${pct(s.defined)} set up`);
  return parts.join(" · ");
}
