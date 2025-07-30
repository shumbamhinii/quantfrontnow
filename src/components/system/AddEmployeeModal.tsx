import React, { useState } from 'react';
import { Button } from 'antd'; // Assuming Ant Design Button is still desired for trigger
import { UserAddOutlined } from '@ant-design/icons'; // Assuming Ant Design icon is still desired
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'; // Assuming shadcn/ui Dialog components

// Import the new EmployeeRegistration component
import EmployeeRegistration from './EmployeeRegistration';

// Define props for this wrapper component
interface AddEmployeeModalProps {
  onEmployeeActionSuccess: () => Promise<void>; // Callback to refresh employee list in parent (PayrollDashboard)
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onEmployeeActionSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);

  // This function will be called by EmployeeRegistration upon successful submission
  const handleRegistrationSuccess = async () => {
    setIsOpen(false); // Close the modal
    await onEmployeeActionSuccess(); // Trigger parent to re-fetch employees
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
        {/* Render the EmployeeRegistration form inside the dialog */}
        <EmployeeRegistration
          onClose={() => setIsOpen(false)} // Pass a close handler to the form
          onSuccess={handleRegistrationSuccess} // Pass the success handler to the form
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;
