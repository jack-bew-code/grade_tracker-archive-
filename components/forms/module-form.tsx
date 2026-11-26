"use client";

import { saveModule } from "@/lib/actions";
import type { Module, WeightingMode } from "@/lib/types";
import { Field, FormDialog } from "./form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: number;
  mode: WeightingMode;
  yearCredits: number;
  module?: Module;
};

export function ModuleForm({ open, onOpenChange, semesterId, mode, yearCredits, module }: Props) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={module ? "Edit module" : "Add a module"} action={saveModule}>
      <input type="hidden" name="id" value={module?.id ?? ""} />
      <input type="hidden" name="semester_id" value={semesterId} />
      <Field label="Module name" name="name" defaultValue={module?.name} placeholder="e.g. Programming Fundamentals" required />

      {/* Only one of these is used, depending on how the course is weighted.
          The other is kept as-is so switching modes later still works. */}
      {mode === "credits" ? (
        <>
          <Field
            label="Credits"
            name="credits"
            type="number"
            step="any"
            min={0}
            defaultValue={module?.credits ?? 20}
            hint={`Out of ${yearCredits} credits in this year.`}
            required
          />
          <input type="hidden" name="weight" value={module?.weight ?? ""} />
        </>
      ) : (
        <>
          <Field
            label="Weight (% of the year)"
            name="weight"
            type="number"
            step="any"
            min={0}
            max={100}
            defaultValue={module?.weight ?? ""}
            required
          />
          <input type="hidden" name="credits" value={module?.credits ?? ""} />
        </>
      )}
    </FormDialog>
  );
}
