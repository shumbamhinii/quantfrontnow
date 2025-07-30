import { Button } from 'antd'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { RefreshCw, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeaderProps {
  title?: string
  showActions?: boolean
}

export function Header ({ title, showActions = true }: HeaderProps) {
  return (
    <motion.header
      className='flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='flex items-center space-x-4'>
        <SidebarTrigger />
        {title && <h1 className='text-xl font-semibold'>{title}</h1>}
      </div>


    </motion.header>
  )
}
