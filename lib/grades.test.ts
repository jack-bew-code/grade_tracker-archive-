// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCourse, creditsToPercent, neededForTarget, percentToCredits, classify } from "./grades.ts";
import type { Component, CourseTree, Module, Year } from "./types.ts";

// --- tiny helpers to build test data ---
let nextId = 1;
function comp(weight: number, grade: number | null, predicted: number | null = null): Component {
  return { id: nextId++, module_id: 0, name: "c", kind: "exam", weight, grade, predicted, due_date: null };
}
function mod(credits: number | null, components: Component[], weight: number | null = null): Module {
  return { id: nextId++, semester_id: 0, name: "m", credits, weight, components };
}
function year(weight: number, totalCredits: number, modules: Module[]): Year {
  return {
    id: nextId++,
    course_id: 0,
    name: "y",
    position: 0,
    weight,
    total_credits: totalCredits,
    semesters: [{ id: nextId++, year_id: 0, name: "s", position: 0, modules }],
  };
}
function course(years: Year[], target: number | null = null, mode: "credits" | "percent" = "credits"): CourseTree {
  return { id: 1, name: "BSc", weighting_mode: mode, target_grade: target, years };
}
const close = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("matches the old calculator.py example (72.5%)", () => {
  const c = course([
    year(10, 30, [mod(15, [comp(100, 70)]), mod(15, [comp(100, 90)])]),
    year(30, 60, [mod(30, [comp(100, 60)]), mod(30, [comp(100, 50)])]),
    year(60, 60, [mod(60, [comp(100, 80)])]),
  ]);
  const stats = calculateCourse(c);
  close(stats.course.average, 72.5);
  close(stats.course.done, 1);
  close(stats[`year-${c.years[0].id}`].average, 80);
  close(stats[`year-${c.years[1].id}`].average, 55);
});

test("partial structure: only part of year 1 known", () => {
  // Year 1 is 10% of the degree, 120 credits. One 20-credit module, its 40% coursework got 75.
  const cw = comp(40, 75);
  const exam = comp(60, null);
  const m = mod(20, [cw, exam]);
  const c = course([year(10, 120, [m]), year(30, 120, []), year(60, 120, [])]);
  const stats = calculateCourse(c);

  const moduleOfCourse = 0.1 * (20 / 120);
  close(stats[`module-${m.id}`].ofCourse, moduleOfCourse);
  close(stats[`component-${cw.id}`].ofCourse, moduleOfCourse * 0.4);

  // "x% earned of y% of the degree so far"
  close(stats.course.done, moduleOfCourse * 0.4);
  close(stats.course.earned, moduleOfCourse * 0.4 * 0.75);
  close(stats.course.average, 75);
  close(stats[`module-${m.id}`].average, 75);
  close(stats[`module-${m.id}`].done, 0.4);
  close(stats[`year-${c.years[0].id}`].defined, 20 / 120);
});

test("percent mode gives the same answer as credits mode", () => {
  const build = (mode: "credits" | "percent") =>
    course([year(100, 120, [mod(20, [comp(100, 60)], 20 / 1.2), mod(40, [comp(100, 80)], 40 / 1.2)])], null, mode);
  const a = calculateCourse(build("credits")).course;
  const b = calculateCourse(build("percent")).course;
  close(a.average, b.average!);
  close(a.done, b.done);
});

test("credits <-> percent conversion round trip", () => {
  close(creditsToPercent(20, 120), 100 / 6);
  assert.equal(percentToCredits(creditsToPercent(20, 120), 120), 20);
  assert.equal(percentToCredits(25, 120), 30);
  assert.equal(creditsToPercent(10, 0), 0);
});

test("needed-for-target maths", () => {
  assert.equal(neededForTarget(70, 0, 0), 70); // nothing graded: need the target itself
  assert.equal(neededForTarget(70, 1, 0.8), null); // everything graded: nothing left
  close(neededForTarget(70, 0.5, 0.3), 80); // 30 of 50 so far -> need 80 on the rest
  assert.ok(neededForTarget(70, 0.9, 0.5)! > 100); // not achievable
  assert.ok(neededForTarget(40, 0.5, 0.45)! <= 0); // already secured
  assert.equal(neededForTarget(null, 0.5, 0.3), null);
});

test("target is applied at every level", () => {
  const c = course([year(100, 120, [mod(120, [comp(50, 60), comp(50, null)])])], 70);
  const stats = calculateCourse(c);
  close(stats.course.needed, 80);
});

test("what-if uses predicted marks only where there's no real grade", () => {
  const real = comp(50, 60, 99);
  const guess = comp(50, null, 80);
  const c = course([year(100, 120, [mod(120, [real, guess])])]);
  close(calculateCourse(c).course.average, 60);
  close(calculateCourse(c).course.done, 0.5);
  close(calculateCourse(c, { whatIf: true }).course.average, 70);
  close(calculateCourse(c, { whatIf: true }).course.done, 1);
});

test("warnings for impossible weights", () => {
  const m = mod(150, [comp(70, null), comp(50, null)]);
  const c = course([year(50, 120, [m])]);
  const stats = calculateCourse(c);
  assert.equal(stats[`module-${m.id}`].warnings.length, 1);
  assert.equal(stats[`year-${c.years[0].id}`].warnings.length, 1);
  assert.equal(stats.course.warnings.length, 1);
});

test("classification bands", () => {
  assert.equal(classify(72), "First");
  assert.equal(classify(65), "2:1");
  assert.equal(classify(55), "2:2");
  assert.equal(classify(45), "Third");
  assert.equal(classify(20), "Fail");
  assert.equal(classify(null), null);
});
