"use client";

import { saveYear } from "@/lib/actions";
import type { Year } from "@/lib/types";
import { Field, FormDialog } from "./form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  year?: Year; // pass a year to edit it, leave out to add a new one
  nextNumber?: number;
};

export function YearForm({ open, onOpenChange, courseId, year, nextNumber = 1 }: Props) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={year ? "Edit year" : "Add a year"} action={saveYear}>
      <input type="hidden" name="id" value={year?.id ?? ""} />
      <input type="hidden" name="course_id" value={courseId} />
      <Field label="Name" name="name" defaultValue={year?.name ?? `Year ${nextNumber}`} required />
      <Field
        label="Weight (% of the whole degree)"
        name="weight"
        type="number"
        step="any"
        min={0}
        max={100}
        defaultValue={year?.weight ?? 0}
        hint="e.g. first year 10%, second 30%, final 60%. Use 0 if the year doesn't count."
        required
      />
      <Field
        label="Total credits in the year"
        name="total_credits"
        type="number"
        min={0}
        defaultValue={year?.total_credits ?? 120}
        hint="Used to work out how much each module is worth, even before you've added them all."
        required
      />
    </FormDialog>
  );
}
