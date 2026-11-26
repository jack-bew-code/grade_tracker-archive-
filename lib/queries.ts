// Reading data from the database.
import { getSql } from "./db";
import type { Component, Course, CourseTree, Module, Semester, Year } from "./types";

export async function getCourses(): Promise<Course[]> {
  const sql = getSql();
  const rows = await sql`SELECT id, name, weighting_mode, target_grade FROM courses ORDER BY created_at`;
  return rows as Course[];
}

// Loads one course with everything inside it, nested:
// course.years[].semesters[].modules[].components[]
export async function getCourseTree(courseId: number): Promise<CourseTree | null> {
  const sql = getSql();

  const courses = (await sql`
    SELECT id, name, weighting_mode, target_grade FROM courses WHERE id = ${courseId}
  `) as Course[];
  if (courses.length === 0) return null;

  const years = (await sql`
    SELECT * FROM years WHERE course_id = ${courseId} ORDER BY position, id
  `) as Omit<Year, "semesters">[];

  const semesters = (await sql`
    SELECT s.* FROM semesters s
    JOIN years y ON y.id = s.year_id
    WHERE y.course_id = ${courseId}
    ORDER BY s.position, s.id
  `) as Omit<Semester, "modules">[];

  const modules = (await sql`
    SELECT m.* FROM modules m
    JOIN semesters s ON s.id = m.semester_id
    JOIN years y ON y.id = s.year_id
    WHERE y.course_id = ${courseId}
    ORDER BY m.id
  `) as Omit<Module, "components">[];

  const components = (await sql`
    SELECT c.id, c.module_id, c.name, c.kind, c.weight, c.grade, c.predicted, c.due_date::text AS due_date
    FROM components c
    JOIN modules m ON m.id = c.module_id
    JOIN semesters s ON s.id = m.semester_id
    JOIN years y ON y.id = s.year_id
    WHERE y.course_id = ${courseId}
    ORDER BY c.due_date NULLS LAST, c.id
  `) as Component[];

  // Put the flat lists together into a tree.
  return {
    ...courses[0],
    years: years.map((year) => ({
      ...year,
      semesters: semesters
        .filter((s) => s.year_id === year.id)
        .map((semester) => ({
          ...semester,
          modules: modules
            .filter((m) => m.semester_id === semester.id)
            .map((module) => ({
              ...module,
              components: components.filter((c) => c.module_id === module.id),
            })),
        })),
    })),
  };
}
