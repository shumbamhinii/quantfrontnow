import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { DashboardCharts } from '../components/dashboard/DashboardCharts'
import { StatsCards } from '../components/dashboard/StatsCards'
import { ClientsTable } from '../components/dashboard/ClientsTable' // Assuming ClientsTable also needs date filtering
import { motion } from 'framer-motion'

// Import your date picker component. Examples:
// import { DatePicker } from 'antd'; // For Ant Design
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // For Material-UI X
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // For Material-UI X
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // For Material-UI X (or your chosen adapter)

const Dashboard = () => {
  // State to hold the selected date range
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Dashboard' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Date Range Pickers */}
        <div className="mb-4 flex space-x-4 items-end">
          <div>
            <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700">Start Date:</label>
            {/* Replace this input with your actual DatePicker component for Start Date */}
            <input
              id="start-date-filter"
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleStartDateChange(e.target.value ? new Date(e.target.value) : null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
            {/* Example with a UI library (Ant Design or MUI X) */}
            {/*
            <DatePicker onChange={handleStartDateChange} value={startDate} />
            OR
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
            */}
          </div>
          <div>
            <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700">End Date:</label>
            {/* Replace this input with your actual DatePicker component for End Date */}
            <input
              id="end-date-filter"
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleEndDateChange(e.target.value ? new Date(e.target.value) : null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
            {/* Example with a UI library (Ant Design or MUI X) */}
            {/*
            <DatePicker onChange={handleEndDateChange} value={endDate} />
            OR
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
            */}
          </div>
        </div>

        {/* Pass the start and end dates as props to your components */}
        <StatsCards startDate={startDate} endDate={endDate} />
        <DashboardCharts startDate={startDate} endDate={endDate} />
        {/* <ClientsTable startDate={startDate} endDate={endDate} /> */} {/* Uncomment if ClientsTable also needs filtering */}
      </motion.div>
    </div>
  )
}

export default Dashboard