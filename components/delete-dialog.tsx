"use client";

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
} from "@/components/ui/alert-dialog";
import { deleteItem, type ItemType } from "@/lib/actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ItemType;
  id: number;
  name: string;
};

export function DeleteDialog({ open, onOpenChange, type, id, name }: Props) {
  async function handleDelete() {
    const result = await deleteItem(type, id);
    if (result.error) toast.error(result.error);
    else toast.success(`Deleted ${name}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {type === "component"
              ? "This removes it and its mark."
              : `Everything inside this ${type} will be deleted too. This can't be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
