// The shapes of the data we load from the database.
// Course > Year > Semester > Module > Component (an exam or coursework).

export type WeightingMode = "credits" | "percent";
export type ComponentKind = "exam" | "coursework" | "other";

export type Component = {
  id: number;
  module_id: number;
  name: string;
  kind: ComponentKind;
  weight: number; // % of the module
  grade: number | null; // your real mark (0-100)
  predicted: number | null; // a "what-if" mark (0-100)
  due_date: string | null; // "YYYY-MM-DD"
};

export type Module = {
  id: number;
  semester_id: number;
  name: string;
  credits: number | null; // used when the course is weighted by credits
  weight: number | null; // % of the year, used when the course is weighted by %
  components: Component[];
};

export type Semester = {
  id: number;
  year_id: number;
  name: string;
  position: number;
  modules: Module[];
};

export type Year = {
  id: number;
  course_id: number;
  name: string;
  position: number;
  weight: number; // % of the whole course
  total_credits: number; // e.g. 120
  semesters: Semester[];
};

export type Course = {
  id: number;
  name: string;
  weighting_mode: WeightingMode;
  target_grade: number | null;
};

export type CourseTree = Course & { years: Year[] };
