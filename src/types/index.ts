export type UserRole = 'admin' | 'intern';

export interface User {
  username: string;
  password: string;
  role: UserRole;
}

export interface CSVJob {
  id: string;
  name: string;
  uploadDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  data: string[][];
  headers: string[];
  visibleColumns: string[];
  flags: Record<number, number>;
  totalRows: number;
  flaggedRows: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const FLAG_OPTIONS = [
  { value: 1, label: 'Absent', color: 'flag-absent' },
  { value: 2, label: 'Good', color: 'flag-good' },
  { value: 3, label: 'Bad', color: 'flag-bad' },
  { value: 4, label: 'Very Bad', color: 'flag-very-bad' },
] as const;
