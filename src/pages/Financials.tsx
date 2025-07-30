import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancials } from '@/contexts/FinancialsContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthPage'; // Import useAuth

// Define interfaces for data fetched from backend
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category: string;
  account_id: string;
  account_name: string; // From join with accounts table
}

interface Account {
  id: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'; // Matches DB types
  code: string;
}

interface Asset {
  id: string;
  name: string;
  cost: number;
  date_received: string;
  accumulated_depreciation: number;
  book_value: number; // Calculated
}

const API_BASE_URL = 'http://localhost:3000'; // Your backend URL

const Financials = () => {
  const navigate = useNavigate();
  // latestProcessedTransactions from context might be for recent imports,
  // for statements, we'll fetch all relevant transactions from the backend.
  const { latestProcessedTransactions } = useFinancials();

  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for dynamically calculated reports
  const [trialBalanceData, setTrialBalanceData] = useState<any[]>([]);
  const [incomeStatementData, setIncomeStatementData] = useState<any[]>([]);
  const [balanceSheetData, setBalanceSheetData] = useState<any>({ assets: [], liabilities: [], equity: [] });
  const [cashflowData, setCashflowData] = useState<any[]>([]);

  const reportTypes = [
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cashflow Statement' },
  ];

  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token

  // Helper to format currency
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'R 0.00';
    return `R ${parseFloat(amount.toFixed(2)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  // --- Data Fetching Functions ---
  const fetchAllData = useCallback(async () => {
    if (!token) {
      console.warn('No token found. User is not authenticated for financial data.');
      setAllTransactions([]);
      setAllAccounts([]);
      setAllAssets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch transactions for the selected period
      const transactionsResponse = await fetch(`${API_BASE_URL}/transactions?fromDate=${fromDate}&toDate=${toDate}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!transactionsResponse.ok) throw new Error(`Failed to fetch transactions: ${transactionsResponse.statusText}`);
      const transactionsData: Transaction[] = await transactionsResponse.json();
      setAllTransactions(transactionsData);

      // Fetch all accounts (needed for account types and names)
      const accountsResponse = await fetch(`${API_BASE_URL}/accounts`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!accountsResponse.ok) throw new Error(`Failed to fetch accounts: ${accountsResponse.statusText}`);
      const accountsData: Account[] = await accountsResponse.json();
      setAllAccounts(accountsData);

      // Fetch all assets (needed for Balance Sheet and Depreciation)
      const assetsResponse = await fetch(`${API_BASE_URL}/assets`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
      });
      if (!assetsResponse.ok) throw new Error(`Failed to fetch assets: ${assetsResponse.statusText}`);
      const assetsData: Asset[] = await assetsResponse.json();
      setAllAssets(assetsData);

    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(`Failed to load data: ${err.message}. Please ensure the backend is running.`);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, token]); // Add token to dependencies

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData();
    } else {
      setAllTransactions([]);
      setAllAccounts([]);
      setAllAssets([]);
      setIsLoading(false);
    }
  }, [fetchAllData, isAuthenticated, token]); // Add isAuthenticated and token to dependencies

  // --- Financial Statement Calculation Logic ---

  // Calculate Trial Balance
  useEffect(() => {
    if (allTransactions.length === 0 || allAccounts.length === 0) {
      setTrialBalanceData([]);
      return;
    }

    const accountBalances: { [key: string]: number } = {}; // Net balance for each account
    const accountTypesMap = new Map<string, string>(); // Map account name to type

    allAccounts.forEach(acc => {
      accountBalances[acc.name] = 0;
      accountTypesMap.set(acc.name, acc.type);
    });

    allTransactions.forEach(transaction => {
      const account = allAccounts.find(acc => String(acc.id) === String(transaction.account_id));
      if (!account) return;

      const amount = parseFloat(transaction.amount.toString());

      // Apply transaction amount to account balance based on account type and transaction type
      if (account.type === 'Asset' || account.type === 'Expense') {
        // Debits increase (e.g., cash received, expense incurred)
        // Credits decrease (e.g., cash paid, asset sold)
        if (transaction.type === 'income') { // Money coming in (e.g., sales deposited into Bank)
          accountBalances[account.name] += amount;
        } else if (transaction.type === 'expense' || transaction.type === 'debt') { // Money going out (e.g., paying expense from Bank, buying asset)
          accountBalances[account.name] -= amount;
        }
      } else if (account.type === 'Liability' || account.type === 'Equity' || account.type === 'Income') {
        // Credits increase (e.g., loan received, revenue earned)
        // Debits decrease (e.g., loan repaid, owner withdrawal)
        if (transaction.type === 'income' || (transaction.type === 'debt' && amount > 0)) { // Money coming in (e.g., sales, loan received)
          accountBalances[account.name] += amount;
        } else if (transaction.type === 'expense' || (transaction.type === 'debt' && amount < 0)) { // Money going out (e.g., paying liability)
          accountBalances[account.name] -= amount;
        }
      }
    });

    // Convert net balances to debit/credit for Trial Balance display
    const calculatedTrialBalance: { account: string; debit: number; credit: number }[] = [];
    for (const accountName in accountBalances) {
      const balance = accountBalances[accountName];
      const accountType = accountTypesMap.get(accountName);

      let debit = 0;
      let credit = 0;

      if (accountType === 'Asset' || accountType === 'Expense') {
        if (balance >= 0) {
          debit = balance;
        } else {
          credit = Math.abs(balance);
        }
      } else if (accountType === 'Liability' || accountType === 'Equity' || accountType === 'Income') {
        if (balance >= 0) {
          credit = balance;
        } else {
          debit = Math.abs(balance);
        }
      }

      if (debit !== 0 || credit !== 0) {
        calculatedTrialBalance.push({ account: accountName, debit: debit, credit: credit });
      }
    }

    setTrialBalanceData(calculatedTrialBalance);
  }, [allTransactions, allAccounts]);

  // Calculate Income Statement
  useEffect(() => {
    if (allTransactions.length === 0) {
      setIncomeStatementData([]);
      return;
    }

    let totalSalesRevenue = 0;
    let costOfGoodsSold = 0;
    const operatingExpenses: { [key: string]: number } = {};
    let totalOperatingExpenses = 0;
    let otherIncome = 0;

    allTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount.toString());
      if (isNaN(amount)) return;

      if (transaction.type === 'income') {
        if (transaction.category === 'Sales Revenue' || transaction.category === 'Trading Income') {
          totalSalesRevenue += amount;
        } else {
          otherIncome += amount;
        }
      } else if (transaction.type === 'expense') {
        if (transaction.category === 'Cost of Goods Sold') {
          costOfGoodsSold += amount;
        } else {
          // Aggregate other operating expenses
          if (operatingExpenses[transaction.category]) {
            operatingExpenses[transaction.category] += amount;
          } else {
            operatingExpenses[transaction.category] = amount;
          }
          totalOperatingExpenses += amount;
        }
      }
    });

    const grossProfit = totalSalesRevenue - costOfGoodsSold;
    const netIncome = (grossProfit + otherIncome) - totalOperatingExpenses;

    const statement = [
      { item: 'Sales Revenue', amount: totalSalesRevenue, type: 'revenue' },
      { item: 'Cost of Goods Sold', amount: costOfGoodsSold, type: 'expense' },
      { item: 'Gross Profit', amount: grossProfit, type: 'subtotal' },
      { item: 'Other Income', amount: otherIncome, type: 'income' },
      { item: 'Total Operating Expenses', amount: totalOperatingExpenses, type: 'expense' },
      ...Object.keys(operatingExpenses).map(cat => ({ item: `  ${cat}`, amount: operatingExpenses[cat], type: 'detail-expense' })),
      { item: 'Net Income', amount: netIncome, type: 'total' }
    ].filter(item => item.amount !== 0 || item.type === 'total' || item.type === 'subtotal' || item.type === 'revenue'); // Filter out zero amounts unless it's a total/subtotal

    setIncomeStatementData(statement);
  }, [allTransactions]);

  // Calculate Balance Sheet
  useEffect(() => {
    if (allTransactions.length === 0 || allAccounts.length === 0 || allAssets.length === 0) {
      setBalanceSheetData({ assets: [], liabilities: [], equity: [] });
      return;
    }

    const asOfDate = new Date(toDate);

    // Calculate account balances up to the asOfDate
    const accountBalances: { [key: string]: number } = {};
    allAccounts.forEach(acc => {
      accountBalances[acc.name] = 0;
    });

    allTransactions.filter(tx => new Date(tx.date) <= asOfDate).forEach(transaction => {
      const account = allAccounts.find(acc => String(acc.id) === String(transaction.account_id));
      if (!account) return;

      const amount = parseFloat(transaction.amount.toString());

      const isCashMovement = ['Bank Account', 'Cash'].includes(account.name);

      if (account.type === 'Asset') {
          if (transaction.type === 'income') {
              accountBalances[account.name] += amount;
          } else if (transaction.type === 'expense') {
              accountBalances[account.name] -= amount;
          } else if (transaction.type === 'debt') {
              accountBalances[account.name] += amount;
          }
      } else if (account.type === 'Liability') {
          if (transaction.type === 'income') {
              accountBalances[account.name] += amount;
          } else if (transaction.type === 'expense') {
              accountBalances[account.name] -= amount;
          }
      } else if (account.type === 'Equity') {
          if (transaction.type === 'income') {
              accountBalances[account.name] += amount;
          } else if (transaction.type === 'expense') {
              accountBalances[account.name] -= amount;
          }
      }
    });

    // Calculate Retained Earnings (Net Income from all periods up to asOfDate)
    let cumulativeNetIncome = 0;
    allTransactions.filter(tx => new Date(tx.date) <= asOfDate).forEach(transaction => {
        const amount = parseFloat(transaction.amount.toString());
        if (transaction.type === 'income') {
            cumulativeNetIncome += amount;
        } else if (transaction.type === 'expense') {
            cumulativeNetIncome -= amount;
        }
    });


    // ASSETS
    const assets: { item: string; amount: number; isTotal?: boolean }[] = [];
    let totalCurrentAssets = 0;
    let totalNonCurrentAssets = 0;

    // Current Assets (Cash, Accounts Receivable)
    const cashAndBank = accountBalances['Bank Account'] || 0;
    assets.push({ item: 'Cash and Bank', amount: cashAndBank });
    totalCurrentAssets += cashAndBank;

    const accountsReceivable = accountBalances['Accounts Receivable'] || 0;
    if (accountsReceivable !== 0) {
        assets.push({ item: 'Accounts Receivable', amount: accountsReceivable });
        totalCurrentAssets += accountsReceivable;
    }

    const inventory = accountBalances['Inventory'] || 0;
    if (inventory !== 0) {
        assets.push({ item: 'Inventory', amount: inventory });
        totalCurrentAssets += inventory;
    }

    assets.push({ item: 'Total Current Assets', amount: totalCurrentAssets, isTotal: true });

    // Non-Current Assets (Fixed Assets)
    let totalFixedAssetsNetBookValue = 0;
    allAssets.filter(asset => new Date(asset.date_received) <= asOfDate).forEach(asset => {
        const cost = parseFloat(asset.cost.toString());
        const accumulatedDepreciation = parseFloat(asset.accumulated_depreciation.toString());
        const netBookValue = cost - accumulatedDepreciation;
        if (netBookValue > 0) {
            assets.push({ item: asset.name, amount: netBookValue });
            totalNonCurrentAssets += netBookValue;
        }
    });
    assets.push({ item: 'Total Non-Current Assets', amount: totalNonCurrentAssets, isTotal: true });

    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
    assets.push({ item: 'TOTAL ASSETS', amount: totalAssets, isTotal: true });


    // LIABILITIES
    const liabilities: { item: string; amount: number; isTotal?: boolean }[] = [];
    let totalCurrentLiabilities = 0;
    let totalNonCurrentLiabilities = 0;

    // Current Liabilities (Accounts Payable, Short-term Debt)
    const accountsPayable = accountBalances['Accounts Payable'] || 0;
    if (accountsPayable !== 0) {
        liabilities.push({ item: 'Accounts Payable', amount: accountsPayable });
        totalCurrentLiabilities += accountsPayable;
    }

    const shortTermDebt = accountBalances['Short-term Debt'] || 0;
    if (shortTermDebt !== 0) {
        liabilities.push({ item: 'Short-term Debt', amount: shortTermDebt });
        totalCurrentLiabilities += shortTermDebt;
    }
    liabilities.push({ item: 'Total Current Liabilities', amount: totalCurrentLiabilities, isTotal: true });

    // Non-Current Liabilities (Long-term Debt)
    const longTermDebt = accountBalances['Long-term Debt'] || 0;
    if (longTermDebt !== 0) {
        liabilities.push({ item: 'Long-term Debt', amount: longTermDebt });
        totalNonCurrentLiabilities += longTermDebt;
    }
    liabilities.push({ item: 'Total Non-Current Liabilities', amount: totalNonCurrentLiabilities, isTotal: true });

    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
    liabilities.push({ item: 'TOTAL LIABILITIES', amount: totalLiabilities, isTotal: true });


    // EQUITY
    const equity: { item: string; amount: number; isTotal?: boolean }[] = [];
    const shareCapital = accountBalances['Owner\'s Capital'] || 0;
    equity.push({ item: 'Share Capital', amount: shareCapital });
    equity.push({ item: 'Retained Earnings', amount: cumulativeNetIncome });
    const totalEquity = shareCapital + cumulativeNetIncome;
    equity.push({ item: 'TOTAL EQUITY', amount: totalEquity, isTotal: true });

    setBalanceSheetData({ assets, liabilities, equity });

  }, [allTransactions, allAccounts, allAssets, toDate]);

  // Calculate Cash Flow Statement
  useEffect(() => {
    if (allTransactions.length === 0) {
      setCashflowData([]);
      return;
    }

    const operatingActivities: { [key: string]: number } = {};
    const investingActivities: { [key: string]: number } = {};
    const financingActivities: { [key: string]: number } = {};

    allTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount.toString());
      if (isNaN(amount)) return;

      // Classify transactions into cash flow activities
      let activityType: 'operating' | 'investing' | 'financing' | null = null;

      // Simple classification based on category and type
      const lowerCategory = transaction.category?.toLowerCase();
      const lowerDescription = transaction.description?.toLowerCase();

      if (transaction.type === 'income') {
        if (lowerCategory === 'sales revenue' || lowerCategory === 'trading income') {
          activityType = 'operating';
        } else if (lowerCategory === 'interest income') {
          activityType = 'operating';
        } else if (lowerDescription?.includes('sale of asset') || lowerCategory?.includes('sale of asset')) {
          activityType = 'investing';
        } else if (lowerDescription?.includes('loan received') || lowerCategory?.includes('loan')) {
          activityType = 'financing';
        } else if (lowerDescription?.includes('owner\'s investment') || lowerCategory?.includes('owner\'s capital')) {
          activityType = 'financing';
        } else {
          activityType = 'operating'; // Default for other income
        }
      } else if (transaction.type === 'expense') {
        if (lowerCategory === 'cost of goods sold' || lowerCategory === 'salaries and wages expense' || lowerCategory === 'rent expense' || lowerCategory === 'utilities expense' || lowerCategory === 'marketing expense' || lowerCategory === 'repairs & maintenance expense' || lowerCategory === 'bank charges') {
          activityType = 'operating';
        } else if (lowerDescription?.includes('purchase of equipment') || lowerDescription?.includes('purchase of vehicle') || lowerCategory?.includes('asset')) {
          activityType = 'investing';
        } else if (lowerDescription?.includes('loan repayment') || lowerCategory?.includes('loan payable') || lowerCategory?.includes('credit facility')) {
          activityType = 'financing';
        } else if (lowerDescription?.includes('dividends paid') || lowerDescription?.includes('owner\'s drawings')) {
          activityType = 'financing';
        } else {
          activityType = 'operating'; // Default for other expenses
        }
      } else if (transaction.type === 'debt') {
        if (amount > 0) {
          activityType = 'financing';
        } else {
          activityType = 'financing';
        }
      }

      const effectiveAmount = (transaction.type === 'income' || (transaction.type === 'debt' && amount > 0)) ? amount : -amount;

      if (activityType === 'operating') {
        if (operatingActivities[transaction.description]) {
          operatingActivities[transaction.description] += effectiveAmount;
        } else {
          operatingActivities[transaction.description] = effectiveAmount;
        }
      } else if (activityType === 'investing') {
        if (investingActivities[transaction.description]) {
          investingActivities[transaction.description] += effectiveAmount;
        } else {
          investingActivities[transaction.description] = effectiveAmount;
        }
      } else if (activityType === 'financing') {
        if (financingActivities[transaction.description]) {
          financingActivities[transaction.description] += effectiveAmount;
        } else {
          financingActivities[transaction.description] = effectiveAmount;
        }
      }
    });

    const cashflowStatementStructure: any[] = [];
    let netCashIncrease = 0;

    // Operating Activities
    let totalOperating = 0;
    const operatingItems = Object.keys(operatingActivities).map(desc => {
      totalOperating += operatingActivities[desc];
      return { item: desc, amount: operatingActivities[desc] };
    });
    cashflowStatementStructure.push({
      category: 'Operating Activities',
      items: [...operatingItems, { item: 'Net Cash from Operating Activities', amount: totalOperating, isTotal: true }]
    });
    netCashIncrease += totalOperating;

    // Investing Activities
    let totalInvesting = 0;
    const investingItems = Object.keys(investingActivities).map(desc => {
      totalInvesting += investingActivities[desc];
      return { item: desc, amount: investingActivities[desc] };
    });
    cashflowStatementStructure.push({
      category: 'Investing Activities',
      items: [...investingItems, { item: 'Net Cash from Investing Activities', amount: totalInvesting, isTotal: true }]
    });
    netCashIncrease += totalInvesting;

    // Financing Activities
    let totalFinancing = 0;
    const financingItems = Object.keys(financingActivities).map(desc => {
      totalFinancing += financingActivities[desc];
      return { item: desc, amount: financingActivities[desc] };
    });
    cashflowStatementStructure.push({
      category: 'Financing Activities',
      items: [...financingItems, { item: 'Net Cash from Financing Activities', amount: totalFinancing, isTotal: true }]
    });
    netCashIncrease += totalFinancing;

    cashflowStatementStructure.push({
      category: 'Net Increase / (Decrease) in Cash',
      items: [{ item: 'Net Increase / (Decrease) in Cash', amount: netCashIncrease, isTotal: true }]
    });

    setCashflowData(cashflowStatementStructure);

  }, [allTransactions]);


  // --- Static/Sample Data for other tabs (removed as per request) ---
  // The following data and their corresponding TabsContent have been removed:
  // sixMonthIncomeData, stocksheetData, debtorsData, creditorsData
  // The assetRegisterData is now dynamically populated from allAssets.


  return (
    <div className='flex-1 space-y-4 p-4 md:p-6 lg:p-8'>
      <Header title='Financials' showActions={false} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='space-y-6'
      >
        {isLoading && (
          <div className="text-center text-gray-600">Loading financial data...</div>
        )}
        {error && (
          <div className="text-center text-red-600 p-4 border border-red-300 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {/* Report Type Tabs */}
        <Tabs defaultValue='income-statement' className='w-full'>
          <TabsList className='grid w-full grid-cols-4 gap-1'> {/* Updated grid-cols to 4 */}
            {reportTypes.map(report => (
              <TabsTrigger
                key={report.id}
                value={report.id}
                className='text-xs p-2'
              >
                {report.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Period Selection (for dynamic reports) */}
          <Card className="mt-4">
              <CardHeader>
                <CardTitle>Select Reporting Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col sm:flex-row gap-4 items-end'>
                  <div className='grid grid-cols-2 gap-4 flex-1'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        From
                      </label>
                      <Input
                        type='date'
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        To
                      </label>
                      <Input
                        type='date'
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Button to re-fetch/re-calculate, though useEffect handles it */}
                  <Button onClick={fetchAllData} disabled={isLoading} className='bg-purple-600 hover:bg-purple-700'>
                    {isLoading ? 'Loading...' : 'Refresh Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          {/* Trial Balance Tab (Dynamic) */}
          <TabsContent value='trial-balance' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
                <CardDescription>
                  As at {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className='text-right'>Debit (R)</TableHead>
                      <TableHead className='text-right'>Credit (R)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalanceData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          {item.account}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(item.debit)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(item.credit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className='font-bold border-t-2'>
                      <TableCell>TOTALS</TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(
                          trialBalanceData.reduce((sum, item) => sum + item.debit, 0)
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(
                          trialBalanceData.reduce((sum, item) => sum + item.credit, 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Statement Tab (Dynamic) */}
          <TabsContent value='income-statement' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>
                  For the period{' '}
                  {new Date(fromDate).toLocaleDateString('en-ZA')} to{' '}
                  {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {incomeStatementData.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center py-2 ${
                        item.type === 'total'
                          ? 'border-t-2 border-b-2 font-bold text-lg'
                          : item.type === 'subtotal'
                          ? 'border-t border-b font-semibold'
                          : item.type === 'detail-expense'
                          ? 'text-sm text-gray-700'
                          : 'border-b border-gray-200'
                      }`}
                    >
                      <span className={item.type === 'detail-expense' ? 'ml-8' : item.type === 'expense' ? 'ml-4' : ''}>
                        {item.item}
                      </span>
                      <span className='font-mono'>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet Tab (Dynamic) */}
          <TabsContent value='balance-sheet' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>
                  As at {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                  <div>
                    <h3 className='font-semibold text-lg mb-4'>ASSETS</h3>
                    <div className='space-y-2'>
                      {balanceSheetData.assets.map((item, index) => (
                        <div
                          key={index}
                          className={`flex justify-between ${
                            item.isTotal ? 'font-bold border-t pt-2' : ''
                          }`}
                        >
                          <span>{item.item}</span>
                          <span className='font-mono'>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className='font-semibold text-lg mb-4'>
                      LIABILITIES & EQUITY
                    </h3>
                    <div className='space-y-4'>
                      <div>
                        <h4 className='font-medium mb-2'>Liabilities</h4>
                        <div className='space-y-1 ml-4'>
                          {balanceSheetData.liabilities.map((item, index) => (
                            <div
                              key={index}
                              className={`flex justify-between ${
                                item.isTotal ? 'font-bold border-t pt-2' : ''
                              }`}
                            >
                              <span>{item.item}</span>
                              <span className='font-mono'>
                                {formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Equity</h4>
                        <div className='space-y-1 ml-4'>
                          {balanceSheetData.equity.map((item, index) => (
                            <div
                              key={index}
                              className={`flex justify-between ${
                                item.isTotal ? 'font-bold border-t pt-2' : ''
                              }`}
                            >
                              <span>{item.item}</span>
                              <span className='font-mono'>
                                {formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className='border-t-2 pt-2 font-bold'>
                        <div className='flex justify-between'>
                          <span>TOTAL LIABILITIES & EQUITY</span>
                          <span className='font-mono'>
                            {formatCurrency(
                              (balanceSheetData.liabilities.find(item => item.isTotal)?.amount || 0) +
                              (balanceSheetData.equity.find(item => item.isTotal)?.amount || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashflow Statement Tab (Dynamic) */}
          <TabsContent value='cashflow' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Statement</CardTitle>
                <CardDescription>
                  For the period{' '}
                  {new Date(fromDate).toLocaleDateString('en-ZA')} to{' '}
                  {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {cashflowData.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      <h3 className='font-semibold text-lg mb-3'>
                        {section.category}
                      </h3>
                      <div className='space-y-2 ml-4'>
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`flex justify-between py-1 ${
                              item.isTotal ? 'font-bold border-t pt-2' : ''
                            }`}
                          >
                            <span>{item.item}</span>
                            <span className='font-mono'>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Financials;
