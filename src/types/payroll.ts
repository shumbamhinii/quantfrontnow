// src/types/payroll.ts

// No longer need a separate BankDetails interface if it's not nested
// export interface BankDetails {
//     accountHolder: string;
//     bankName: string;
//     accountNumber: string;
//     branchCode: string;
// }

export interface Employee {
    id: number;
    name: string;
    position: string;
    email: string;
    // Correcting property names to match the backend API's snake_case
    id_number: string;
    phone?: string;
    start_date: string;
    payment_type: 'salary' | 'hourly';
    base_salary?: number;
    // Correcting hoursWorked to match the backend's 'hours_worked_total'
    hours_worked_total: number;
    hourly_rate: number;

    // Bank details as top-level optional strings, matching backend names
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  branch_code?: string;
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
    employee_id: number; // Correcting employeeId to match the backend
    date: string;
    hours_worked: number; // Correcting hoursWorked to match the backend
    description?: string;
    status: 'pending' | 'approved' | 'rejected'; // Adding status from the backend
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