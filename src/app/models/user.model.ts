export type UserRole = 'superadmin' | 'admin' | 'member' | 'viewer' | 'guest';
export type Gender = 'masculino' | 'femenino';

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  document: string;
  gender: Gender;
  role: UserRole;
  active: boolean;
  activeUntil?: Date;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  maxSessions?: number;
  activeSessionsCount?: number;
  hasActiveSession?: boolean;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  document: string;
  gender: Gender;
  role: UserRole;
  active?: boolean;
  activeUntil?: Date;
  avatarUrl?: string;
  maxSessions?: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  document?: string;
  gender?: Gender;
  role?: UserRole;
  active?: boolean;
  activeUntil?: Date;
  avatarUrl?: string;
  maxSessions?: number;
  activeSessionsCount?: number;
  hasActiveSession?: boolean;
}
