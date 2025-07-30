import React from 'react'; // Keep React import for JSX
import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { motion } from 'framer-motion';

const Tasks = () => {
  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Tasks' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <KanbanBoard />
      </motion.div>
    </div>
  );
};

export default Tasks;
