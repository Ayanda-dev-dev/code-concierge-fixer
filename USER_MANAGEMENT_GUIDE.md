# User Management Module - Documentation

## Overview

The User Management module is an administrative feature within the eDLTS Admin Dashboard that allows administrators to manage system users, their roles, and permissions. This module provides a centralized interface for user lifecycle management including creation, editing, deactivation, and deletion of user accounts.

## Access Control

**Important:** Only users with the **Admin** role can access the User Management page.

- **Route:** `/admin/users`
- **Required Role:** `admin`
- **Unauthorized Access:** Non-admin users attempting to access this page will be automatically redirected to the home page.

## Features

### 1. User List View

The User List displays all system users in a searchable, filterable table with the following columns:

| Column | Description |
|--------|-------------|
| **Name** | User's full name |
| **Email** | User's email address |
| **Role** | User's assigned role (Admin, Manager, Reviewer, Approver, Staff, Officer, Applicant) |
| **Status** | Account status (Active/Inactive) |
| **Created** | Account creation date and time |
| **Last Login** | Last login timestamp (displays "Never" if user hasn't logged in) |
| **Actions** | Dropdown menu with actions (View, Edit, Activate/Deactivate, Delete) |

### 2. Search and Filtering

Find users quickly using multiple filters:

- **Search Bar:** Find users by name or email address (real-time search)
- **Role Filter:** Filter by specific user role
- **Status Filter:** Show only active or inactive users
- **Results Count:** Displays total number of users matching current filters

Example: Search for "john", filter by "Manager" role, and "Active" status to find all active managers named John.

### 3. Create User

Create new user accounts with the following process:

#### Required Fields

- **Full Name:** User's first and last name (validated format)
- **Email Address:** Must be unique and valid email format
- **ID Number:** South African ID number (13 digits, validated with Luhn check)
- **Phone Number:** South African phone number format (+27XXXXXXXXX)
- **Role:** Select from available roles
- **Status:** Active or Inactive
- **Password:** Must meet security requirements (minimum 12 characters with uppercase, lowercase, number, and special character)
- **Confirm Password:** Must match password field

#### Validation Rules

- Email addresses must be unique across the system
- Passwords must meet security requirements
- South African ID numbers are validated using the Luhn algorithm
- Phone numbers must be in valid South African format
- Full names cannot contain numbers or special characters (except hyphens and apostrophes)

#### Password Requirements

- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_-+=[]{}...etc)

### 4. Edit User

Update existing user information:

- Modify full name, email, phone number, or ID number
- Change user role
- Change account status
- Reset password (optional)

**Note:** When editing a user, the password field is optional. Leave it blank to keep the current password.

### 5. Activate/Deactivate Users

Toggle user account status:

- **Deactivate:** Temporarily disable user access without deleting the account
- **Activate:** Re-enable a deactivated account

These actions are recorded in the audit logs.

### 6. Delete User

Permanently remove user accounts from the system:

#### Deletion Confirmation

A confirmation dialog will appear before deletion with:
- User name and email
- Warning about permanent deletion
- Note that audit logs are retained for compliance

#### Safety Features

- **Confirmation Required:** Administrators must confirm deletion
- **Self-Delete Prevention:** Administrators cannot delete their own admin account if no other active administrators exist
- **Audit Trail Preserved:** Deletion events are logged even after account removal

#### Warning Message for Self-Deletion

If you attempt to delete your own admin account and no other active administrators exist:
```
Warning: You cannot delete your own admin account. 
This is a safety measure to prevent accidental lockout.
```

### 7. View User Details

Click "View Details" to see:

- **Personal Information:** Full name, email, ID number, phone
- **Account Status:** Current role, status (Active/Inactive)
- **Dates:** Creation date and last login timestamp
- **Recent Activity:** Last 5 audit log entries for the user

### 8. Audit Logs

Access comprehensive audit logs in two ways:

#### 1. From Admin Dashboard

Click the **"Audit Logs"** button in the Admin Dashboard header to view system-wide administrative actions.

#### 2. From User Management

Click **"View Details"** on any user to see their specific activity history.

#### Audit Log Information

Each audit log entry contains:

| Field | Description |
|-------|-------------|
| **Action** | Type of action (User Created, Updated, Deleted, Role Changed, Password Reset, Account Activated/Deactivated) |
| **User Affected** | Name of user targeted by the action |
| **Administrator** | Name of admin who performed the action |
| **Timestamp** | Date and time of the action |
| **Changes** | Specific fields that were changed (if applicable) |

#### Audit Log Filters

- **Action Filter:** Filter by specific audit action types
- **Search:** Find logs by user name (affected user or administrator)
- **All Logs:** View complete history sorted by newest first

## Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | System administrator with full access | All permissions including user management |
| **Manager** | Departmental manager | Can manage staff and view reports |
| **Reviewer** | Document and application reviewer | Can review applications and documents |
| **Approver** | Application and payment approver | Can approve applications and payments |
| **Staff** | General staff member | Can process applications and update statuses |
| **Officer** | System officer with elevated permissions | Officer-level system operations |
| **Applicant** | Regular citizen applying for licenses | Can submit applications and track status |

## Security Features

### Role-Based Access Control (RBAC)

- Access control is enforced at both UI and API levels
- Only admin users can access the User Management page
- Permissions are validated on every action

### Validation & Validation

- Email uniqueness validation (no duplicate accounts)
- Password strength enforcement
- South African ID number validation (Luhn algorithm)
- Phone number format validation
- Full name format validation

### Audit Trail

All administrative actions are logged with:
- What action was performed
- Which user was affected
- Which administrator performed the action
- When the action occurred
- What changes were made

### Data Protection

- Passwords are never displayed or exported
- Deleted users cannot be recovered (data is permanent)
- Audit logs provide compliance and security records

## Workflow Examples

### Scenario 1: Create a New Manager

1. Navigate to Admin > User Management
2. Click **"Create User"** button
3. Fill in the form:
   - Full Name: "Jane Smith"
   - Email: "jane.smith@edlts.gov"
   - ID: "9012345678901"
   - Phone: "+27123456789"
   - Role: "Manager"
   - Status: "Active"
   - Password: [Enter secure password]
4. Confirm password
5. Click **"Save User"**
6. Success notification will appear

### Scenario 2: Disable a User Account

1. Search for user by name or email
2. Find user in the list
3. Click the **three-dot menu** (⋯) in Actions column
4. Select **"Deactivate"**
5. User status changes to "Inactive"
6. User cannot log in, but account data is preserved

### Scenario 3: Change User Role

1. Search for user
2. Click **three-dot menu** and select **"Edit User"**
3. Change the **Role** dropdown to desired role
4. Click **"Save User"**
5. Role change is logged in audit logs with timestamp and admin name

### Scenario 4: Review User Activity

1. Click **"View Details"** for a user
2. Scroll to "Recent Activity" section
3. Last 5 actions are displayed
4. Click **"Audit Logs"** in Admin Dashboard for complete history

## Best Practices

### General Administration

1. **Regular Audits:** Periodically review audit logs for unauthorized access attempts
2. **Role Assignment:** Assign least-privilege principle - only grant necessary roles
3. **Inactive Accounts:** Deactivate accounts instead of deleting if data retention is needed
4. **Password Management:** Encourage users to change passwords regularly
5. **Backup Admin:** Maintain at least 2 active admin accounts for system access

### Security

1. **Strong Passwords:** Ensure all user passwords meet the security requirements
2. **Unique Emails:** Don't reuse email addresses
3. **Regular Reviews:** Audit logs should be reviewed regularly
4. **Compliance:** Keep audit logs for required retention periods
5. **Access Logs:** Monitor who is making administrative changes

### Maintenance

1. **Deactivate Legacy Accounts:** Regularly deactivate accounts of inactive users
2. **Archive Audit Logs:** Export and archive old audit logs periodically
3. **Review Deleted Users:** Keep track of deleted user records in separate logs
4. **Role Management:** Review and update role assignments quarterly

## Troubleshooting

### "Email already exists" Error

- The entered email is already assigned to another user
- **Solution:** Use a unique email address or edit the existing user

### "Invalid ID number" Error

- The South African ID number format is incorrect or fails validation
- **Solution:** Verify 13-digit format and use valid ID number

### "Cannot delete your own account" Warning

- You're trying to delete an admin account when you're the only active admin
- **Solution:** Create another admin account first, then delete your account, or deactivate instead

### "Password does not meet requirements" Error

- Password is too short or missing required character types
- **Solution:** Ensure password has 12+ characters, includes uppercase, lowercase, number, and special character

### Cannot access User Management page

- Your account doesn't have admin role
- **Solution:** Contact another administrator to grant you admin permissions

## API Integration

The User Management module uses the store-based state management system (`edlts-store.ts`) with the following key functions:

### Core Functions

```typescript
store.createUser(input: User) // Create new user
store.updateUser(id: string, updates: Partial<User>) // Update user
store.deleteUser(id: string) // Delete user
store.getUser(id: string) // Get user details
store.getAllUsers() // Get all users
store.getAuditLogs(userId?: string) // Get audit logs
store.activateUser(id: string) // Activate user
store.deactivateUser(id: string) // Deactivate user
store.resetPassword(id: string, newPassword: string) // Reset password
```

All functions automatically log audit events.

## Limitations & Notes

1. **Search Scope:** Search is local (doesn't search historical data)
2. **Pagination:** Large datasets use in-memory filtering
3. **Export:** User lists can be copied but not directly exported as CSV
4. **Batch Operations:** Multiple users cannot be updated simultaneously
5. **Password Recovery:** There is no self-service password recovery; admin must reset

## Support & Contact

For issues or questions:
1. Review this documentation
2. Check audit logs for error information
3. Contact the system administrator
4. Submit a support ticket with specific details

---

**Version:** 1.0  
**Last Updated:** 2026-06-07  
**Status:** Production Ready
