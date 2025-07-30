import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Space, Statistic, Button } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../components/ui/tabs';
import { EmployeeList } from '../system/EmployeeList'; // Assuming this component exists
import PayslipGenerator from '../payroll/PayslipGenerator';
import EmployeeRegistration from '../system/EmployeeRegistration'; // Renamed from AddEmployeeModal
import TimeTracking from './TimeTracking';
import { Header } from '../layout/Header';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthPage';

const { Title } = Typography;

// Define Employee type to match backend API response
interface BankDetails {
  account_holder: string;
  bank_name: string;
  account_number: string;
  branch_code: string;
}

export interface Employee {
  id: string; // Changed to string (UUID)
  name: string;
  position: string | null;
  email: string;
  id_number: string; // Matches backend id_number
  phone: string | null;
  start_date: string; // Date string
  payment_type: 'hourly' | 'salary';
  base_salary: number | null; // For salaried employees
  hourly_rate: number | null; // For hourly employees
  hours_worked_total: number; // Sum of hours from time_entries, fetched from backend
  bank_details: BankDetails; // Ensure this is parsed as an object from backend
}

const API_BASE_URL = 'https://quantnow.onrender.com'; // Define your API base URL

const PayrollDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null); // New state for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // New state for edit modal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // Function to fetch employees from the backend
  const fetchEmployees = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for employee data.');
      setEmployees([]);
      setLoading(false);
      setError('Please log in to view payroll data.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(), // Include the JWT token
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: Employee[] = await response.json();
      setEmployees(data);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(`Failed to load employees: ${err.message || String(err)}`);
      setEmployees([]); // Clear employees on error
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchEmployees();
    } else {
      setEmployees([]);
      setLoading(false);
      setError('Please log in to view payroll data.');
    }
  }, [fetchEmployees, isAuthenticated, token]);

  const handleEmployeeActionSuccess = async () => {
    // This function will be called from EmployeeRegistration after successful API call
    await fetchEmployees();
    // After any action, ensure no employee is selected for payslip if the list changes significantly
    setSelectedEmployee(null);
    setEditingEmployee(null);
    setIsEditModalOpen(false);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  // Calculate dashboard statistics from fetched employees
  const totalEmployees = employees.length;
  const totalHours = employees.reduce((sum, emp) => {
    return sum + (emp.hours_worked_total || 0);
  }, 0);

  const totalPayroll = employees.reduce((sum, emp) => {
    if (emp.payment_type === 'salary' && emp.base_salary) {
      return sum + emp.base_salary;
    }
    if (emp.payment_type === 'hourly' && emp.hourly_rate) {
      return sum + (emp.hours_worked_total || 0) * emp.hourly_rate;
    }
    return sum;
  }, 0);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
        <p className='ml-2 text-lg'>Loading payroll data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-red-600'>
        <p className='text-lg font-semibold'>Error: {error}</p>
        <Button onClick={fetchEmployees} className='mt-4'>Retry Loading</Button>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-hidden'>
      <motion.div
        className='p-6 h-full overflow-y-auto'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <Header title='Payroll Management' />

        <Row gutter={[24, 24]} className='m-8'>
          <Col xs={24} sm={12} lg={8}>
            <motion.div variants={itemVariants}>
              <Card className='text-center shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300'>
                <Space direction='vertical' size='small'>
                  <TeamOutlined className='text-3xl text-blue-600' />
                  <Statistic title='Total Employees' value={totalEmployees} />
                </Space>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <motion.div variants={itemVariants}>
              <Card className='text-center shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300'>
                <Space direction='vertical' size='small'>
                  <UserOutlined className='text-3xl text-green-600' />
                  <Statistic title='Total Hours' value={totalHours} />
                </Space>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <motion.div variants={itemVariants}>
              <Card className='text-center shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300'>
                <Space direction='vertical' size='small'>
                  <DollarOutlined className='text-3xl text-purple-600' />
                  <Statistic
                    title='Total Payroll'
                    value={totalPayroll}
                    prefix='R'
                    precision={2}
                  />
                </Space>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue='employees' className='w-full'>
            <TabsList className='grid w-full grid-cols-2 mb-6'>
              <TabsTrigger
                value='employees'
                className='flex items-center gap-2'
              >
                <TeamOutlined />
                Employee Management
              </TabsTrigger>
              <TabsTrigger
                value='time-tracking'
                className='flex items-center gap-2'
              >
                <ClockCircleOutlined />
                Time Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value='employees' className='space-y-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>Employee Management</h2>
                {/* Employee Registration Modal (formerly AddEmployeeModal) */}

                <Button
                  type='primary'
                  onClick={() => {
                    setEditingEmployee(null); // Clear any previous editing state
                    setIsEditModalOpen(true); // Open for adding new employee
                  }}
                >
                  Add New Employee
                </Button>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2'>
                  <EmployeeList
                    employees={employees}
                    onEmployeeActionSuccess={handleEmployeeActionSuccess}
                    onSelectEmployee={setSelectedEmployee}
                    selectedEmployee={selectedEmployee}
                    onEditEmployee={handleEditEmployee} // Pass the new edit handler
                  />
                </div>
                <div className='lg:col-span-1'>
                  <PayslipGenerator employee={selectedEmployee} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value='time-tracking' className='space-y-6'>
              <TimeTracking
                employees={employees}
                onUpdateEmployeeHours={handleEmployeeActionSuccess} // This will trigger fetchEmployees
                onTimeEntryActionSuccess={handleEmployeeActionSuccess} // Pass to refresh dashboard stats
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PayrollDashboard;
