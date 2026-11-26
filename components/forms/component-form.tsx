"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveComponent } from "@/lib/actions";
import type { Component } from "@/lib/types";
import { Field, FormDialog } from "./form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: number;
  component?: Component;
  remainingWeight?: number; // suggested weight for a new one
};

export function ComponentForm({ open, onOpenChange, moduleId, component, remainingWeight = 100 }: Props) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={component ? "Edit exam / coursework" : "Add exam or coursework"}
      action={saveComponent}
    >
      <input type="hidden" name="id" value={component?.id ?? ""} />
      <input type="hidden" name="module_id" value={moduleId} />
      <Field label="Name" name="name" defaultValue={component?.name} placeholder="e.g. Coursework 1" required />

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select name="kind" defaultValue={component?.kind ?? "coursework"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coursework">Coursework</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field
          label="Weight (% of module)"
          name="weight"
          type="number"
          step="any"
          min={0}
          max={100}
          defaultValue={component?.weight ?? Math.max(0, Math.round(remainingWeight * 10) / 10)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Your mark (%)" name="grade" type="number" step="any" min={0} max={100} defaultValue={component?.grade ?? ""} hint="Leave blank until you get it back." />
        <Field label="What-if mark (%)" name="predicted" type="number" step="any" min={0} max={100} defaultValue={component?.predicted ?? ""} hint="A guess, for planning." />
      </div>

      <Field label="Due date" name="due_date" type="date" defaultValue={component?.due_date ?? ""} />
    </FormDialog>
  );
}
