import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancials } from '@/contexts/FinancialsContext';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthPage';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// --- Types you already had ---
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt';
  amount: number;
  description: string;
  date: string;
  category: string;
  account_id: string;
  account_name: string;
}

interface Account {
  id: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  code: string;
}

interface Asset {
  id: string;
  name: string;
  cost: number;
  date_received: string;
  accumulated_depreciation: number;
  book_value: number;
}

const API_BASE_URL = 'https://quantnow.onrender.com';

const Financials = () => {
  const navigate = useNavigate();
  const { latestProcessedTransactions } = useFinancials();
  const { toast } = useToast();

  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-driven statement state
  const [trialBalanceData, setTrialBalanceData] = useState<any[]>([]);
  const [incomeStatementData, setIncomeStatementData] = useState<any[]>([]);
  const [balanceSheetData, setBalanceSheetData] = useState<any>({ assets: [], liabilities: [], equity: [] });
  const [cashflowData, setCashflowData] = useState<any[]>([]);

  // Which tab/report is currently viewed
  const [activeTab, setActiveTab] = useState<'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow-statement'>('income-statement');

  // For PDF download
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('income-statement');

  const reportTypes = [
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'cash-flow-statement', label: 'Cashflow Statement' },
  ] as const;

  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'R 0.00';
    return `R ${parseFloat(Number(amount).toFixed(2)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
    // ^ guard against stringy amounts
  };

  // ------------------------------------------------------------------
  // Optional: keep your base data fetching (transactions/accounts/assets)
  // ------------------------------------------------------------------
  const fetchAllData = useCallback(async () => {
    if (!token) {
      setAllTransactions([]);
      setAllAccounts([]);
      setAllAssets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [txRes, accRes, assetRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions?fromDate=${fromDate}&toDate=${toDate}`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/accounts`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/assets`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!txRes.ok) throw new Error(`Failed to fetch transactions: ${txRes.statusText}`);
      if (!accRes.ok) throw new Error(`Failed to fetch accounts: ${accRes.statusText}`);
      if (!assetRes.ok) throw new Error(`Failed to fetch assets: ${assetRes.statusText}`);

      setAllTransactions(await txRes.json());
      setAllAccounts(await accRes.json());
      setAllAssets(await assetRes.json());
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(`Failed to load data: ${err.message}. Please ensure the backend is running.`);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData();
    } else {
      setAllTransactions([]);
      setAllAccounts([]);
      setAllAssets([]);
      setIsLoading(false);
    }
  }, [fetchAllData, isAuthenticated, token]);

  // ------------------------------------------------------------------
  // Fetch a statement JSON from backend (same endpoint as PDF)
  // ------------------------------------------------------------------
 const fetchServerStatement = useCallback(
  async (type: typeof reportTypes[number]['id']) => {
    if (!token) return;

    try {
      const qs = new URLSearchParams({
        documentType: type,
        startDate: fromDate,
        endDate: toDate,
        format: 'json', // <<— IMPORTANT
      });
      const url = `${API_BASE_URL}/generate-financial-document?${qs.toString()}`;

      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ${type} JSON: ${res.status} ${res.statusText}`);
      }

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        // Safety: server returned a PDF or HTML by mistake
        const text = await res.text();
        throw new Error(`Expected JSON but got ${ct}. First bytes: ${text.slice(0, 20)}...`);
      }

      const payload = await res.json();
      const data = payload?.data ?? payload; // backend returns {type, data}

      if (type === 'income-statement') {
        const lines = data?.lines ?? [];
        setIncomeStatementData(lines.map((l: any) => ({
          item: l.item, amount: Number(l.amount || 0), type: l.type || 'detail',
        })));
      }

      if (type === 'trial-balance') {
        const rows = data?.rows ?? data?.data?.rows ?? [];
        setTrialBalanceData(rows.map((r: any) => ({
          account: r.name, debit: Number(r.debit || 0), credit: Number(r.credit || 0),
        })));
      }

      if (type === 'balance-sheet') {
        setBalanceSheetData({
          assets: (data.assets || []).map((a: any) => ({ item: a.item, amount: Number(a.amount || 0), isTotal: !!a.isTotal })),
          liabilities: (data.liabilities || []).map((l: any) => ({ item: l.item, amount: Number(l.amount || 0), isTotal: !!l.isTotal })),
          equity: (data.equity || []).map((e: any) => ({ item: e.item, amount: Number(e.amount || 0), isTotal: !!e.isTotal })),
        });
      }

      if (type === 'cash-flow-statement') {
        const sections = data?.sections ?? [];
        const formatted = sections.map((s: any) => ({
          category: s.label || s.category,
          items: (s.items || []).map((i: any) => ({ item: i.item, amount: Number(i.amount || 0), isTotal: false })),
          total: Number(s.total || 0),
          isSectionTotal: true,
        }));
        if (typeof data?.totals?.netChange === 'number') {
          formatted.push({
            category: 'Net Increase / (Decrease) in Cash',
            items: [],
            total: Number(data.totals.netChange),
            isSectionTotal: true,
          });
        }
        setCashflowData(formatted);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to load statement',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  },
  [fromDate, toDate, token, toast]
);


  // Fetch current tab’s report whenever date range or tab changes
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetchServerStatement(activeTab);
  }, [activeTab, fromDate, toDate, fetchServerStatement, isAuthenticated, token]);

  // PDF download still works
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
      const downloadUrl = `${API_BASE_URL}/generate-financial-document?documentType=${selectedDocumentType}&startDate=${fromDate}&endDate=${toDate}`;
      window.open(downloadUrl, '_blank'); // triggers PDF response
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
          </CardContent>
        </Card>

        <Tabs
          defaultValue="income-statement"
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as typeof activeTab)
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            {reportTypes.map((report) => (
              <TabsTrigger key={report.id} value={report.id}>
                {report.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Income Statement */}
          <TabsContent value="income-statement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Income Statement</CardTitle>
                <CardDescription>
                  For the period {new Date(fromDate).toLocaleDateString('en-ZA')} to {new Date(toDate).toLocaleDateString('en-ZA')}
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
                    {incomeStatementData.map((item: any, index: number) => (
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

          {/* Trial Balance */}
          <TabsContent value="trial-balance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Trial Balance</CardTitle>
                <CardDescription>
                  As of {new Date(toDate).toLocaleDateString('en-ZA')}
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
                    {trialBalanceData.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.account}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.credit)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>TOTALS</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(trialBalanceData.reduce((sum, item) => sum + Number(item.debit || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(trialBalanceData.reduce((sum, item) => sum + Number(item.credit || 0), 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
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
                      {balanceSheetData.assets
                        .filter((i: any) => !i.isTotal && ['Cash and Bank','Accounts Receivable','Inventory'].includes(i.item))
                        .map((item: any, idx: number) => (
                          <div key={`ca-${idx}`} className="flex justify-between py-1">
                            <span>{item.item}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Current Assets</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.assets.find((i: any) => i.item === 'Total Current Assets')?.amount)}</span>
                      </div>

                      <h4 className="font-medium text-md mt-4">Non-Current Assets</h4>
                      {balanceSheetData.assets
                        .filter((i: any) => !i.isTotal && !['Cash and Bank','Accounts Receivable','Inventory'].includes(i.item))
                        .map((item: any, idx: number) => (
                          <div key={`nca-${idx}`} className="flex justify-between py-1">
                            <span>{item.item}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Non-Current Assets</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.assets.find((i: any) => i.item === 'Total Non-Current Assets')?.amount)}</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold border-t-2 pt-2 text-lg">
                        <span>TOTAL ASSETS</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.assets.find((i: any) => i.item === 'TOTAL ASSETS')?.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 mt-6">LIABILITIES</h3>
                    <div className="space-y-2 ml-4">
                      <h4 className="font-medium text-md">Current Liabilities</h4>
                      {balanceSheetData.liabilities
                        .filter((i: any) => !i.isTotal && ['Accounts Payable','Short-term Debt'].includes(i.item))
                        .map((item: any, idx: number) => (
                          <div key={`cl-${idx}`} className="flex justify-between py-1">
                            <span>{item.item}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Current Liabilities</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.liabilities.find((i: any) => i.item === 'Total Current Liabilities')?.amount)}</span>
                      </div>

                      <h4 className="font-medium text-md mt-4">Non-Current Liabilities</h4>
                      {balanceSheetData.liabilities
                        .filter((i: any) => !i.isTotal && i.item === 'Long-term Debt')
                        .map((item: any, idx: number) => (
                          <div key={`ncl-${idx}`} className="flex justify-between py-1">
                            <span>{item.item}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-1 font-bold border-t pt-2">
                        <span>Total Non-Current Liabilities</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.liabilities.find((i: any) => i.item === 'Total Non-Current Liabilities')?.amount)}</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold border-t-2 pt-2 text-lg">
                        <span>TOTAL LIABILITIES</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.liabilities.find((i: any) => i.item === 'TOTAL LIABILITIES')?.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 mt-6">EQUITY</h3>
                    <div className="space-y-2 ml-4">
                      {balanceSheetData.equity
                        .filter((i: any) => !i.isTotal)
                        .map((item: any, idx: number) => (
                          <div key={`eq-${idx}`} className="flex justify-between py-1">
                            <span>{item.item}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-1 font-bold border-t-2 pt-2 text-lg">
                        <span>TOTAL EQUITY</span>
                        <span className="font-mono">{formatCurrency(balanceSheetData.equity.find((i: any) => i.item === 'TOTAL EQUITY')?.amount)}</span>
                      </div>

                      {/* Check A = L + E */}
                      {Number(balanceSheetData.assets.find((i: any) => i.item === 'TOTAL ASSETS')?.amount || 0) !==
                        Number(balanceSheetData.liabilities.find((i: any) => i.item === 'TOTAL LIABILITIES')?.amount || 0) +
                        Number(balanceSheetData.equity.find((i: any) => i.item === 'TOTAL EQUITY')?.amount || 0) && (
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

          {/* Cashflow Statement */}
          <TabsContent value="cash-flow-statement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Cash Flow Statement</CardTitle>
                <CardDescription>
                  For the period {new Date(fromDate).toLocaleDateString('en-ZA')} to {new Date(toDate).toLocaleDateString('en-ZA')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {cashflowData.map((section: any, sectionIndex: number) => (
                    <div key={sectionIndex}>
                      <h3 className='font-semibold text-lg mb-3'>
                        {section.category}
                      </h3>
                      <div className='space-y-2 ml-4'>
                        {section.items.map((item: any, itemIndex: number) => (
                          <div
                            key={itemIndex}
                            className={`flex justify-between py-1 ${item.isTotal ? 'font-bold border-t pt-2' : ''}`}
                          >
                            <span>{item.item}</span>
                            <span className='font-mono'>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                        {/* Section total */}
                        <div className="flex justify-between py-1 font-bold border-t pt-2">
                          <span>Net {section.category}</span>
                          <span className="font-mono">{formatCurrency(section.total)}</span>
                        </div>
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
