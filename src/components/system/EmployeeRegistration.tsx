// src/pages/payroll/EmployeeRegistration.tsx
import React, { useState, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Radio,
  InputNumber,
  Space,
  Divider
} from 'antd';
import { UserAddOutlined, SaveOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { useToast } from '@/components/ui/use-toast';

import { type Employee } from '../payroll/PayrollDashboard';

const { Option } = Select;

interface JobRole {
  title: string;
  baseSalary?: number;
  defaultHourlyRate?: number;
}

const JOB_ROLES: JobRole[] = [
  { title: 'Software Developer', baseSalary: 35000, defaultHourlyRate: 200 },
  { title: 'Project Manager', baseSalary: 55000, defaultHourlyRate: 250 },
  { title: 'HR Specialist', baseSalary: 28000, defaultHourlyRate: 180 },
  { title: 'Sales Executive', baseSalary: 30000, defaultHourlyRate: 150 },
  { title: 'Accountant', baseSalary: 40000, defaultHourlyRate: 220 },
];

interface NewEmployeeFormData {
  name: string;
  position: string;
  email: string;
  idNumber: string;
  phone?: string;
  startDate: dayjs.Dayjs;
  paymentType: 'salary' | 'hourly';
  customSalary?: number;
  hourlyRate?: number;
  accountHolder: string;
  bank: string;
  accountNumber: string;
  branchCode: string;
}

interface EmployeeRegistrationProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const EmployeeRegistration: React.FC<EmployeeRegistrationProps> = ({ onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [paymentType, setPaymentType] = useState<'salary' | 'hourly'>('salary');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, []);

  const handleSubmit = async (values: NewEmployeeFormData) => {
    setIsLoading(true);

    const selectedJobRole = JOB_ROLES.find(role => role.title === values.position);

    const payload = {
      name: values.name,
      position: values.position,
      email: values.email,
      idNumber: values.idNumber,
      phone: values.phone || null,
      startDate: values.startDate.format('YYYY-MM-DD'),
      paymentType: values.paymentType,
      baseSalary:
        values.paymentType === 'salary'
          ? values.customSalary || selectedJobRole?.baseSalary || null
          : null,
      hourlyRate:
        values.paymentType === 'hourly'
          ? values.hourlyRate || selectedJobRole?.defaultHourlyRate || null
          : null,
      bankDetails: {
        accountHolder: values.accountHolder,
        bankName: values.bank,
        accountNumber: values.accountNumber,
        branchCode: values.branchCode,
      },
    };

    try {
      const response = await fetch('https://quantnow.onrender.com/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred.' }));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      toast({
        title: 'Employee Added',
        description: `${values.name} has been successfully added.`,
        variant: 'default',
      });

      form.resetFields();
      setPaymentType('salary');
      await onSuccess();
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast({
        title: 'Error',
        description: `Failed to add employee: ${error instanceof Error ? error.message : String(error)}.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (value: string) => {
    const selectedJobRole = JOB_ROLES.find(role => role.title === value);
    if (selectedJobRole) {
      form.setFieldsValue({
        customSalary: selectedJobRole.baseSalary,
        hourlyRate: selectedJobRole.defaultHourlyRate,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        title={
          <Space>
            <UserAddOutlined />
            Add New Employee
          </Space>
        }
        className='shadow-lg border-0'
        headStyle={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
        }}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          initialValues={{
            paymentType: 'salary',
            startDate: dayjs(),
          }}
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Form.Item
              name='name'
              label='Full Name'
              rules={[{ required: true, message: 'Please enter employee name' }]}
            >
              <Input placeholder='Enter full name' />
            </Form.Item>

            <Form.Item
              name='email'
              label='Email Address'
              rules={[
                { required: true, message: 'Please enter email address' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder='Enter email address' />
            </Form.Item>

            <Form.Item
              name='idNumber'
              label='ID Number'
              rules={[
                { required: true, message: 'Please enter ID number' },
                { pattern: /^\d{13}$/, message: 'ID number must be 13 digits' },
              ]}
            >
              <Input placeholder='Enter 13-digit ID number' />
            </Form.Item>

            <Form.Item name='phone' label='Phone Number'>
              <Input placeholder='Enter phone number' />
            </Form.Item>

            <Form.Item
              name='position'
              label='Job Position'
              rules={[{ required: true, message: 'Please select a position' }]}
            >
              <Select placeholder='Select job position' onChange={handleRoleChange}>
                {JOB_ROLES.map(role => (
                  <Option key={role.title} value={role.title}>
                    {role.title}{' '}
                    ({role.baseSalary ? `R${role.baseSalary}/month` : `R${role.defaultHourlyRate}/hour`})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name='startDate'
              label='Start Date'
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Divider>Payment Structure</Divider>

          <Form.Item name='paymentType' label='Payment Type' rules={[{ required: true }]}>
            <Radio.Group onChange={e => setPaymentType(e.target.value)}>
              <Radio value='salary'>Fixed Monthly Salary</Radio>
              <Radio value='hourly'>Hourly Rate</Radio>
            </Radio.Group>
          </Form.Item>

          {paymentType === 'salary' && (
            <Form.Item
              name='customSalary'
              label='Monthly Salary (R)'
              rules={[{ required: true, message: 'Please enter monthly salary' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder='Enter monthly salary'
                formatter={value => `R ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => Number(value!.replace(/R\s?|(,*)/g, ''))}
              />
            </Form.Item>
          )}

          {paymentType === 'hourly' && (
            <Form.Item
              name='hourlyRate'
              label='Hourly Rate (R)'
              rules={[{ required: true, message: 'Please enter hourly rate' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder='Enter hourly rate'
                formatter={value => `R ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => Number(value!.replace(/R\s?|(,*)/g, ''))}
              />
            </Form.Item>
          )}

          <Divider>Banking Details</Divider>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Form.Item
              name='accountHolder'
              label='Account Holder Name'
              rules={[{ required: true, message: 'Please enter account holder name' }]}
            >
              <Input placeholder='Enter account holder name' />
            </Form.Item>

            <Form.Item
              name='bank'
              label='Bank Name'
              rules={[{ required: true, message: 'Please select bank' }]}
            >
              <Select placeholder='Select bank'>
                <Option value='Standard Bank'>Standard Bank</Option>
                <Option value='FNB'>FNB</Option>
                <Option value='Nedbank'>Nedbank</Option>
                <Option value='ABSA'>ABSA</Option>
                <Option value='Capitec'>Capitec</Option>
                <Option value='Investec'>Investec</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name='accountNumber'
              label='Account Number'
              rules={[{ required: true, message: 'Please enter account number' }]}
            >
              <Input placeholder='Enter account number' />
            </Form.Item>

            <Form.Item
              name='branchCode'
              label='Branch Code'
              rules={[{ required: true, message: 'Please enter branch code' }]}
            >
              <Input placeholder='Enter branch code' />
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type='primary'
              htmlType='submit'
              icon={<SaveOutlined />}
              size='large'
              className='w-full bg-gradient-to-r from-blue-500 to-purple-600 border-0 hover:from-blue-600 hover:to-purple-700'
              loading={isLoading}
            >
              Add Employee
            </Button>
            <Button
              type='default'
              onClick={onClose}
              size='large'
              className='w-full mt-2'
              disabled={isLoading}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  );
};

export default EmployeeRegistration;