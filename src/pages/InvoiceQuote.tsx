import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { InvoiceQuoteTabs } from '@/components/invoice/InvoiceQuoteTabs'
import { motion } from 'framer-motion'

const InvoiceQuote = () => {
  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Invoice / Quote Management' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <InvoiceQuoteTabs />
      </motion.div>
    </div>
  )
}

export default InvoiceQuote
