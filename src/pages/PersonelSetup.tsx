import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { motion } from 'framer-motion'
import { SystemTabs } from '../components/system/SystemTabs'

const PersonelSetup = () => {
  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Personel Management' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <SystemTabs />
      </motion.div>
    </div>
  )
}

export default PersonelSetup
