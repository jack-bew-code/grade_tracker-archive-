"use client";

// The "Settings" button on a course: rename, target, weighting mode and delete.

import { useState } from "react";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Field, FormDialog } from "@/components/forms/form-dialog";
import { deleteCourse, setWeightingMode, updateCourse } from "@/lib/actions";
import type { Course, WeightingMode } from "@/lib/types";

export function CourseSettings({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<WeightingMode | null>(null);

  async function confirmModeChange() {
    if (!pendingMode) return;
    const result = await setWeightingMode(course.id, pendingMode);
    if (result.error) toast.error(result.error);
    else toast.success(pendingMode === "credits" ? "Now weighting modules by credits" : "Now weighting modules by %");
    setPendingMode(null);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Settings />
        Settings
      </Button>

      <FormDialog open={open} onOpenChange={setOpen} title="Course settings" action={updateCourse}>
        <input type="hidden" name="id" value={course.id} />
        <Field label="Course name" name="name" defaultValue={course.name} required />
        <Field
          label="Target grade (%)"
          name="target_grade"
          type="number"
          step="any"
          min={0}
          max={100}
          defaultValue={course.target_grade ?? ""}
          hint="e.g. 70 for a First. Leave blank for no target."
        />

        <Separator />

        <div className="grid gap-2">
          <Label>How are modules weighted?</Label>
          {/* Changing this converts every module straight away (with a confirm). */}
          <RadioGroup value={course.weighting_mode} onValueChange={(v) => setPendingMode(v as WeightingMode)}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="credits" id="mode-credits" />
              <Label htmlFor="mode-credits" className="font-normal">
                By credits (e.g. a 20 credit module in a 120 credit year)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="percent" id="mode-percent" />
              <Label htmlFor="mode-percent" className="font-normal">
                By % of the year
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" className="justify-self-start">
              Delete course
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {course.name}?</AlertDialogTitle>
              <AlertDialogDescription>Every year, module and mark in this course will be deleted. This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => deleteCourse(course.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FormDialog>

      <AlertDialog open={pendingMode !== null} onOpenChange={(o) => !o && setPendingMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {pendingMode === "credits" ? "credits" : "% weighting"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode === "percent"
                ? "Each module's credits will be turned into a % of its year (20 of 120 credits → 16.7%)."
                : "Each module's % will be turned into credits using the year's total (16.7% of 120 → 20 credits, rounded)."}{" "}
              Your grades stay the same.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeChange}>Switch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
