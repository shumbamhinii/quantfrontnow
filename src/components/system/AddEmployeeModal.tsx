import React, { useState } from 'react';
import { Button } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

// ✅ Import the EmployeeRegistration form
import EmployeeRegistration from './EmployeeRegistration';

interface AddEmployeeModalProps {
  onEmployeeActionSuccess: () => Promise<void>; // Used to refresh employee list in PayrollDashboard
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onEmployeeActionSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Called when employee is added or edited successfully
  const handleRegistrationSuccess = async () => {
    setIsOpen(false); // Close the modal
    await onEmployeeActionSuccess(); // Refresh the employee list in parent
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type='primary'
          icon={<UserAddOutlined />}
          size='large'
          className='bg-gradient-to-r from-blue-500 to-purple-600 border-0 hover:from-blue-600 hover:to-purple-700'
        >
          Add Employee
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Add New Employee
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Pass isOpen prop (required by EmployeeRegistration) */}
        <EmployeeRegistration
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={handleRegistrationSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
