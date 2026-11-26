"use client";

import { saveGrade } from "@/lib/actions";
import type { Component } from "@/lib/types";
import { Field, FormDialog } from "./form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: Component;
};

export function GradeForm({ open, onOpenChange, component }: Props) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`Mark for ${component.name}`} action={saveGrade}>
      <input type="hidden" name="id" value={component.id} />
      <Field label="Your mark (%)" name="grade" type="number" step="any" min={0} max={100} defaultValue={component.grade ?? ""} autoFocus hint="Leave blank if you haven't had it back yet." />
      <Field label="What-if mark (%)" name="predicted" type="number" step="any" min={0} max={100} defaultValue={component.predicted ?? ""} hint="Used when 'What-if' is switched on and there's no real mark." />
    </FormDialog>
  );
}
