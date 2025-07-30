import React from 'react';
import {
  Card,
  Button,
  Descriptions,
  Space,
  Typography,
  Divider,
  Alert
} from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
// Import Employee type from PayrollDashboard for consistency
import { type Employee } from '../payroll/PayrollDashboard';
import { useAuth } from '../../AuthPage'; // Import useAuth

const { Title, Text } = Typography;

// Define PayrollCalculation type for consistency (assuming it's in utils/payrollCalculations)
interface PayrollCalculation {
  grossSalary: number;
  paye: number;
  uif: number;
  sdl: number;
  totalDeductions: number;
  netSalary: number;
}

// Dummy calculatePayroll for demonstration. Replace with your actual utility.
// This function needs to handle the Employee interface coming from the backend API.
const calculatePayroll = (employee: Employee): PayrollCalculation => {
  let grossSalary = 0;
  // Ensure base_salary and hourly_rate are treated as numbers, defaulting to 0 if null/undefined
  const baseSalary = parseFloat(employee.base_salary as any) ?? 0; // Explicitly parse
  const hourlyRate = parseFloat(employee.hourly_rate as any) ?? 0; // Explicitly parse
  const hoursWorkedTotal = parseFloat(employee.hours_worked_total as any) ?? 0; // Explicitly parse

  if (employee.payment_type === 'salary') {
    grossSalary = baseSalary;
  } else if (employee.payment_type === 'hourly') {
    grossSalary = hoursWorkedTotal * hourlyRate;
  }

  // Example simplified tax calculations (replace with your actual logic)
  const paye = grossSalary * 0.18; // Example PAYE
  const uif = Math.min(grossSalary * 0.01, 177.12); // Example UIF cap
  const sdl = grossSalary * 0.01; // Example SDL

  const totalDeductions = paye + uif + sdl;
  const netSalary = grossSalary - totalDeductions;

  return {
    grossSalary,
    paye,
    uif,
    sdl,
    totalDeductions,
    netSalary,
  };
};


interface PayslipGeneratorProps {
  employee: Employee | null;
}

const PayslipGenerator: React.FC<PayslipGeneratorProps> = ({ employee }) => {
  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token

  // Log the employee object received
  console.log("PayslipGenerator received employee:", employee);

  const payrollData: PayrollCalculation | null = employee
    ? calculatePayroll(employee)
    : null;

  // Log the calculated payroll data
  console.log("PayslipGenerator calculated payrollData:", payrollData);

  // If not authenticated, display a message
  if (!isAuthenticated || !token) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'
          headStyle={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          title='Payslip Generator'
        >
          <div className='text-center py-8'>
            <FileTextOutlined className='text-6xl text-gray-300 mb-4' />
            <Text className='text-gray-500'>
              Please log in to generate payslips.
            </Text>
          </div>
        </Card>
      </motion.div>
    );
  }


  const generatePDF = () => {
    if (!employee || !payrollData) {
      console.error("Cannot generate PDF: employee or payrollData is missing.");
      return;
    }

    const pdf = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-ZA');

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYSLIP', 105, 30, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Company Name (Pty) Ltd', 105, 40, { align: 'center' });
    pdf.text('123 Business Street, Cape Town, 8001', 105, 50, {
      align: 'center'
    });

    // Employee Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employee Details', 20, 80);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${employee.name}`, 20, 95);
    pdf.text(`Position: ${employee.position || 'N/A'}`, 20, 105);
    pdf.text(`ID Number: ${employee.id_number || 'N/A'}`, 20, 115); // Use id_number, add N/A fallback
    pdf.text(`Email: ${employee.email}`, 20, 125);
    pdf.text(`Pay Period: ${currentDate}`, 120, 95);

    // Earnings
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Earnings', 20, 150);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Hours Worked: ${employee.hours_worked_total ?? 0}h`, 20, 165); // Use hours_worked_total
    pdf.text(`Rate: R${(employee.payment_type === 'hourly' ? (parseFloat(employee.hourly_rate as any) ?? 0) : (parseFloat(employee.base_salary as any) ?? 0)).toFixed(2)}`, 20, 175); // Explicitly parse and default to 0
    pdf.text(`Gross Salary: R${payrollData.grossSalary.toFixed(2)}`, 20, 185);

    // Deductions
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Deductions', 20, 210);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`PAYE: R${payrollData.paye.toFixed(2)}`, 20, 225);
    pdf.text(`UIF: R${payrollData.uif.toFixed(2)}`, 20, 235);
    pdf.text(`SDL: R${payrollData.sdl.toFixed(2)}`, 20, 245);
    pdf.text(
      `Total Deductions: R${payrollData.totalDeductions.toFixed(2)}`,
      20,
      255
    );

    // Net Salary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Net Salary: R${payrollData.netSalary.toFixed(2)}`, 20, 280);

    // Bank Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Banking Details', 120, 150);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    // Access properties directly from the employee object as they come from the API join
    pdf.text(`Bank: ${employee.bank_name || 'N/A'}`, 120, 165);
    // Use employee.bankDetails for accountHolder as it's a nested object on the frontend type
    pdf.text(`Account Holder: ${employee.bankDetails?.account_holder || 'N/A'}`, 120, 175);
    pdf.text(`Account Number: ${employee.account_number || 'N/A'}`, 120, 185);
    pdf.text(`Branch Code: ${employee.branch_code || 'N/A'}`, 120, 195);


    pdf.save(
      `payslip-${employee.name
        .replace(/\s+/g, '-')
        .toLowerCase()}-${currentDate}.pdf`
    );
  };

  if (!employee) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'
          headStyle={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          title='Payslip Generator'
        >
          <div className='text-center py-8'>
            <FileTextOutlined className='text-6xl text-gray-300 mb-4' />
            <Text className='text-gray-500'>
              Select an employee to generate payslip
            </Text>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Ensure payrollData is not null before accessing its properties
  if (!payrollData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'
          headStyle={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          title='Payslip Generator'
        >
          <div className='text-center py-8'>
            <FileTextOutlined className='text-6xl text-gray-300 mb-4' />
            <Text className='text-gray-500'>
              Error calculating payroll for the selected employee. Please check employee data.
            </Text>
          </div>
        </Card>
      </motion.div>
    );
  }

  const employeeItems = [
    {
      key: 'name',
      label: 'Employee Name',
      children: employee.name
    },
    {
      key: 'position',
      label: 'Position',
      children: employee.position || 'N/A' // Add N/A fallback
    },
    {
      key: 'id_number', // Use id_number
      label: 'ID Number',
      children: employee.id_number || 'N/A' // Add N/A fallback
    },
    {
      key: 'email',
      label: 'Email',
      children: employee.email
    }
  ];

  const earningsItems = [
    {
      key: 'hours',
      label: 'Total Hours Worked', // Changed label
      children: `${employee.hours_worked_total ?? 0}h` // Use hours_worked_total
    },
    {
      key: 'rate',
      label: employee.payment_type === 'hourly' ? 'Hourly Rate' : 'Base Salary', // Dynamic label
      // Ensure parsing to float before toFixed
      children: `R${(employee.payment_type === 'hourly' ? (parseFloat(employee.hourly_rate as any) ?? 0) : (parseFloat(employee.base_salary as any) ?? 0)).toFixed(2)}`
    },
    {
      key: 'gross',
      label: 'Gross Salary',
      children: (
        <Text strong className='text-green-600'>
          R{payrollData.grossSalary.toFixed(2)}
        </Text>
      )
    }
  ];

  const deductionItems = [
    {
      key: 'paye',
      label: 'PAYE',
      children: `R${payrollData.paye.toFixed(2)}`
    },
    {
      key: 'uif',
      label: 'UIF',
      children: `R${payrollData.uif.toFixed(2)}`
    },
    {
      key: 'sdl',
      label: 'SDL',
      children: `R${payrollData.sdl.toFixed(2)}`
    },
    {
      key: 'total',
      label: 'Total Deductions',
      children: (
        <Text strong className='text-red-600'>
          R{payrollData.totalDeductions.toFixed(2)}
        </Text>
      )
    }
  ];

  const bankItems = [
    {
      key: 'bank',
      label: 'Bank',
      children: employee.bank_name || 'N/A' // Access directly from employee object, add N/A fallback
    },
    {
      key: 'holder',
      label: 'Account Holder',
      // Accessing bankDetails.account_holder, ensure bankDetails is present
      children: employee.bankDetails?.account_holder || 'N/A' // Use optional chaining for bankDetails, add N/A fallback
    },
    {
      key: 'number',
      label: 'Account Number',
      children: employee.account_number || 'N/A' // Access directly from employee object, add N/A fallback
    },
    {
      key: 'branch',
      label: 'Branch Code',
      children: employee.branch_code || 'N/A' // Access directly from employee object, add N/A fallback
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'
        headStyle={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
        title='Payslip Generator'
      >
        <Space direction='vertical' size='large' className='w-full'>
          <Alert
            message='South African Tax Compliant'
            description='Calculations include PAYE, UIF, and SDL as per SARS regulations'
            type='info'
            showIcon
          />

          <Descriptions
            title='Employee Details'
            bordered
            size='small'
            column={1}
            items={employeeItems}
          />

          <Descriptions
            title='Earnings'
            bordered
            size='small'
            column={1}
            items={earningsItems}
          />

          <Descriptions
            title='Deductions'
            bordered
            size='small'
            column={1}
            items={deductionItems}
          />

          <Descriptions
            title='Banking Details'
            bordered
            size='small'
            column={1}
            items={bankItems}
          />

          <Divider>Net Salary</Divider>

          <div className='text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200'>
            <Title level={3} className='text-green-700 mb-0'>
              R{payrollData.netSalary.toFixed(2)}
            </Title>
          </div>

          <Button
            type='primary'
            size='large'
            icon={<DownloadOutlined />}
            onClick={generatePDF}
            className='w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0'
          >
            Generate & Download Payslip
          </Button>
        </Space>
      </Card>
    </motion.div>
  );
};

export default PayslipGenerator;
