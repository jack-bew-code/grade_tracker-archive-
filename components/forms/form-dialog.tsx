"use client";

// A reusable popup form. It calls a Server Action, shows a toast,
// and closes itself if the save worked.

import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/actions";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel?: string;
  children: React.ReactNode;
};

export function FormDialog({ open, onOpenChange, title, description, action, submitLabel = "Save", children }: FormDialogProps) {
  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Saved");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton label={submitLabel} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

// A label + input pair.
type FieldProps = React.ComponentProps<typeof Input> & { label: string; hint?: string };

export function Field({ label, hint, name, ...inputProps }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...inputProps} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
