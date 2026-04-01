export const UserRole = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

export const RecordType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export type RecordTypeValue = (typeof RecordType)[keyof typeof RecordType];

export const ALL_ROLES: UserRoleType[] = [UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN];
export const WRITE_ROLES: UserRoleType[] = [UserRole.ADMIN];
export const READ_ROLES: UserRoleType[] = [UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN];
