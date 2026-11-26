"use client";

import { saveSemester } from "@/lib/actions";
import type { Semester } from "@/lib/types";
import { Field, FormDialog } from "./form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yearId: number;
  semester?: Semester;
  nextNumber?: number;
};

export function SemesterForm({ open, onOpenChange, yearId, semester, nextNumber = 1 }: Props) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={semester ? "Edit semester" : "Add a semester"}
      description="Semesters just group modules — they don't change any weights. Use 'Full year' for year-long modules."
      action={saveSemester}
    >
      <input type="hidden" name="id" value={semester?.id ?? ""} />
      <input type="hidden" name="year_id" value={yearId} />
      <Field label="Name" name="name" defaultValue={semester?.name ?? `Semester ${nextNumber}`} required />
    </FormDialog>
  );
}
