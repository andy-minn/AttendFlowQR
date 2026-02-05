
import { Location, Employee, PremiseType, AttendanceRecord } from './types';

export const LOCATIONS: Location[] = [
  {
    id: 'loc-1',
    name: 'Headquarters Office',
    type: PremiseType.OFFICE,
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 50,
    qrCode: 'HQ-OFFICE-001',
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    id: 'loc-2',
    name: 'Main Factory',
    type: PremiseType.FACTORY,
    latitude: 37.7833,
    longitude: -122.4167,
    radius: 100,
    qrCode: 'FACT-MAIN-002',
    startTime: '08:00',
    endTime: '17:00',
  },
  {
    id: 'loc-3',
    name: 'Logistics Warehouse',
    type: PremiseType.WAREHOUSE,
    latitude: 37.7510,
    longitude: -122.4476,
    radius: 75,
    qrCode: 'WH-LOG-003',
    startTime: '00:00',
    endTime: '23:59',
  }
];

export const EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'John Doe',
    employeeId: 'EMP001',
    role: 'EMPLOYEE',
    locationId: 'loc-1',
    department: 'Engineering',
    baseSalary: 3500,
    hourlyRate: 22,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 0,
    bonus: 200,
    avatar: 'https://picsum.photos/seed/emp1/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-2',
    name: 'Jane Smith',
    employeeId: 'EMP002',
    role: 'ADMIN',
    locationId: 'loc-1',
    department: 'Human Resources',
    baseSalary: 5500,
    hourlyRate: 35,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 500,
    bonus: 300,
    avatar: 'https://picsum.photos/seed/emp2/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-3',
    name: 'Mike Wilson',
    employeeId: 'EMP003',
    role: 'EMPLOYEE',
    locationId: 'loc-2',
    department: 'Operations',
    baseSalary: 2800,
    hourlyRate: 18,
    otMultiplier: 1.25,
    penalty: 100,
    loanRepayment: 0,
    bonus: 0,
    avatar: 'https://picsum.photos/seed/emp3/200',
    status: 'INACTIVE',
    onboarded: true
  },
  {
    id: 'emp-4',
    name: 'Sarah Jenkins',
    employeeId: 'EMP004',
    role: 'EMPLOYEE',
    locationId: 'loc-1',
    department: 'Marketing',
    baseSalary: 3200,
    hourlyRate: 20,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 0,
    bonus: 500,
    avatar: 'https://picsum.photos/seed/emp4/200',
    status: 'INACTIVE',
    onboarded: true
  },
  {
    id: 'emp-5',
    name: 'David Chen',
    employeeId: 'EMP005',
    role: 'EMPLOYEE',
    locationId: 'loc-2',
    department: 'Quality Control',
    baseSalary: 2600,
    hourlyRate: 16,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 200,
    bonus: 0,
    avatar: 'https://picsum.photos/seed/emp5/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-6',
    name: 'Elena Rodriguez',
    employeeId: 'EMP006',
    role: 'EMPLOYEE',
    locationId: 'loc-3',
    department: 'Logistics',
    baseSalary: 2900,
    hourlyRate: 19,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 0,
    bonus: 100,
    avatar: 'https://picsum.photos/seed/emp6/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-7',
    name: 'Robert Taylor',
    employeeId: 'EMP007',
    role: 'EMPLOYEE',
    locationId: 'loc-1',
    department: 'Sales',
    baseSalary: 4000,
    hourlyRate: 25,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 0,
    bonus: 1200,
    avatar: 'https://picsum.photos/seed/emp7/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-8',
    name: 'Lisa Wang',
    employeeId: 'EMP008',
    role: 'EMPLOYEE',
    locationId: 'loc-2',
    department: 'Maintenance',
    baseSalary: 2400,
    hourlyRate: 15,
    otMultiplier: 1.25,
    penalty: 0,
    loanRepayment: 0,
    bonus: 0,
    avatar: 'https://picsum.photos/seed/emp8/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-9',
    name: 'Kevin Miller',
    employeeId: 'EMP009',
    role: 'EMPLOYEE',
    locationId: 'loc-3',
    department: 'Security',
    baseSalary: 2700,
    hourlyRate: 17,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 150,
    bonus: 50,
    avatar: 'https://picsum.photos/seed/emp9/200',
    status: 'ACTIVE',
    onboarded: true
  },
  {
    id: 'emp-10',
    name: 'Anita Gupta',
    employeeId: 'EMP010',
    role: 'EMPLOYEE',
    locationId: 'loc-1',
    department: 'Legal',
    baseSalary: 6000,
    hourlyRate: 40,
    otMultiplier: 1.5,
    penalty: 0,
    loanRepayment: 0,
    bonus: 0,
    avatar: 'https://picsum.photos/seed/emp10/200',
    status: 'ACTIVE',
    onboarded: true
  }
];

const generateFebruaryAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const days = [1, 2, 3, 4, 5]; // Feb 1 (Sun) to Feb 5 (Thu) 2026
  
  EMPLOYEES.forEach((emp, empIdx) => {
    days.forEach(day => {
      const date = new Date(2026, 1, day); // month is 0-indexed, 1 = Feb
      
      let checkIn: Date | null = new Date(date);
      let checkOut: Date | null = new Date(date);
      let status: 'PRESENT' | 'LATE' | 'ABSENT' | 'OVERTIME' = 'PRESENT';

      if (emp.id === 'emp-1') {
        checkIn.setHours(9, 0, 0);
        checkOut.setHours(18, 0, 0);
      } else if (emp.id === 'emp-2') {
        if (day === 2 || day === 4) {
          checkIn.setHours(10, 15, 0);
          status = 'LATE';
        } else {
          checkIn.setHours(8, 55, 0);
        }
        checkOut.setHours(18, 0, 0);
      } else if (emp.id === 'emp-3') {
        checkIn.setHours(8, 0, 0);
        if (day % 2 !== 0) {
          checkOut.setHours(20, 0, 0); // 12 hours shift
          status = 'OVERTIME';
        } else {
          checkOut.setHours(17, 0, 0);
        }
      } else if (emp.id === 'emp-4') {
        if (day === 5) {
          checkIn = null;
          checkOut = null;
          status = 'ABSENT';
        } else {
          checkIn.setHours(9, 0, 0);
          checkOut.setHours(18, 0, 0);
        }
      } else if (emp.id === 'emp-5') {
        checkIn.setHours(9, 45, 0);
        checkOut.setHours(18, 30, 0);
        status = 'LATE';
      } else if (emp.id === 'emp-6') {
        checkIn.setHours(18, 0, 0);
        checkOut = new Date(date.getTime() + 10 * 60 * 60 * 1000); // 10 hours later
        status = 'OVERTIME';
      } else if (emp.id === 'emp-7') {
        checkIn.setHours(9, 0, 0);
        checkOut.setHours(14, 0, 0);
      } else if (emp.id === 'emp-8') {
        checkIn.setHours(7, 0, 0);
        checkOut.setHours(16, 0, 0);
      } else if (emp.id === 'emp-9') {
        if (day === 1 || day === 2) {
          checkIn = null;
          checkOut = null;
          status = 'ABSENT';
        } else {
          checkIn.setHours(8, 0, 0);
          checkOut.setHours(17, 0, 0);
        }
      } else if (emp.id === 'emp-10') {
        if (day === 1) checkIn.setHours(8, 50, 0);
        else if (day === 2) { checkIn.setHours(11, 0, 0); status = 'LATE'; }
        else if (day === 3) checkIn.setHours(9, 0, 0);
        else if (day === 4) { checkIn.setHours(9, 0, 0); checkOut.setHours(22, 0, 0); status = 'OVERTIME'; }
        else if (day === 5) { checkIn = null; checkOut = null; status = 'ABSENT'; }
        
        if (checkIn && !checkOut.getHours()) checkOut.setHours(18, 0, 0);
      }

      if (status !== 'ABSENT') {
        records.push({
          id: `att-${emp.id}-${day}`,
          employeeId: emp.id,
          locationId: emp.locationId,
          checkIn,
          checkOut,
          status,
          lat: 0, // Mock
          lng: 0, // Mock
        });
      }
    });
  });

  return records;
};

export const MOCK_ATTENDANCE: AttendanceRecord[] = generateFebruaryAttendance();
