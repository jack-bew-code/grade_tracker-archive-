"use server";

// Every change to the database goes through one of these Server Actions.
// Each one: 1) checks the form data with zod, 2) runs the SQL, 3) refreshes the pages.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSql } from "./db";
import type { WeightingMode } from "./types";

export type ActionResult = { error?: string };

// ---------- helpers for reading form fields ----------

// "" -> null, "65" -> 65
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number({ invalid_type_error: "Must be a number" }).min(0, "Can't be negative").nullable(),
);
const optionalMark = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number({ invalid_type_error: "Must be a number" }).min(0, "Marks are 0-100").max(100, "Marks are 0-100").nullable(),
);
const percent = z.coerce.number().min(0, "Must be 0-100").max(100, "Must be 0-100");
const name = z.string().trim().min(1, "Please give it a name");
const id = z.coerce.number().int().positive();
const optionalId = z.preprocess((v) => (v === "" || v === null ? undefined : v), id.optional());

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function firstError(error: z.ZodError): ActionResult {
  return { error: error.issues[0]?.message ?? "Something is wrong with the form" };
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- course ----------

const setupSchema = z.object({
  name,
  weighting_mode: z.enum(["credits", "percent"]),
  target_grade: optionalMark,
  semesters_per_year: z.coerce.number().int().min(0).max(6),
  years: z
    .array(z.object({ name, weight: percent, total_credits: z.coerce.number().int().min(0) }))
    .min(1, "Add at least one year"),
});

// Used by the setup page. Creates the course, its years and empty semesters.
export async function createCourse(formData: FormData): Promise<ActionResult> {
  const parsed = setupSchema.safeParse({ ...fields(formData), years: JSON.parse(String(formData.get("years") ?? "[]")) });
  if (!parsed.success) return firstError(parsed.error);
  const data = parsed.data;
  const sql = getSql();

  const [course] = await sql`
    INSERT INTO courses (name, weighting_mode, target_grade)
    VALUES (${data.name}, ${data.weighting_mode}, ${data.target_grade})
    RETURNING id
  `;

  for (const [i, year] of data.years.entries()) {
    const [row] = await sql`
      INSERT INTO years (course_id, name, position, weight, total_credits)
      VALUES (${course.id}, ${year.name}, ${i}, ${year.weight}, ${year.total_credits})
      RETURNING id
    `;
    for (let s = 1; s <= data.semesters_per_year; s++) {
      await sql`INSERT INTO semesters (year_id, name, position) VALUES (${row.id}, ${`Semester ${s}`}, ${s})`;
    }
  }

  refresh();
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id, name, target_grade: optionalMark }).safeParse(fields(formData));
  if (!parsed.success) return firstError(parsed.error);
  const { id: courseId, name: courseName, target_grade } = parsed.data;

  await getSql()`UPDATE courses SET name = ${courseName}, target_grade = ${target_grade} WHERE id = ${courseId}`;
  refresh();
  return {};
}

export async function setTargetGrade(courseId: number, target: number | null): Promise<ActionResult> {
  const parsed = optionalMark.safeParse(target);
  if (!parsed.success) return firstError(parsed.error);
  await getSql()`UPDATE courses SET target_grade = ${parsed.data} WHERE id = ${courseId}`;
  refresh();
  return {};
}

// Switch between "credits" and "percent" weighting, converting every module's value
// so the grades stay exactly the same.
export async function setWeightingMode(courseId: number, mode: WeightingMode): Promise<ActionResult> {
  const sql = getSql();

  if (mode === "percent") {
    // 20 credits of a 120 credit year -> 16.67%
    await sql`
      UPDATE modules m SET weight = m.credits / y.total_credits * 100
      FROM semesters s JOIN years y ON y.id = s.year_id
      WHERE m.semester_id = s.id AND y.course_id = ${courseId}
        AND m.credits IS NOT NULL AND y.total_credits > 0
    `;
  } else {
    // 16.67% of a 120 credit year -> 20 credits
    await sql`
      UPDATE modules m SET credits = ROUND((m.weight / 100 * y.total_credits)::numeric)
      FROM semesters s JOIN years y ON y.id = s.year_id
      WHERE m.semester_id = s.id AND y.course_id = ${courseId}
        AND m.weight IS NOT NULL
    `;
  }

  await sql`UPDATE courses SET weighting_mode = ${mode} WHERE id = ${courseId}`;
  refresh();
  return {};
}

export async function deleteCourse(courseId: number) {
  await getSql()`DELETE FROM courses WHERE id = ${courseId}`;
  refresh();
  redirect("/");
}

// ---------- year / semester / module / component ----------
// Each "save" function edits the item if the form has an "id", otherwise it adds a new one.

export async function saveYear(formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({ id: optionalId, course_id: optionalId, name, weight: percent, total_credits: z.coerce.number().int().min(0) })
    .safeParse(fields(formData));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;
  const sql = getSql();

  if (d.id) {
    await sql`UPDATE years SET name = ${d.name}, weight = ${d.weight}, total_credits = ${d.total_credits} WHERE id = ${d.id}`;
  } else {
    await sql`
      INSERT INTO years (course_id, name, weight, total_credits, position)
      VALUES (${d.course_id}, ${d.name}, ${d.weight}, ${d.total_credits},
              (SELECT COALESCE(MAX(position) + 1, 0) FROM years WHERE course_id = ${d.course_id}))
    `;
  }
  refresh();
  return {};
}

export async function saveSemester(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id: optionalId, year_id: optionalId, name }).safeParse(fields(formData));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;
  const sql = getSql();

  if (d.id) {
    await sql`UPDATE semesters SET name = ${d.name} WHERE id = ${d.id}`;
  } else {
    await sql`
      INSERT INTO semesters (year_id, name, position)
      VALUES (${d.year_id}, ${d.name},
              (SELECT COALESCE(MAX(position) + 1, 0) FROM semesters WHERE year_id = ${d.year_id}))
    `;
  }
  refresh();
  return {};
}

export async function saveModule(formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({ id: optionalId, semester_id: optionalId, name, credits: optionalNumber, weight: optionalNumber })
    .safeParse(fields(formData));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;
  const sql = getSql();

  if (d.id) {
    await sql`UPDATE modules SET name = ${d.name}, credits = ${d.credits}, weight = ${d.weight} WHERE id = ${d.id}`;
  } else {
    await sql`
      INSERT INTO modules (semester_id, name, credits, weight)
      VALUES (${d.semester_id}, ${d.name}, ${d.credits}, ${d.weight})
    `;
  }
  refresh();
  return {};
}

export async function saveComponent(formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      id: optionalId,
      module_id: optionalId,
      name,
      kind: z.enum(["exam", "coursework", "other"]),
      weight: percent,
      grade: optionalMark,
      predicted: optionalMark,
      due_date: z.preprocess((v) => (v === "" ? null : v), z.string().date().nullable()),
    })
    .safeParse(fields(formData));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;
  const sql = getSql();

  if (d.id) {
    await sql`
      UPDATE components
      SET name = ${d.name}, kind = ${d.kind}, weight = ${d.weight},
          grade = ${d.grade}, predicted = ${d.predicted}, due_date = ${d.due_date}
      WHERE id = ${d.id}
    `;
  } else {
    await sql`
      INSERT INTO components (module_id, name, kind, weight, grade, predicted, due_date)
      VALUES (${d.module_id}, ${d.name}, ${d.kind}, ${d.weight}, ${d.grade}, ${d.predicted}, ${d.due_date})
    `;
  }
  refresh();
  return {};
}

// Quick grade entry: only the real mark and the what-if mark.
export async function saveGrade(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id, grade: optionalMark, predicted: optionalMark }).safeParse(fields(formData));
  if (!parsed.success) return firstError(parsed.error);
  const d = parsed.data;

  await getSql()`UPDATE components SET grade = ${d.grade}, predicted = ${d.predicted} WHERE id = ${d.id}`;
  refresh();
  return {};
}

export type ItemType = "year" | "semester" | "module" | "component";

// Deleting something also deletes everything inside it.
export async function deleteItem(type: ItemType, itemId: number): Promise<ActionResult> {
  const sql = getSql();
  if (type === "year") await sql`DELETE FROM years WHERE id = ${itemId}`;
  if (type === "semester") await sql`DELETE FROM semesters WHERE id = ${itemId}`;
  if (type === "module") await sql`DELETE FROM modules WHERE id = ${itemId}`;
  if (type === "component") await sql`DELETE FROM components WHERE id = ${itemId}`;
  refresh();
  return {};
}
