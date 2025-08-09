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

// NEW IMPORTS FOR DROPDOWN AND TOAST
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast'; // Assuming you have a toast component


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
  const { toast } = useToast(); // Initialize useToast

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

  // NEW STATE for selected document type for download
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('income-statement');

  const reportTypes = [
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'cash-flow-statement', label: 'Cashflow Statement' }, // Corrected ID to match backend
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

// Calculate Trial Balance - Listing individual income and expense categories
useEffect(() => {
    if (allTransactions.length === 0) {
        setTrialBalanceData([]);
        return;
    }

    const trialBalanceMap = new Map<string, { type: 'expense' | 'income', amount: number }>();

    allTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount.toString());
        if (isNaN(amount)) return;

        const category = transaction.category || 'Uncategorized'; // Use 'Uncategorized' if category is missing

        if (transaction.type === 'expense') {
            // Expenses increase debit balance
            const current = trialBalanceMap.get(category);
            if (current && current.type === 'expense') {
                current.amount += amount;
            } else if (current && current.type === 'income') {
                // If a category was previously income and now has an expense, handle net effect
                current.amount -= amount; // Subtract from income balance (effectively reducing credit or creating debit)
                if (current.amount < 0) {
                    trialBalanceMap.set(category, { type: 'expense', amount: Math.abs(current.amount) });
                }
            } else {
                trialBalanceMap.set(category, { type: 'expense', amount: amount });
            }
        } else if (transaction.type === 'income') {
            // Income increases credit balance
            const current = trialBalanceMap.get(category);
            if (current && current.type === 'income') {
                current.amount += amount;
            } else if (current && current.type === 'expense') {
                // If a category was previously expense and now has an income, handle net effect
                current.amount -= amount; // Subtract from expense balance (effectively reducing debit or creating credit)
                if (current.amount < 0) {
                    trialBalanceMap.set(category, { type: 'income', amount: Math.abs(current.amount) });
                }
            } else {
                trialBalanceMap.set(category, { type: 'income', amount: amount });
            }
        }
    });

    const calculatedTrialBalance: { account: string; debit: number; credit: number }[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    // Process map to create the table rows
    trialBalanceMap.forEach((data, category) => {
        let debit = 0;
        let credit = 0;

        // Apply "expense on debit, income on credit" rule
        if (data.type === 'expense') {
            if (data.amount >= 0) {
                debit = data.amount;
            } else { // Handle cases where expense could net to negative (e.g., refunds)
                credit = Math.abs(data.amount);
            }
        } else if (data.type === 'income') {
            if (data.amount >= 0) {
                credit = data.amount;
            } else { // Handle cases where income could net to negative (e.g., returns)
                debit = Math.abs(data.amount);
            }
        }

        // Only include if there's a non-zero balance
        if (debit !== 0 || credit !== 0) {
            calculatedTrialBalance.push({ account: category, debit: debit, credit: credit });
            totalDebit += debit;
            totalCredit += credit;
        }
    });

    // Sort the categories alphabetically for consistent display
    calculatedTrialBalance.sort((a, b) => a.account.localeCompare(b.account));

    // Add the totals row (the UI component handles adding this, but we'll include it in the data for clarity if needed)
    // The existing UI for the table footer already calculates this, so we mainly need the rows.
    // For a comprehensive data structure:
    // setTrialBalanceData([...calculatedTrialBalance, { account: 'TOTALS', debit: totalDebit, credit: totalCredit }]);
    // However, your UI's reduce function already sums, so just the calculated rows are sufficient.
    setTrialBalanceData(calculatedTrialBalance);
}, [allTransactions]);
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
    // Add other current liabilities as needed based on your account structure
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
    let totalEquity = 0;

    const ownerEquity = accountBalances['Owner\'s Equity'] || 0;
    if (ownerEquity !== 0) {
      equity.push({ item: 'Owner\'s Equity', amount: ownerEquity });
      totalEquity += ownerEquity;
    }

    // Retained Earnings (cumulative net income up to asOfDate)
    equity.push({ item: 'Retained Earnings', amount: cumulativeNetIncome });
    totalEquity += cumulativeNetIncome;

    equity.push({ item: 'TOTAL EQUITY', amount: totalEquity, isTotal: true });

    setBalanceSheetData({ assets, liabilities, equity });

  }, [allTransactions, allAccounts, allAssets, toDate]);

  // Calculate Cashflow Statement
  useEffect(() => {
    if (allTransactions.length === 0) {
      setCashflowData([]);
      return;
    }

    // Helper to categorize cash flow
    const classifyCashFlow = (transaction: Transaction) => {
      const category = transaction.category?.toLowerCase();
      const description = transaction.description?.toLowerCase();

      // Operating Activities
      if (transaction.type === 'income' && (category === 'sales revenue' || category === 'trading income' || category === 'interest income' || category === 'other income')) {
        return 'operating';
      }
      if (transaction.type === 'expense' && category !== 'cost of goods sold' && !['equipment', 'property', 'asset', 'vehicle', 'loan repayment', 'dividend'].some(keyword => description?.includes(keyword) || category?.includes(keyword))) {
        return 'operating';
      }
      if (transaction.type === 'expense' && category === 'cost of goods sold') {
        return 'operating';
      }

      // Investing Activities
      if (transaction.type === 'expense' && ['equipment', 'property', 'asset', 'vehicle'].some(keyword => description?.includes(keyword) || category?.includes(keyword))) {
        return 'investing';
      }
      if (transaction.type === 'income' && ['sale of asset', 'sale of equipment'].some(keyword => description?.includes(keyword) || category?.includes(keyword))) {
        return 'investing';
      }

      // Financing Activities
      if (transaction.type === 'debt' || ['loan repayment', 'loan proceeds', 'share issuance', 'dividend', 'drawings'].some(keyword => description?.includes(keyword) || category?.includes(keyword))) {
        return 'financing';
      }

      return 'operating'; // Default to operating if not explicitly classified
    };

    const cashFlowSections = {
      operating: { label: 'Cash flow from Operating Activities', items: new Map<string, number>(), total: 0 },
      investing: { label: 'Cash flow from Investing Activities', items: new Map<string, number>(), total: 0 },
      financing: { label: 'Cash flow from Financing Activities', items: new Map<string, number>(), total: 0 },
    };

    allTransactions.forEach(transaction => {
      const flowType = classifyCashFlow(transaction);
      const amount = parseFloat(transaction.amount.toString());
      if (isNaN(amount)) return;

      const itemKey = transaction.description || transaction.category || 'Uncategorized';
      const currentAmount = cashFlowSections[flowType].items.get(itemKey) || 0;

      // For cash flow, income increases cash, expense decreases cash
      if (transaction.type === 'income') {
        cashFlowSections[flowType].items.set(itemKey, currentAmount + amount);
        cashFlowSections[flowType].total += amount;
      } else if (transaction.type === 'expense') {
        cashFlowSections[flowType].items.set(itemKey, currentAmount - amount); // Expenses reduce cash
        cashFlowSections[flowType].total -= amount;
      } else if (transaction.type === 'debt') {
        // Debt can be inflow (loan received) or outflow (loan repaid)
        // Assuming 'debt' type transactions represent increases in debt (cash inflow)
        // If it's a repayment, it should be an 'expense' type transaction associated with a debt account
        cashFlowSections[flowType].items.set(itemKey, currentAmount + amount);
        cashFlowSections[flowType].total += amount;
      }
    });

    const formattedCashflowData = Object.entries(cashFlowSections).map(([key, section]) => ({
      category: section.label,
      items: Array.from(section.items.entries()).map(([item, amount]) => ({
        item: item,
        amount: amount,
        isTotal: false,
      })),
      total: section.total,
      isSectionTotal: true,
    }));

    const netIncreaseDecrease = formattedCashflowData.reduce((sum, section) => sum + section.total, 0);

    formattedCashflowData.push({
      category: 'Net Increase / (Decrease) in Cash',
      items: [],
      total: netIncreaseDecrease,
      isSectionTotal: true,
    });

    setCashflowData(formattedCashflowData);
  }, [allTransactions]);


  const handleDownload = async () => {
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to download financial documents.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDocumentType || !fromDate || !toDate) {
      toast({
        title: "Missing Information",
        description: "Please select a document type and valid dates.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Construct the URL for the download
      const downloadUrl = `${API_BASE_URL}/generate-financial-document?documentType=${selectedDocumentType}&startDate=${fromDate}&endDate=${toDate}`;

      // Open the URL in a new tab, which will trigger the file download
      window.open(downloadUrl, '_blank');

      toast({
        title: "Download Initiated",
        description: `Your ${selectedDocumentType.replace('-', ' ')} is being downloaded.`,
      });

    } catch (err) {
      console.error("Error initiating download:", err);
      toast({
        title: "Download Failed",
        description: "There was an error initiating the download. Please try again.",
        variant: "destructive",
      });
    }
  };


  if (isLoading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: {error}
        <Button onClick={fetchAllData} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 sm:p-6 lg:p-8"
      >
        <Button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center"
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <Card className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">Financial Reports</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              View and generate various financial statements for your business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
              <div className="flex-1 w-full sm:w-auto">
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* NEW: Document Type Selector and Download Button */}
              <div className="flex-1 w-full sm:w-auto">
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Type
                </label>
                <Select onValueChange={setSelectedDocumentType} defaultValue={selectedDocumentType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleDownload} className="w-full sm:w-auto mt-7">
                Download Report
              </Button>
            </div>
          </CardContent> {/* CORRECTED: Added missing closing tag for CardContent */}
        </Card> {/* CORRECTED: Added missing closing tag for Card */}

        <Tabs defaultValue="income-statement" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            {reportTypes.map((report) => (
              <TabsTrigger key={report.id} value={report.id}>
                {report.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Income Statement Tab */}
          <TabsContent value="income-statement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Income Statement</CardTitle>
                <CardDescription>
                  For the period{' '}
                  {new Date(fromDate).toLocaleDateString('en-ZA')} to{' '}
                  {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount (R)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.map((item, index) => (
                      <TableRow key={index} className={item.type === 'total' || item.type === 'subtotal' ? 'font-bold border-t-2 border-b-2' : ''}>
                        <TableCell className={item.type === 'detail-expense' ? 'pl-8' : ''}>{item.item}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trial Balance Tab */}
          <TabsContent value="trial-balance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Trial Balance</CardTitle>
                <CardDescription>
                  For the period{' '}
                  {new Date(fromDate).toLocaleDateString('en-ZA')} to{' '}
                  {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit (R)</TableHead>
                      <TableHead className="text-right">Credit (R)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalanceData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.account}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.credit)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>TOTALS</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(trialBalanceData.reduce((sum, item) => sum + item.debit, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(trialBalanceData.reduce((sum, item) => sum + item.credit, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet Tab */}
          <TabsContent value="balance-sheet" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Balance Sheet</CardTitle>
                <CardDescription>
                  As of {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Assets */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">ASSETS</h3>
                    <div className="space-y-2 ml-4">
                      <h4 className="font-medium text-md">Current Assets</h4>
                      {balanceSheetData.assets.filter((item: any) => !item.isTotal && (item.item === 'Cash and Bank' || item.item === 'Accounts Receivable' || item.item === 'Inventory')).map((item: any, itemIndex: number) => (
                        <div key={`ca-${itemIndex}`} className="flex justify-between py-1">
                          <span>{item.item}</span>
                          <span className="font-mono">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Current Assets</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.assets.find((item: any) => item.item === 'Total Current Assets')?.amount)}</span>
                      </div>

                      <h4 className="font-medium text-md mt-4">Non-Current Assets</h4>
                      {balanceSheetData.assets.filter((item: any) => !item.isTotal && item.item !== 'Cash and Bank' && item.item !== 'Accounts Receivable' && item.item !== 'Inventory').map((item: any, itemIndex: number) => (
                        <div key={`nca-${itemIndex}`} className="flex justify-between py-1">
                          <span>{item.item}</span>
                          <span className="font-mono">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Non-Current Assets</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.assets.find((item: any) => item.item === 'Total Non-Current Assets')?.amount)}</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold border-t-2 pt-2 text-lg">
                        <span>TOTAL ASSETS</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.assets.find((item: any) => item.item === 'TOTAL ASSETS')?.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 mt-6">LIABILITIES</h3>
                    <div className="space-y-2 ml-4">
                      <h4 className="font-medium text-md">Current Liabilities</h4>
                      {balanceSheetData.liabilities.filter((item: any) => !item.isTotal && (item.item === 'Accounts Payable' || item.item === 'Short-term Debt')).map((item: any, itemIndex: number) => (
                        <div key={`cl-${itemIndex}`} className="flex justify-between py-1">
                          <span>{item.item}</span>
                          <span className="font-mono">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Current Liabilities</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.liabilities.find((item: any) => item.item === 'Total Current Liabilities')?.amount)}</span>
                      </div>

                      <h4 className="font-medium text-md mt-4">Non-Current Liabilities</h4>
                      {balanceSheetData.liabilities.filter((item: any) => !item.isTotal && item.item === 'Long-term Debt').map((item: any, itemIndex: number) => (
                        <div key={`ncl-${itemIndex}`} className="flex justify-between py-1">
                          <span>{item.item}</span>
                          <span className="font-mono">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Non-Current Liabilities</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.liabilities.find((item: any) => item.item === 'Total Non-Current Liabilities')?.amount)}</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold border-t-2 pt-2 text-lg">
                        <span>TOTAL LIABILITIES</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.liabilities.find((item: any) => item.item === 'TOTAL LIABILITIES')?.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 mt-6">EQUITY</h3>
                    <div className="space-y-2 ml-4">
                      {balanceSheetData.equity.filter((item: any) => !item.isTotal).map((item: any, itemIndex: number) => (
                        <div key={`eq-${itemIndex}`} className="flex justify-between py-1">
                          <span>{item.item}</span>
                          <span className="font-mono">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-1 font-bold border-t-2 pt-2 text-lg">
                        <span>TOTAL EQUITY</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.equity.find((item: any) => item.item === 'TOTAL EQUITY')?.amount)}</span>
                      </div>
                      {/* Check if Assets = Liabilities + Equity */}
                      {balanceSheetData.assets.find((item: any) => item.item === 'TOTAL ASSETS')?.amount !==
                        (balanceSheetData.liabilities.find((item: any) => item.item === 'TOTAL LIABILITIES')?.amount || 0) +
                        (balanceSheetData.equity.find((item: any) => item.item === 'TOTAL EQUITY')?.amount || 0) && (
                          <div className="text-red-500 font-bold mt-4">
                            Balance Sheet is out of balance! Total Assets do not equal Total Liabilities + Total Equity.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashflow Statement Tab */}
          <TabsContent value="cash-flow-statement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Cash Flow Statement</CardTitle>
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