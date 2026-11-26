// Adds an example course to one user's account.
// Run with: npm run db:seed -- <clerk user id>     e.g. npm run db:seed -- user_2abc...
// (Find your user id in the Clerk dashboard under Users.)
import { neon } from "@neondatabase/serverless";

const userId = process.argv[2];
if (!userId?.startsWith("user_")) {
  console.error("Give the Clerk user id to add the example course to: npm run db:seed -- user_...");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const [course] = await sql`
  INSERT INTO courses (name, weighting_mode, target_grade, user_id)
  VALUES ('BSc Computer Science (example)', 'credits', 70, ${userId})
  RETURNING id
`;

async function addYear(name, position, weight) {
  const [y] = await sql`
    INSERT INTO years (course_id, name, position, weight, total_credits)
    VALUES (${course.id}, ${name}, ${position}, ${weight}, 120) RETURNING id
  `;
  return y.id;
}
async function addSemester(yearId, name, position) {
  const [s] = await sql`INSERT INTO semesters (year_id, name, position) VALUES (${yearId}, ${name}, ${position}) RETURNING id`;
  return s.id;
}
async function addModule(semesterId, name, credits) {
  const [m] = await sql`INSERT INTO modules (semester_id, name, credits) VALUES (${semesterId}, ${name}, ${credits}) RETURNING id`;
  return m.id;
}
async function addComponent(moduleId, name, kind, weight, grade = null, predicted = null, dueDate = null) {
  await sql`
    INSERT INTO components (module_id, name, kind, weight, grade, predicted, due_date)
    VALUES (${moduleId}, ${name}, ${kind}, ${weight}, ${grade}, ${predicted}, ${dueDate})
  `;
}

// Year 1 — counts 10%. Semester 1 is mostly known, semester 2 only partly.
const y1 = await addYear("Year 1", 0, 10);
const y1s1 = await addSemester(y1, "Semester 1", 1);
const y1s2 = await addSemester(y1, "Semester 2", 2);

const prog = await addModule(y1s1, "Programming Fundamentals", 20);
await addComponent(prog, "Coursework 1", "coursework", 20, 82, null, "2026-10-24");
await addComponent(prog, "Coursework 2", "coursework", 20, null, 75, "2026-12-05");
await addComponent(prog, "Final exam", "exam", 60, null, 68, "2027-01-15");

const maths = await addModule(y1s1, "Discrete Maths", 20);
await addComponent(maths, "Problem sheets", "coursework", 30, 71, null, "2026-11-14");
await addComponent(maths, "Exam", "exam", 70, null, 65, "2027-01-12");

const sys = await addModule(y1s1, "Computer Systems", 20);
await addComponent(sys, "Lab report", "coursework", 40, null, null, "2026-12-12");

await addModule(y1s2, "Databases", 20);

// Years 2 and 3 — weights known, nothing else yet.
const y2 = await addYear("Year 2", 1, 30);
await addSemester(y2, "Semester 1", 1);
await addSemester(y2, "Semester 2", 2);
await addYear("Year 3", 2, 60);

console.log(`Added example course with id ${course.id}.`);
