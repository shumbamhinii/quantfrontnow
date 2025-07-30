export interface BankDetails {
    accountHolder: string;
    bank: string;
    accountNumber: string;
    branchCode: string;
  }

  export interface Employee {
    id: number;
    name: string;
    position: string;
    email: string;
    idNumber: string;
    phone?: string;
    startDate: string;
    paymentType: 'salary' | 'hourly';
    baseSalary?: number;
    hoursWorked: number;
    hourlyRate: number;
    bankDetails: BankDetails;
  }

  export interface PayrollCalculation {
    grossSalary: number;
    paye: number;
    uif: number;
    sdl: number;
    totalDeductions: number;
    netSalary: number;
  }

  export interface JobRole {
    title: string;
    baseSalary: number;
    defaultHourlyRate: number;
  }

  export interface TimeEntry {
    id: number;
    employeeId: number;
    date: string;
    hoursWorked: number;
    description?: string;
    approved: boolean;
  }

  export const JOB_ROLES: JobRole[] = [
    { title: 'Software Developer', baseSalary: 45000, defaultHourlyRate: 350 },
    { title: 'Project Manager', baseSalary: 55000, defaultHourlyRate: 450 },
    { title: 'HR Specialist', baseSalary: 35000, defaultHourlyRate: 280 },
    { title: 'Marketing Manager', baseSalary: 40000, defaultHourlyRate: 320 },
    { title: 'Sales Representative', baseSalary: 30000, defaultHourlyRate: 250 },
    { title: 'Accountant', baseSalary: 38000, defaultHourlyRate: 300 },
    { title: 'Administrative Assistant', baseSalary: 25000, defaultHourlyRate: 200 },
    { title: 'IT Support', baseSalary: 32000, defaultHourlyRate: 260 },
  ];
