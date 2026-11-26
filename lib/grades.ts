// All the grade maths lives here. No database, no React — just numbers.
//
// The big idea: every item in the tree is worth a FRACTION of its parent.
//   year      -> weight / 100 of the course
//   module    -> credits / year credits   (or weight / 100 when using %)
//   semester  -> the sum of its modules (semesters just group modules)
//   component -> weight / 100 of the module
//
// For every item we work out:
//   done    = how much of it has a grade      (0 to 1)
//   earned  = how much of it you have scored  (0 to 1)
//   average = earned / done, as a %
// Multiplying by "ofCourse" turns these into "% of the whole degree".

import type { CourseTree, Module, WeightingMode, Year } from "./types";

export type Stats = {
  share: number; // fraction of the parent (0-1)
  ofCourse: number; // fraction of the whole course (0-1)
  defined: number; // fraction of this item that has been set up (0-1)
  done: number; // fraction of this item that has a grade (0-1)
  earned: number; // fraction of this item's marks you have (0-1)
  average: number | null; // average % on graded work, null if nothing graded
  needed: number | null; // % average needed on the rest to hit the target
  warnings: string[];
};

// Stats for every item, looked up by key: "course", "year-1", "semester-4", "module-7", "component-12"
export type StatsMap = Record<string, Stats>;

type Options = { whatIf?: boolean };

// ---------- small helpers ----------

export function classify(average: number | null): string | null {
  if (average === null) return null;
  if (average >= 70) return "First";
  if (average >= 60) return "2:1";
  if (average >= 50) return "2:2";
  if (average >= 40) return "Third";
  return "Fail";
}

// The average you need on everything not yet graded to reach the target.
export function neededForTarget(target: number | null, done: number, earned: number): number | null {
  if (target === null) return null;
  if (done >= 0.99999) return null; // nothing left to sit
  return (target - earned * 100) / (1 - done);
}

export function creditsToPercent(credits: number, totalCredits: number): number {
  if (!totalCredits) return 0;
  return (credits / totalCredits) * 100;
}

export function percentToCredits(percent: number, totalCredits: number): number {
  return Math.round((percent / 100) * totalCredits);
}

// How much of its year a module is worth (0-1).
export function moduleShareOfYear(module: Module, year: Year, mode: WeightingMode): number {
  if (mode === "credits") {
    if (!year.total_credits) return 0;
    return (module.credits ?? 0) / year.total_credits;
  }
  return (module.weight ?? 0) / 100;
}

// Combine children into a parent: each child counts by its share.
function combine(children: { share: number; stats: Stats }[]) {
  let defined = 0;
  let done = 0;
  let earned = 0;
  for (const child of children) {
    defined += child.share * child.stats.defined;
    done += child.share * child.stats.done;
    earned += child.share * child.stats.earned;
  }
  return { defined, done, earned };
}

function makeStats(share: number, parts: { defined: number; done: number; earned: number }, target: number | null, warnings: string[]): Stats {
  return {
    share,
    ofCourse: 0, // filled in afterwards, once we know the parent's size
    defined: parts.defined,
    done: parts.done,
    earned: parts.earned,
    average: parts.done > 0 ? (parts.earned / parts.done) * 100 : null,
    needed: neededForTarget(target, parts.done, parts.earned),
    warnings,
  };
}

// ---------- the main calculation ----------

export function calculateCourse(course: CourseTree, options: Options = {}): StatsMap {
  const map: StatsMap = {};
  const target = course.target_grade;
  const mode = course.weighting_mode;

  const years = course.years.map((year) => {
    const yearShare = year.weight / 100;

    const semesters = year.semesters.map((semester) => {
      // How big each module is within the year, then the semester is the total.
      const moduleShares = semester.modules.map((m) => moduleShareOfYear(m, year, mode));
      const semesterShare = moduleShares.reduce((a, b) => a + b, 0);

      const modules = semester.modules.map((module, i) => {
        const components = module.components.map((c) => {
          // With "what-if" on, a predicted mark fills in where there is no real grade yet.
          const score = options.whatIf ? (c.grade ?? c.predicted) : c.grade;
          const stats = makeStats(
            c.weight / 100,
            { defined: 1, done: score !== null ? 1 : 0, earned: score !== null ? score / 100 : 0 },
            target,
            [],
          );
          map[`component-${c.id}`] = stats;
          return { id: c.id, share: c.weight / 100, stats };
        });

        const warnings: string[] = [];
        const componentTotal = module.components.reduce((sum, c) => sum + c.weight, 0);
        if (componentTotal > 100.001) warnings.push(`Exams/coursework add up to ${round(componentTotal)}% (should be 100%)`);
        if (mode === "credits" && module.credits === null) warnings.push("No credits set");
        if (mode === "percent" && module.weight === null) warnings.push("No weight set");

        const shareOfSemester = semesterShare > 0 ? moduleShares[i] / semesterShare : 0;
        const stats = makeStats(shareOfSemester, combine(components), target, warnings);
        map[`module-${module.id}`] = stats;
        return { id: module.id, share: shareOfSemester, stats, components };
      });

      const stats = makeStats(semesterShare, combine(modules), target, []);
      map[`semester-${semester.id}`] = stats;
      return { id: semester.id, share: semesterShare, stats, modules };
    });

    const warnings: string[] = [];
    const allModules = year.semesters.flatMap((s) => s.modules);
    if (mode === "credits") {
      const credits = allModules.reduce((sum, m) => sum + (m.credits ?? 0), 0);
      if (credits > year.total_credits) warnings.push(`Modules add up to ${round(credits)} credits but the year has ${year.total_credits}`);
    } else {
      const percent = allModules.reduce((sum, m) => sum + (m.weight ?? 0), 0);
      if (percent > 100.001) warnings.push(`Modules add up to ${round(percent)}% of the year (should be 100%)`);
    }

    const stats = makeStats(yearShare, combine(semesters), target, warnings);
    map[`year-${year.id}`] = stats;
    return { id: year.id, share: yearShare, stats, semesters };
  });

  const warnings: string[] = [];
  const yearTotal = course.years.reduce((sum, y) => sum + y.weight, 0);
  if (course.years.length > 0 && Math.abs(yearTotal - 100) > 0.001) warnings.push(`Years add up to ${round(yearTotal)}% (should be 100%)`);

  const courseStats = makeStats(1, combine(years), target, warnings);
  courseStats.ofCourse = 1;
  map.course = courseStats;

  // Second pass: work out how much of the whole course each item is worth.
  for (const y of years) {
    y.stats.ofCourse = y.share;
    for (const s of y.semesters) {
      s.stats.ofCourse = y.stats.ofCourse * s.share;
      for (const m of s.modules) {
        m.stats.ofCourse = s.stats.ofCourse * m.share;
        for (const c of m.components) {
          c.stats.ofCourse = m.stats.ofCourse * c.share;
        }
      }
    }
  }

  return map;
}

// ---------- formatting ----------

function round(n: number) {
  return Math.round(n * 10) / 10;
}

// 0.0342 -> "3.4%"  (small numbers get an extra decimal place)
export function pct(fraction: number): string {
  const value = fraction * 100;
  if (value !== 0 && Math.abs(value) < 1) return `${value.toFixed(2)}%`;
  return `${round(value)}%`;
}

// 67.25 -> "67.3%"
export function mark(value: number | null): string {
  return value === null ? "—" : `${round(value)}%`;
}

// "2026-12-05" -> "5 Dec 2026"
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
