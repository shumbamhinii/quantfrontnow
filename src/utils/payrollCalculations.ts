import type { Employee, PayrollCalculation } from '../types/payroll';

// South African tax brackets for 2024/2025 tax year
const TAX_BRACKETS = [
  { min: 0, max: 237100, rate: 0.18 },
  { min: 237100, max: 370500, rate: 0.26 },
  { min: 370500, max: 512800, rate: 0.31 },
  { min: 512800, max: 673000, rate: 0.36 },
  { min: 673000, max: 857900, rate: 0.39 },
  { min: 857900, max: 1817000, rate: 0.41 },
  { min: 1817000, max: Infinity, rate: 0.45 }
];

const ANNUAL_TAX_REBATES = {
  primary: 17235, // Primary rebate for individuals under 65
  secondary: 9444, // Secondary rebate for individuals 65-74
  tertiary: 3145 // Tertiary rebate for individuals 75+
};

export const calculatePAYE = (annualSalary: number): number => {
  let tax = 0;

  for (const bracket of TAX_BRACKETS) {
    if (annualSalary > bracket.min) {
      const taxableInBracket = Math.min(annualSalary - bracket.min, (bracket.max === Infinity ? annualSalary : bracket.max) - bracket.min);
      tax += taxableInBracket * bracket.rate;
    }
    if (annualSalary <= bracket.max) break;
  }

  // Apply primary rebate
  tax = Math.max(0, tax - ANNUAL_TAX_REBATES.primary);

  return tax / 12; // Convert to monthly
};

export const calculateUIF = (monthlySalary: number): number => {
  // UIF is 1% of salary, capped at R177.12 per month (as per 2024 rates)
  const uifRate = 0.01;
  const maxUIF = 177.12;
  return Math.min(monthlySalary * uifRate, maxUIF);
};

export const calculateSDL = (monthlySalary: number): number => {
  // SDL is 1% of salary for employers (not deducted from employee)
  // Including here for completeness, but typically not deducted from employee salary
  return 0; // Employees don't pay SDL directly
};

export const calculatePayroll = (employee: Employee): PayrollCalculation => {
  const grossSalary = employee.hoursWorked * employee.hourlyRate;
  const annualSalary = grossSalary * 12;

  const paye = calculatePAYE(annualSalary);
  const uif = calculateUIF(grossSalary);
  const sdl = calculateSDL(grossSalary);

  const totalDeductions = paye + uif + sdl;
  const netSalary = grossSalary - totalDeductions;

  return {
    grossSalary,
    paye,
    uif,
    sdl,
    totalDeductions,
    netSalary
  };
};
