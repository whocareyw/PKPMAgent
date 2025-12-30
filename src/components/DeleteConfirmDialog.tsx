import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  autoFocus?: "confirm" | "cancel" | "none";
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  autoFocus = "confirm",
}: DeleteConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleOpenAutoFocus = (e: Event) => {
    if (autoFocus === "confirm") {
      e.preventDefault();
      confirmButtonRef.current?.focus();
    } else if (autoFocus === "cancel") {
      e.preventDefault();
      cancelButtonRef.current?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[325px] sm:max-w-[325px]"
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end gap-2 justify-end">
          <Button
            ref={cancelButtonRef}
            className={"w-15 h-7 rounded-md"}
            variant="outline"
            onClick={handleCancel}
          >
            取消
          </Button>
          <Button
            ref={confirmButtonRef}
            className={"w-15 h-7 rounded-md"}
            variant="destructive"
            onClick={onConfirm}
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
