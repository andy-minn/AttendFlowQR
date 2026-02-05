
export type UserRole = 'ADMIN' | 'EMPLOYEE';

export enum PremiseType {
  OFFICE = 'OFFICE',
  FACTORY = 'FACTORY',
  WAREHOUSE = 'WAREHOUSE',
  SHOWROOM = 'SHOWROOM'
}

export interface Location {
  id: string;
  name: string;
  type: PremiseType;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  qrCode: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  locationId: string;
  department: string;
  baseSalary: number;
  hourlyRate: number;
  otMultiplier: number; // New field: e.g. 1.5
  penalty: number; // New field: monthly penalty deductions
  loanRepayment: number; // New field: monthly loan deductions
  bonus: number; // New field: extra payments
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE';
  onboarded?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  locationId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'OVERTIME';
  lat: number;
  lng: number;
  photoUrl?: string;
}

export interface PayrollReport {
  employeeId: string;
  name: string;
  totalHours: number;
  overtimeHours: number;
  baseSalary: number;
  allowances: number; // Now maps to bonus
  deductions: number; // Now maps to penalty + loan
  netPay: number;
}
