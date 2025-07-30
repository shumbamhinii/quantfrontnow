import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, CreditCard, Calculator, Play } from 'lucide-react';
import { useAuth } from '../AuthPage'; // Import useAuth

// Updated interfaces to match backend and database schemas
interface Asset {
  id: string;
  type: string;
  name: string;
  number: string;
  cost: number;
  date_received: string; // Changed to match backend snake_case
  account_id: string; // Added to match backend
  account_name: string; // Added for display purposes (fetched from backend)
  depreciation_method?: string; // New: straight-line, declining-balance, etc.
  useful_life_years?: number;   // New: in years
  salvage_value?: number;       // New: residual value
  accumulated_depreciation: number; // New: total depreciation taken
  last_depreciation_date?: string; // New: last date depreciation was run for this asset
}

// Renamed from ExpenseType to Expense and expanded to match backend 'expenses' table
interface Expense {
  id: string;
  name: string;
  details: string;
  category: string; // Still used, but acknowledge backend allows null
  amount: number; // Added to match backend
  date: string; // Added to match backend
  account_id: string; // Added to match backend
  account_name: string; // Added for display purposes (fetched from backend)
}

interface Account {
  id: string;
  code: string; // Added to match backend
  name: string;
  type: string; // Changed from category to type to match backend
}

const Accounting = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'asset', 'expense', 'account'
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<any>({}); // Used for both add and edit forms

  const [isDepreciating, setIsDepreciating] = useState(false);
  const [depreciationEndDate, setDepreciationEndDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'asset' | 'expense' | 'account', id: string } | null>(null);

  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token

  const fetchAssets = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for assets.');
      setAssets([]);
      return;
    }
    try {
      const response = await fetch('https://quantnow.onrender.com/assets', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      // Handle token expiration/invalidity here if needed, e.g., logout user
    }
  }, [token]);

  const fetchExpenses = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for expenses.');
      setExpenses([]);
      return;
    }
    try {
      const response = await fetch('https://quantnow.onrender.com/expenses', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }, [token]);

  const fetchAccounts = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for accounts.');
      setAccounts([]);
      return;
    }
    try {
      const response = await fetch('https://quantnow.onrender.com/accounts', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }, [token]);


  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAssets();
      fetchExpenses();
      fetchAccounts();
    } else {
      setAssets([]);
      setExpenses([]);
      setAccounts([]);
    }
  }, [fetchAssets, fetchExpenses, fetchAccounts, isAuthenticated, token]);

  const clearForm = () => setFormData({});

  const handleEdit = (item: Asset | Expense | Account, type: 'asset' | 'expense' | 'account') => {
    setModalType(type);
    setFormData({ ...item, dateReceived: (item as Asset).date_received, date: (item as Expense).date }); // Populate form with item data
    setIsModalVisible(true);
  };

  const handleDeleteClick = (id: string, type: 'asset' | 'expense' | 'account') => {
    setItemToDelete({ id, type });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (!token) {
      console.warn('No token found. Cannot delete item.');
      alert('You are not authenticated. Please log in.');
      setShowDeleteConfirm(false);
      return;
    }

    const { id, type } = itemToDelete;
    let url = '';
    let successMessage = '';
    let errorMessage = '';

    if (type === 'asset') {
      url = `https://quantnow.onrender.com/assets/${id}`;
      successMessage = 'Asset deleted successfully!';
      errorMessage = 'Failed to delete asset.';
    } else if (type === 'expense') {
      url = `https://quantnow.onrender.com/expenses/${id}`;
      successMessage = 'Expense deleted successfully!';
      errorMessage = 'Failed to delete expense.';
    } else if (type === 'account') {
      url = `https://quantnow.onrender.com/accounts/${id}`;
      successMessage = 'Account deleted successfully!';
      errorMessage = 'Failed to delete account.';
    }

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });

      if (response.ok) {
        alert(successMessage);
        if (type === 'asset') fetchAssets();
        else if (type === 'expense') fetchExpenses();
        else if (type === 'account') fetchAccounts();
      } else {
        const errorData = await response.json();
        alert(`${errorMessage} ${errorData.detail || errorData.error}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`${errorMessage} Check console for details.`);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };


  const handleSubmit = async () => {
    if (!token) {
      console.warn('No token found. Cannot submit data.');
      alert('You are not authenticated. Please log in.');
      return;
    }

    try {
      let url = '';
      let method = '';
      let payload: any = {};

      if (modalType === 'asset') {
        const cost = Number(formData.cost);
        const usefulLifeYears = formData.usefulLifeYears ? Number(formData.usefulLifeYears) : null;
        const salvageValue = formData.salvageValue ? Number(formData.salvageValue) : null;

        if (
          !formData.type ||
          !formData.name ||
          isNaN(cost) ||
          !formData.dateReceived ||
          !formData.account_id
        ) {
          alert('Please fill in all asset fields correctly (Type, Name, Cost, Date Received, Account)');
          return;
        }

        payload = {
          type: formData.type,
          name: formData.name,
          number: formData.number || null,
          cost: cost,
          date_received: formData.dateReceived,
          account_id: formData.account_id,
          depreciation_method: formData.depreciationMethod || null,
          useful_life_years: usefulLifeYears,
          salvage_value: salvageValue,
        };

        if (formData.id) { // Editing existing asset
          url = `https://quantnow.onrender.com/assets/${formData.id}`;
          method = 'PUT';
        } else { // Adding new asset
          url = 'https://quantnow.onrender.com/assets';
          method = 'POST';
        }
      } else if (modalType === 'expense') {
        const amount = Number(formData.amount);
        if (
          !formData.name ||
          isNaN(amount) ||
          !formData.date ||
          !formData.account_id
        ) {
          alert('Please fill in all expense fields correctly (Name, Amount, Date, Account)');
          return;
        }
        payload = {
          name: formData.name,
          details: formData.details || null,
          category: formData.category || null,
          amount: amount,
          date: formData.date,
          account_id: formData.account_id,
        };
        if (formData.id) { // Editing existing expense
          url = `https://quantnow.onrender.com/expenses/${formData.id}`;
          method = 'PUT';
        } else { // Adding new expense
          url = 'https://quantnow.onrender.com/expenses';
          method = 'POST';
        }
      } else if (modalType === 'account') {
        if (!formData.type || !formData.name || !formData.code) {
          alert('Please fill in all account fields correctly (Type, Name, Code)');
          return;
        }
        payload = {
          type: formData.type,
          name: formData.name,
          code: formData.code,
        };
        if (formData.id) { // Editing existing account
          url = `https://quantnow.onrender.com/accounts/${formData.id}`;
          method = 'PUT';
        } else { // Adding new account
          url = 'https://quantnow.onrender.com/accounts';
          method = 'POST';
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        if (modalType === 'asset') fetchAssets();
        else if (modalType === 'expense') fetchExpenses();
        else if (modalType === 'account') fetchAccounts();
        alert(`${modalType} ${formData.id ? 'updated' : 'added'} successfully!`);
      } else {
        alert(`Failed to ${formData.id ? 'update' : 'add'} ${modalType}: ${result.detail || result.error}`);
      }
      setIsModalVisible(false);
      clearForm();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit data, please try again.');
    }
  };

  const handleRunDepreciation = async () => {
    if (!token) {
      console.warn('No token found. Cannot run depreciation.');
      alert('You are not authenticated. Please log in.');
      return;
    }
    setIsDepreciating(true);
    try {
      const response = await fetch('https://quantnow.onrender.com/api/depreciation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify({ endDate: depreciationEndDate }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Depreciation run successfully! Total depreciation: R${data.totalDepreciationExpense.toFixed(2)}`);
        fetchAssets(); // Refresh assets to show updated accumulated depreciation
      } else {
        alert(`Failed to run depreciation: ${data.detail || data.error}`);
      }
    } catch (error) {
      console.error('Error running depreciation:', error);
      alert('Failed to run depreciation. Check console for details.');
    } finally {
      setIsDepreciating(false);
    }
  };


  const handleModalClose = () => {
    setIsModalVisible(false);
    clearForm();
  };

  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Accounting' />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='assets'>Assets</TabsTrigger>
            <TabsTrigger value='expenses'>Expenses</TabsTrigger>
            <TabsTrigger value='accounts'>Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value='assets'>
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle className='flex items-center gap-2'>
                    <Building className='h-5 w-5' /> Assets
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='date'
                      value={depreciationEndDate}
                      onChange={(e) => setDepreciationEndDate(e.target.value)}
                      className='w-auto'
                      title='Select end date for depreciation calculation'
                    />
                    <Button
                      onClick={handleRunDepreciation}
                      disabled={isDepreciating}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      {isDepreciating ? 'Running...' : <><Play className='h-4 w-4 mr-2' /> Run Depreciation</>}
                    </Button>
                    <Button
                      onClick={() => {
                        clearForm();
                        setModalType('asset');
                        setIsModalVisible(true);
                      }}
                    >
                      <Plus className='h-4 w-4 mr-2' /> Add Asset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date Received</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Depreciation Method</TableHead>
                      <TableHead>Useful Life (Years)</TableHead>
                      <TableHead>Salvage Value</TableHead>
                      <TableHead>Accumulated Depreciation</TableHead>
                      <TableHead>Net Book Value</TableHead>
                      <TableHead>Last Depr. Date</TableHead>
                      <TableHead>Actions</TableHead> {/* Added Actions column */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map(asset => {
                      const netBookValue = asset.cost - asset.accumulated_depreciation;
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <Badge>{asset.type}</Badge>
                          </TableCell>
                          <TableCell>{asset.name}</TableCell>
                          <TableCell>R{(+asset.cost || 0).toFixed(2)}</TableCell>
                          <TableCell>{new Date(asset.date_received).toLocaleDateString()}</TableCell>
                          <TableCell>{asset.account_name}</TableCell>
                          <TableCell>{asset.depreciation_method || 'N/A'}</TableCell>
                          <TableCell>{asset.useful_life_years || 'N/A'}</TableCell>
                          <TableCell>R{(+asset.salvage_value || 0).toFixed(2)}</TableCell>
                          <TableCell>R{(+asset.accumulated_depreciation || 0).toFixed(2)}</TableCell>
                          <TableCell>R{(+netBookValue).toFixed(2)}</TableCell>
                          <TableCell>{asset.last_depreciation_date ? new Date(asset.last_depreciation_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Button variant='ghost' size='sm' onClick={() => handleEdit(asset, 'asset')}>
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button variant='ghost' size='sm' onClick={() => handleDeleteClick(asset.id, 'asset')}>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='expenses'>
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle className='flex items-center gap-2'>
                    <CreditCard className='h-5 w-5' /> Expenses
                  </CardTitle>
                  <Button
                    onClick={() => {
                      clearForm();
                      setModalType('expense');
                      setIsModalVisible(true);
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' /> Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Actions</TableHead> {/* Added Actions column */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(exp => (
                      <TableRow key={exp.id}>
                        <TableCell>{exp.name}</TableCell>
                        <TableCell>
                          <Badge>{exp.category}</Badge>
                        </TableCell>
                        <TableCell>{exp.details}</TableCell>
                        <TableCell>R{(+exp.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                        <TableCell>{exp.account_name}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button variant='ghost' size='sm' onClick={() => handleEdit(exp, 'expense')}>
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button variant='ghost' size='sm' onClick={() => handleDeleteClick(exp.id, 'expense')}>
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='accounts'>
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle className='flex items-center gap-2'>
                    <Calculator className='h-5 w-5' /> Accounts
                  </CardTitle>
                  <Button
                    onClick={() => {
                      clearForm();
                      setModalType('account');
                      setIsModalVisible(true);
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' /> Add Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map(acc => (
                      <TableRow key={acc.id}>
                        <TableCell>
                          <Badge variant='outline'>{acc.type}</Badge>
                        </TableCell>
                        <TableCell>{acc.code}</TableCell>
                        <TableCell>{acc.name}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button variant='ghost' size='sm' onClick={() => handleEdit(acc, 'account')}>
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button variant='ghost' size='sm' onClick={() => handleDeleteClick(acc.id, 'account')}>
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={isModalVisible} onOpenChange={handleModalClose}>
        <DialogContent aria-describedby='modal-desc' className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Edit' : 'Add New'} {modalType === 'asset' ? 'Asset' : modalType === 'expense' ? 'Expense' : 'Account'}
            </DialogTitle>
            <p id='modal-desc' className='text-sm text-muted-foreground'>
              Fill in the required fields to {formData.id ? 'update' : 'create'} this {modalType}.
            </p>
          </DialogHeader>
          <div className='space-y-4'>
            {modalType === 'asset' && (
              <>
                <Label>Type</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={value => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select asset type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Computer'>Computer</SelectItem>
                    <SelectItem value='Furniture'>Furniture</SelectItem>
                    <SelectItem value='Equipment'>Equipment</SelectItem>
                    <SelectItem value='Vehicle'>Vehicle</SelectItem>
                    <SelectItem value='Property'>Property</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Name</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Asset Name'
                />

                <Label>Number</Label>
                <Input
                  value={formData.number || ''}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                  placeholder='Asset Number (Optional)'
                />

                <Label>Cost (R)</Label>
                <Input
                  type='number'
                  value={formData.cost || ''}
                  onChange={e =>
                    setFormData({ ...formData, cost: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  placeholder='Cost'
                />

                <Label>Date Received</Label>
                <Input
                  type='date'
                  value={formData.dateReceived || ''}
                  onChange={e => setFormData({ ...formData, dateReceived: e.target.value })}
                />

                <Label>Account</Label>
                <Select
                  value={formData.account_id || ''}
                  onValueChange={value => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select account' />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* New Depreciation Fields */}
                <Label>Depreciation Method</Label>
                <Select
                  value={formData.depreciationMethod || ''}
                  onValueChange={value => setFormData({ ...formData, depreciationMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select method (Optional)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='straight-line'>Straight-Line</SelectItem>
                    {/* Add other methods if supported by backend */}
                  </SelectContent>
                </Select>

                <Label>Useful Life (Years)</Label>
                <Input
                  type='number'
                  value={formData.usefulLifeYears || ''}
                  onChange={e =>
                    setFormData({ ...formData, usefulLifeYears: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  placeholder='e.g., 5'
                />

                <Label>Salvage Value (R)</Label>
                <Input
                  type='number'
                  value={formData.salvageValue || ''}
                  onChange={e =>
                    setFormData({ ...formData, salvageValue: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  placeholder='e.g., 1000'
                />
              </>
            )}

            {modalType === 'expense' && (
              <>
                <Label>Name</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Expense Name'
                />

                <Label>Amount (R)</Label>
                <Input
                  type='number'
                  value={formData.amount || ''}
                  onChange={e =>
                    setFormData({ ...formData, amount: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  placeholder='Expense Amount'
                />

                <Label>Date</Label>
                <Input
                  type='date'
                  value={formData.date || ''}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />

                <Label>Category</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={value => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select category (Optional)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Operating Expenses'>Operating Expenses</SelectItem>
                    <SelectItem value='Administrative Expenses'>Administrative Expenses</SelectItem>
                    <SelectItem value='Depreciation Expense'>Depreciation Expense</SelectItem>
                    {/* Add more categories as needed */}
                  </SelectContent>
                </Select>

                <Label>Details</Label>
                <Input
                  value={formData.details || ''}
                  onChange={e => setFormData({ ...formData, details: e.target.value })}
                  placeholder='Details (Optional)'
                />

                <Label>Account</Label>
                <Select
                  value={formData.account_id || ''}
                  onValueChange={value => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select account' />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {modalType === 'account' && (
              <>
                <Label>Type</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={value => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select account type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Asset'>Asset</SelectItem>
                    <SelectItem value='Liability'>Liability</SelectItem>
                    <SelectItem value='Equity'>Equity</SelectItem>
                    <SelectItem value='Income'>Income</SelectItem>
                    <SelectItem value='Expense'>Expense</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Name</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Account Name'
                />

                <Label>Code</Label>
                <Input
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder='Account Code (e.g., 1000)'
                />
              </>
            )}

            <div className='flex justify-end'>
              <Button onClick={handleSubmit}>{formData.id ? 'Save Changes' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Accounting;
