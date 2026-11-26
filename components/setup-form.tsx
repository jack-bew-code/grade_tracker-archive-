"use client";

// The setup page form. Only asks for the big picture:
// course name, how many years, what each year is worth.
// Modules and exams are added later from the tree, as you find out about them.

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, SubmitButton } from "@/components/forms/form-dialog";
import { createCourse } from "@/lib/actions";

type YearInput = { name: string; weight: number; total_credits: number };

// Sensible starting weights for common course lengths.
const DEFAULT_WEIGHTS: Record<number, number[]> = {
  1: [100],
  2: [40, 60],
  3: [10, 30, 60],
  4: [10, 20, 30, 40],
  5: [10, 15, 20, 25, 30],
};

function defaultYears(count: number): YearInput[] {
  const weights = DEFAULT_WEIGHTS[count] ?? Array(count).fill(Math.round(100 / count));
  return weights.map((weight, i) => ({ name: `Year ${i + 1}`, weight, total_credits: 120 }));
}

export function SetupForm() {
  const [years, setYears] = useState<YearInput[]>(defaultYears(3));
  const total = years.reduce((sum, y) => sum + (Number(y.weight) || 0), 0);

  function changeYearCount(count: number) {
    if (count >= 1 && count <= 6) setYears(defaultYears(count));
  }

  function updateYear(index: number, changes: Partial<YearInput>) {
    setYears(years.map((y, i) => (i === index ? { ...y, ...changes } : y)));
  }

  async function handleSubmit(formData: FormData) {
    formData.set("years", JSON.stringify(years));
    const result = await createCourse(formData); // goes to the course page if it worked
    if (result?.error) toast.error(result.error);
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Set up your course</CardTitle>
          <CardDescription>
            Just the big picture for now. You can add modules, exams and coursework later — and change any of this.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          <Field label="Course name" name="name" placeholder="e.g. BSc Computer Science" required />

          <div className="grid gap-2">
            <Label>How are modules weighted?</Label>
            <RadioGroup name="weighting_mode" defaultValue="credits">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="credits" id="credits" />
                <Label htmlFor="credits" className="font-normal">
                  By credits — e.g. a 20 credit module in a 120 credit year (most UK unis)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percent" id="percent" />
                <Label htmlFor="percent" className="font-normal">
                  By % — type in what % of the year each module is worth
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">You can switch later in the course settings.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year-count">Number of years</Label>
              <Input id="year-count" type="number" min={1} max={6} value={years.length} onChange={(e) => changeYearCount(Number(e.target.value))} />
            </div>
            <Field label="Semesters per year" name="semesters_per_year" type="number" min={0} max={6} defaultValue={2} />
          </div>

          <div className="grid gap-2">
            <Label>What is each year worth?</Label>
            <div className="grid gap-2">
              <div className="grid grid-cols-[1fr_6rem_6rem] gap-2 text-xs text-muted-foreground">
                <span>Year</span>
                <span>% of degree</span>
                <span>Credits</span>
              </div>
              {years.map((year, i) => (
                <div key={i} className="grid grid-cols-[1fr_6rem_6rem] gap-2">
                  <Input value={year.name} onChange={(e) => updateYear(i, { name: e.target.value })} aria-label="Year name" />
                  <Input type="number" step="any" min={0} max={100} value={year.weight} onChange={(e) => updateYear(i, { weight: Number(e.target.value) })} aria-label="Weight" />
                  <Input type="number" min={0} value={year.total_credits} onChange={(e) => updateYear(i, { total_credits: Number(e.target.value) })} aria-label="Credits" />
                </div>
              ))}
            </div>
            <p className={total === 100 ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
              Total: {total}% {total !== 100 && "— should add up to 100%"}
            </p>
          </div>

          <Field
            label="Target grade (optional)"
            name="target_grade"
            type="number"
            step="any"
            min={0}
            max={100}
            placeholder="e.g. 70 for a First"
          />
        </CardContent>

        <CardFooter className="justify-end">
          <SubmitButton label="Create course" />
        </CardFooter>
      </Card>
    </form>
  );
}
