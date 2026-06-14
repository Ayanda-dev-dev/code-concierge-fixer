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
import type { User } from "@/lib/edlts-store";

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentUserId?: string;
}

export function DeleteUserDialog({
  user,
  open,
  isLoading,
  onConfirm,
  onCancel,
  currentUserId,
}: DeleteUserDialogProps) {
  if (!user) return null;

  const isOwnAccount = user.id === currentUserId;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            {isOwnAccount ? (
              <span className="text-red-600 font-semibold">
                Warning: You cannot delete your own admin account. This is a safety measure to prevent
                accidental lockout.
              </span>
            ) : (
              <>
                Are you sure you want to delete <strong>{user.fullName}</strong> ({user.email})?
                <br />
                <br />
                This action cannot be undone. All associated audit logs will be retained for compliance.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          {!isOwnAccount && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
