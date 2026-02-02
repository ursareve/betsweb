export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  maxSessions?: number;
  activeSessionsCount?: number;
  hasActiveSession?: boolean;
}