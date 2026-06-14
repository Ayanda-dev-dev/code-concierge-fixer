import type { Role } from "./edlts-store";

export const AVAILABLE_ROLES: Role[] = ["admin", "manager", "reviewer", "approver", "staff", "officer", "applicant"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  reviewer: "Reviewer",
  approver: "Approver",
  staff: "Staff",
  officer: "Officer",
  applicant: "Applicant",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Full system access and user management",
  manager: "Can manage staff and view reports",
  reviewer: "Can review applications and documents",
  approver: "Can approve applications and payments",
  staff: "Can process applications and update statuses",
  officer: "System officer with elevated permissions",
  applicant: "Regular user applying for licenses",
};

export function validateFullName(name: string): boolean {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\u2019-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/u.test(name.trim());
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+27[6-8]\d{8}$/.test(normalized);
}

export function normalizePhone(phone: string): string {
  const trimmed = phone.replace(/[^\d+]/g, "");
  if (trimmed.startsWith("+27") && trimmed.length === 12) return trimmed;
  if (trimmed.startsWith("0") && trimmed.length === 10) return `+27${trimmed.slice(1)}`;
  if (trimmed.startsWith("27") && trimmed.length === 11) return `+${trimmed}`;
  return trimmed;
}

export function validateSAId(id: string): boolean {
  const digits = id.replace(/\D/g, "");
  if (!/^\d{13}$/.test(digits)) return false;

  const year = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const day = parseInt(digits.slice(4, 6), 10);
  const fullYear = year > new Date().getFullYear() % 100 ? 1900 + year : 2000 + year;

  const date = new Date(fullYear, month - 1, day);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return false;
  }

  return luhnCheck(digits);
}

function luhnCheck(value: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPasswordStrengthLabel(password: string): string {
  const validation = validatePassword(password);
  if (!validation.isValid) {
    const errorCount = validation.errors.length;
    if (errorCount >= 4) return "Very Weak";
    if (errorCount === 3) return "Weak";
    if (errorCount === 2) return "Fair";
    return "Good";
  }
  return "Strong";
}

export function getPasswordStrengthColor(password: string): string {
  const label = getPasswordStrengthLabel(password);
  switch (label) {
    case "Very Weak":
      return "text-red-600";
    case "Weak":
      return "text-orange-600";
    case "Fair":
      return "text-yellow-600";
    case "Good":
      return "text-blue-600";
    case "Strong":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}
