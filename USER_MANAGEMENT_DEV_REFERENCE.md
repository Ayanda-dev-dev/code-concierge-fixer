# User Management - Developer Reference

## Architecture Overview

The User Management system is built with the following architecture:

```
┌─────────────────────────────────────────┐
│       User Management Page              │
│    (admin.users.tsx route)              │
└──────────────┬──────────────────────────┘
               │
               ├─────────────────────────────────────────┐
               │                                         │
        ┌──────▼──────┐  ┌──────────────┐  ┌───────────▼──┐
        │ UserList    │  │ Audit Logs   │  │  Components  │
        │ Table       │  │  Dialog      │  │  (Forms,     │
        │             │  │              │  │   Dialogs)   │
        └──────┬──────┘  └──────┬───────┘  └───────┬──────┘
               │                │                  │
               └────────┬───────┴──────────────────┘
                        │
                ┌───────▼────────────┐
                │ User Management    │
                │ Store Functions    │
                │ (edlts-store.ts)   │
                └───────┬────────────┘
                        │
                ┌───────▼──────────────┐
                │ Validation Utils     │
                │ (user-management.ts) │
                └──────────────────────┘
```

## File Structure

```
src/
├── routes/
│   ├── admin.tsx                    # Admin dashboard (updated with user mgmt link)
│   └── admin.users.tsx              # Main user management page
├── components/
│   ├── UserListTable.tsx            # User list table component
│   ├── UserFormDialog.tsx           # Create/Edit user form
│   ├── DeleteUserDialog.tsx         # Delete confirmation dialog
│   ├── UserDetailsDialog.tsx        # User details viewer
│   └── AuditLogsDialog.tsx          # Audit logs viewer
├── lib/
│   ├── edlts-store.ts               # State management with user functions
│   └── user-management.ts           # Validation and utility functions
└── USER_MANAGEMENT_GUIDE.md         # Administrator documentation
```

## Data Types

### User Type

```typescript
export type User = {
  id: string;                    // Unique identifier (u-{timestamp})
  email: string;                 // Unique email address
  fullName: string;              // User's full name
  idNumber: string;              // South African ID number
  phone: string;                 // Phone number
  role: Role;                    // User role (see Role type)
  status?: "active" | "inactive"; // Account status (default: active)
  createdAt?: number;            // Creation timestamp
  lastLogin?: number | null;     // Last login timestamp
  password?: string;             // Hashed password
};
```

### Role Type

```typescript
export type Role = 
  | "applicant" 
  | "officer" 
  | "admin" 
  | "manager" 
  | "reviewer" 
  | "approver" 
  | "staff";
```

### AuditLog Type

```typescript
export type AuditLog = {
  id: string;                    // Unique log ID (al-{timestamp})
  action: AuditAction;           // Action performed
  userId: string;                // User affected
  adminId: string;               // Admin who performed action
  changes?: Record<string, unknown>; // What changed
  timestamp: number;             // When action occurred
};

// Available actions:
type AuditAction = 
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "role_changed"
  | "password_reset"
  | "account_activated"
  | "account_deactivated";
```

## Store Functions

### Create User

```typescript
store.createUser(input: {
  fullName: string;
  email: string;
  idNumber: string;
  phone: string;
  role: Role;
  status?: "active" | "inactive";
  password: string;
  createdBy: string; // Admin ID
}): User
```

**Throws:** Error if email already exists

### Update User

```typescript
store.updateUser(
  id: string,
  updates: Partial<User>,
  adminId: string
): User | null
```

**Returns:** Updated user or null if not found  
**Throws:** Error if email already exists

### Delete User

```typescript
store.deleteUser(
  id: string,
  adminId: string
): boolean
```

**Returns:** true if successful

### Get User

```typescript
store.getUser(id: string): User | undefined
store.getUserByEmail(email: string): User | undefined
store.getAllUsers(): User[]
```

### User Status Operations

```typescript
store.activateUser(id: string, adminId: string): boolean
store.deactivateUser(id: string, adminId: string): boolean
store.resetPassword(id: string, newPassword: string, adminId: string): boolean
```

### Audit Operations

```typescript
store.getAuditLogs(userId?: string): AuditLog[]
// Returns all logs if userId not provided, or logs for specific user
// Results sorted by timestamp (newest first)
```

## Validation Functions

All validation functions are in `user-management.ts`:

```typescript
// Individual validators
validateFullName(name: string): boolean
validateEmail(email: string): boolean
validatePhone(phone: string): boolean
validateSAId(id: string): boolean

// Password validation
validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
}

// Utilities
normalizePhone(phone: string): string
formatDate(timestamp: number | null): string
getPasswordStrengthLabel(password: string): string
getPasswordStrengthColor(password: string): string

// Constants
AVAILABLE_ROLES: Role[]
ROLE_LABELS: Record<Role, string>
ROLE_DESCRIPTIONS: Record<Role, string>
```

## Component Props

### UserListTable

```typescript
interface UserListTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onView: (user: User) => void;
}
```

### UserFormDialog

```typescript
interface UserFormDialogProps {
  user: User | null;           // User to edit, null for create
  open: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
  onSave: (values: UserFormValues) => void;
  onCancel: () => void;
}
```

### DeleteUserDialog

```typescript
interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentUserId?: string;       // For preventing self-delete
}
```

### UserDetailsDialog

```typescript
interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}
```

### AuditLogsDialog

```typescript
interface AuditLogsDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: string;              // Filter by user, undefined for all
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already exists" | Duplicate email | Use unique email or edit existing user |
| "Invalid email format" | Malformed email | Use valid email format |
| "Invalid South African ID number" | Wrong format or fails Luhn check | Verify 13-digit format |
| "Invalid phone number format" | Wrong format | Use +27XXXXXXXXX format |
| "Password must be at least 12 characters" | Password too short | Add more characters |
| "Password must contain at least one [type]" | Missing character type | Add uppercase, lowercase, number, or special character |
| "Passwords do not match" | Confirm password doesn't match | Ensure both passwords are identical |

## Extending the System

### Adding a New Role

1. **Update Role Type** in `edlts-store.ts`:
```typescript
export type Role = "..." | "new_role";
```

2. **Add Role Label** in `user-management.ts`:
```typescript
ROLE_LABELS: {
  // ... existing roles
  new_role: "New Role Name",
}
```

3. **Add Role Description**:
```typescript
ROLE_DESCRIPTIONS: {
  // ... existing roles
  new_role: "Description of new role",
}
```

4. **Update AVAILABLE_ROLES**:
```typescript
export const AVAILABLE_ROLES: Role[] = [
  // ... existing roles
  "new_role",
];
```

### Adding a New Audit Action

1. **Update AuditLog Type** in `edlts-store.ts`:
```typescript
export type AuditLog = {
  // ...
  action: "..." | "new_action";
}
```

2. **Add Action Label** in `AuditLogsDialog.tsx`:
```typescript
const ACTION_LABELS: Record<string, string> = {
  // ... existing actions
  new_action: "Action Label",
};
```

3. **Add Color** in `AuditLogsDialog.tsx`:
```typescript
const ACTION_COLORS: Record<string, string> = {
  // ... existing colors
  new_action: "bg-color-100 text-color-800",
};
```

4. **Log the Action** in store when needed:
```typescript
const auditLog: AuditLog = {
  id: `al-${Date.now()}`,
  action: "new_action",
  userId: targetUserId,
  adminId: adminId,
  changes: { /* ... */ },
  timestamp: Date.now(),
};
state = { ...state, auditLogs: [...state.auditLogs, auditLog] };
```

### Adding Custom Validation

1. **Create validator in `user-management.ts`**:
```typescript
export function validateCustomField(value: string): boolean {
  // Custom logic here
  return true;
}
```

2. **Use in component**:
```typescript
if (!validateCustomField(value)) {
  form.setError("fieldName", { message: "Validation error" });
  return;
}
```

## Testing Considerations

### Test Scenarios

1. **Access Control**
   - Verify non-admin users cannot access `/admin/users`
   - Verify admin users can access the page

2. **User Creation**
   - Test with valid data
   - Test duplicate email detection
   - Test password validation
   - Test ID number validation

3. **User Editing**
   - Test updating each field
   - Test role changes are logged
   - Test status changes

4. **User Deletion**
   - Test soft delete option (deactivate)
   - Test hard delete
   - Test self-delete prevention
   - Test confirmation dialog

5. **Search and Filtering**
   - Test search by name
   - Test search by email
   - Test role filtering
   - Test status filtering
   - Test combined filters

6. **Audit Logging**
   - Verify all actions are logged
   - Verify correct admin is recorded
   - Verify timestamps are accurate
   - Verify changes are documented

### Test Data

Seed users are available:
- **Officer:** officer@edlts.gov (Thabo Officer)
- **Admin:** admin@edlts.gov (Naledi Admin)

## Performance Considerations

- **Current Limitation:** All filtering and searching is done in-memory
- **Scalability:** For large user bases (>10,000 users), consider:
  - Implementing backend pagination
  - Adding lazy loading for lists
  - Optimizing audit log queries
  - Adding caching layer

## Security Checklist

- [x] Role-based access control (RBAC)
- [x] Email uniqueness validation
- [x] Strong password requirements
- [x] Input validation on all fields
- [x] Audit logging for all actions
- [x] Prevention of self-account deletion
- [x] Confirmation dialogs for destructive actions
- [ ] Rate limiting on user creation/deletion
- [ ] Two-factor authentication (optional enhancement)
- [ ] Encrypted password storage (use proper hashing in production)

---

**Version:** 1.0  
**Last Updated:** 2026-06-07
