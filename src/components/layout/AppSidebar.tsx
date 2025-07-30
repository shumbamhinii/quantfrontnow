import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom' // Import useNavigate
import {
  Home,
  CheckSquare,
  CreditCard,
  BarChart3,
  Upload,
  TrendingUp,
  FileText,
  MessageSquare,
  FolderOpen,
  Calculator,
  Users,
  Settings,
  User,
  LogOut, // Import LogOut icon
  Package, // New icon for Products
  DollarSign, // New icon for Credits
  Wallet, // New icon for Cash
  ChevronUp, // For dropdown indicator
  ChevronDown // For dropdown indicator
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MoneyCollectFilled } from '@ant-design/icons'
import { useToast } from '@/components/ui/use-toast' // Import useToast
import { useAuth } from '@/AuthPage' // Import useAuth from LoginPage.tsx

// Define a type for navigation items to support nesting
interface NavigationItem {
  title: string;
  url: string;
  icon: React.ElementType;
  children?: NavigationItem[]; // Added for nested items
}

const navigationItems: NavigationItem[] = [
  { title: 'Dashboard', url: '/', icon: Home },
    {
    title: 'POS Transact',
    url: '/pos',
    icon: CreditCard,
    children: [
      { title: 'Products', url: '/pos/products', icon: Package },
      { title: 'Credits', url: '/pos/credits', icon: DollarSign },
      { title: 'Cash', url: '/pos/cash', icon: Wallet }
    ]
  },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Transactions', url: '/transactions', icon: CreditCard },
  { title: 'Financials', url: '/financials', icon: BarChart3 },
  { title: 'Import', url: '/import', icon: Upload },
  { title: 'Data Analytics', url: '/analytics', icon: TrendingUp }
]

const businessItems: NavigationItem[] = [
  { title: 'Invoice/Quote', url: '/invoice-quote', icon: FileText },
  { title: 'Payroll', url: '/payroll', icon: Calculator },
  {
    title: 'POS Admin',
    url: '/pos',
    icon: CreditCard,
    children: [
      { title: 'Products', url: '/pos/products', icon: Package },
      { title: 'Credits', url: '/pos/credits', icon: DollarSign },
      { title: 'Cash', url: '/pos/cash', icon: Wallet }
    ]
  },
  { title: 'Projections', url: '/projections', icon: TrendingUp }, // Reusing TrendingUp, consider a different icon if available
  { title: 'Accounting Setup', url: '/accounting', icon: Calculator }, // Reusing Calculator
  { title: 'Document Management', url: '/documents', icon: FolderOpen }, // Changed icon to FolderOpen from FileSpreadsheet
  { title: 'Qx Chat', url: '/quant-chat', icon: MessageSquare }
]

const setupItems: NavigationItem[] = [
  { title: 'Personel Setup', url: '/personel-setup', icon: Users },
  { title: 'Profile Setup', url: '/profile-setup', icon: Settings } // Changed icon to Settings from User
]

export function AppSidebar () {
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate() // Initialize useNavigate
  const { toast } = useToast() // Initialize useToast
  const { logout } = useAuth() // Get the logout function from the authentication context

  const currentPath = location.pathname

  // State to manage the expansion of the POS sub-menu
  const [isPosSubMenuOpen, setIsPosSubMenuOpen] = useState(false);

  // Effect to automatically open POS submenu if a child route is active on initial load or navigation
  // This effect will only run when currentPath changes.
  useEffect(() => {
    // Check if the current path starts with '/pos' (including '/pos' itself or any sub-route)
    const isAnyPosRouteActive = currentPath.startsWith('/pos');
    // Set the submenu open state based on whether a POS route is active.
    // This ensures it's open when a child is active, or when /pos is directly visited.
    setIsPosSubMenuOpen(isAnyPosRouteActive);
  }, [currentPath]); // Dependency on currentPath ensures it reacts to navigation

  // Modified getNavCls to apply more distinct styling for the active tab
  const getNavCls = (active: boolean) =>
    `flex items-center w-full px-3 py-2 rounded-md transition-colors duration-200
      ${active
        ? 'bg-blue-600 text-white font-bold shadow-sm' // Stronger active state with blue background
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-50' // Default and hover states
      }`

  const handleLogout = () => {
    logout(); // Clear authentication state
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      variant: 'default',
    });
    navigate('/login'); // Redirect to the login page
  };

  return (
    <Sidebar className='border-r bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50'>
      <SidebarHeader className='p-4 border-b border-gray-200 dark:border-gray-700'>
        <motion.div
          className='flex items-center space-x-2'
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-sm'>Q</span>
          </div>
          {state === 'expanded' && (
            <div>
              <h1 className='font-bold text-lg'>Quantilytix</h1>
              <p className='text-xs text-muted-foreground'>
                unlocking endless possibilities
              </p>
            </div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className='flex-1 overflow-y-auto'>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }} // Adjusted delay for smoother animation
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => getNavCls(isActive)}
                      >
                        <item.icon className='h-5 w-5' /> {/* Increased icon size slightly */}
                        {state === 'expanded' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Business Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (index + navigationItems.length) * 0.05 }} // Adjusted delay
                >
                  {item.children ? ( // Special handling for items with children (like POS)
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            // No e.preventDefault() here. Let NavLink handle the navigation.
                            // The onClick will now only toggle the submenu state.
                            onClick={() => setIsPosSubMenuOpen(prev => !prev)}
                            // Highlight if current path is exactly /pos OR starts with /pos/ (for any sub-route)
                            className={({ isActive }) => getNavCls(isActive || currentPath.startsWith(item.url))}
                          >
                            <item.icon className='h-5 w-5' />
                            {state === 'expanded' && (
                              <span className="flex-1">{item.title}</span>
                            )}
                            {state === 'expanded' && ( // Add a dropdown indicator
                              isPosSubMenuOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Sub-menu items for POS - only show if POS is expanded AND sidebar is expanded */}
                      {isPosSubMenuOpen && state === 'expanded' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden" // Ensures smooth height transition
                        >
                          <div className="pl-6 py-1"> {/* Indent and add vertical padding */}
                            {item.children.map((child, childIndex) => (
                              <motion.div
                                key={child.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: childIndex * 0.05 }}
                              >
                                <SidebarMenuItem>
                                  <SidebarMenuButton asChild>
                                    <NavLink
                                      to={child.url}
                                      className={({ isActive }) => getNavCls(isActive)}
                                      // No need to explicitly set isPosSubMenuOpen(true) here,
                                      // as the useEffect handles keeping it open if a child route is active.
                                    >
                                      <child.icon className='h-5 w-5' />
                                      {state === 'expanded' && <span>{child.title}</span>}
                                    </NavLink>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    // Regular menu item (no children)
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) => getNavCls(isActive)}
                        >
                          {item.icon === MoneyCollectFilled ? (
                              <MoneyCollectFilled style={{ fontSize: '20px' }} />
                          ) : (
                              <item.icon className='h-5 w-5' />
                          )}
                          {state === 'expanded' && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Setup</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {setupItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (index + navigationItems.length + businessItems.length) * 0.05 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => getNavCls(isActive)}
                      >
                        <item.icon className='h-5 w-5' />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='p-4 border-t border-gray-200 dark:border-gray-700'>
        {/* User Info */}
        <div className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
          <User className='h-5 w-5' />
          {state === 'expanded' && <span>Helper</span>}
        </div>

        {/* Logout Button */}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleLogout} className='w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'>
            <LogOut className='h-5 w-5' />
            {state === 'expanded' && <span>Logout</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}
