import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePhone,
  validateSAId,
  AVAILABLE_ROLES,
  ROLE_LABELS,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/user-management";
import type { User, Role } from "@/lib/edlts-store";

const userFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  idNumber: z.string().min(13, "Invalid ID number"),
  phone: z.string().min(10, "Invalid phone number"),
  role: z.enum(["admin", "manager", "reviewer", "approver", "staff", "officer", "applicant"] as const),
  status: z.enum(["active", "inactive"] as const),
  password: z.string().optional().default(""),
  confirmPassword: z.string().optional().default(""),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  user: User | null;
  open: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
  onSave: (values: UserFormValues) => void;
  onCancel: () => void;
}

export function UserFormDialog({
  user,
  open,
  isLoading,
  isEditMode = false,
  onSave,
  onCancel,
}: UserFormDialogProps) {
  const [passwordStrength, setPasswordStrength] = useState<string>("Weak");

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      idNumber: user?.idNumber || "",
      phone: user?.phone || "",
      role: user?.role || "applicant",
      status: user?.status || "active",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        idNumber: user.idNumber,
        phone: user.phone,
        role: user.role,
        status: user.status || "active",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user, form]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    form.setValue("password", pwd);
    setPasswordStrength(getPasswordStrengthLabel(pwd));
  };

  const handleSubmit = async (values: UserFormValues) => {
    // Validate full name
    if (!validateFullName(values.fullName)) {
      form.setError("fullName", { message: "Invalid name format" });
      return;
    }

    // Validate email
    if (!validateEmail(values.email)) {
      form.setError("email", { message: "Invalid email format" });
      return;
    }

    // Validate ID number
    if (!validateSAId(values.idNumber)) {
      form.setError("idNumber", { message: "Invalid South African ID number" });
      return;
    }

    // Validate phone
    if (!validatePhone(values.phone)) {
      form.setError("phone", { message: "Invalid phone number format" });
      return;
    }

    // For create mode, password is required
    if (!isEditMode && !values.password) {
      form.setError("password", { message: "Password is required for new users" });
      return;
    }

    // If password provided, validate it
    if (values.password) {
      const passwordValidation = validatePassword(values.password);
      if (!passwordValidation.isValid) {
        form.setError("password", { message: passwordValidation.errors[0] });
        return;
      }

      if (values.password !== values.confirmPassword) {
        form.setError("confirmPassword", { message: "Passwords do not match" });
        return;
      }
    }

    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update user information and permissions"
              : "Add a new user to the system"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0000000000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+27 123 456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role as Role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(!isEditMode || form.watch("password")) && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEditMode ? "New Password (Optional)" : "Password"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"}
                          onChange={handlePasswordChange}
                          value={field.value}
                        />
                      </FormControl>
                      {field.value && (
                        <FormDescription>
                          Strength:{" "}
                          <span className={getPasswordStrengthColor(field.value)}>
                            {passwordStrength}
                          </span>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("password") && (
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
