import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Paperclip,
  Send,
  Upload,
  StopCircle,
  Trash2,
  CheckCircle,
  XCircle,
  Edit3,
  FileText,
  Play,
  Loader2, // Import Loader2 icon for loading state
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../AuthPage'; // Import useAuth
import { SearchableAccountSelect } from '../components/SearchableAccountSelect';
import { SearchableCategorySelect } from '../components/SearchableCategorySelect';


declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Define interfaces
interface Transaction {
  id?: string;
  type: 'income' | 'expense' | 'debt';
  amount: number;
  description: string;
  date: string;
  category: string;
  account_id: string;
  account_name?: string;
  source: string;
  is_verified: boolean;
  file_url?: string;
  _tempId?: string;
  original_text?: string;
  confidenceScore?: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}



const isDuplicateTransaction = (newTx, existingTxs) => {
  return existingTxs.some(existing =>
    existing.amount === newTx.amount &&
    existing.date === newTx.date &&
    existing.description?.trim().toLowerCase() === newTx.description?.trim().toLowerCase()
  );
};
// ===========================================
// SUGGESTION FUNCTION FOR FILE UPLOADS (PDF)
// ===========================================
/**
 * Optimized for PDF/file upload data structures.
 * Uses simpler keyword matching and focuses on category-to-account mapping.
 */
const suggestAccountForUpload = (
  transaction: { type: string; category: string; description: string; }, 
  accounts: Account[]
): { accountId: string | null; confidence: number } => {
  if (!accounts || accounts.length === 0) return { accountId: null, confidence: 0 };

  const safeText = (txt?: string | null) => (txt ? txt.toLowerCase() : '');
  const includesAny = (text: string, keywords: string[]) =>
    keywords.some(keyword => text.includes(keyword));

  const lowerTransactionType = safeText(transaction.type);
  const lowerCategory = safeText(transaction.category);
  const lowerDescription = safeText(transaction.description);

  // Helper to find an account by name keywords and optional type
  const findAccountByName = (nameKeywords: string[], accountType?: string) => {
    return accounts.find(acc => {
      const lowerAccName = safeText(acc.name);
      const typeMatch = accountType ? safeText(acc.type) === safeText(accountType) : true;
      return typeMatch && includesAny(lowerAccName, nameKeywords);
    });
  };

  // --- 1. Direct Category/Description to Account Name Matches (Highest Priority) ---

  // Expenses
  if (lowerTransactionType === 'expense') {
    if (includesAny(lowerCategory, ['fuel']) || includesAny(lowerDescription, ['fuel', 'petrol'])) {
      const acc = findAccountByName(['fuel expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['salaries and wages']) || includesAny(lowerDescription, ['salary', 'wages', 'payroll'])) {
      const acc = findAccountByName(['salaries and wages expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['projects expenses']) || includesAny(lowerDescription, ['project', 'materials', 'contractor'])) {
      const acc = findAccountByName(['projects expenses'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['accounting fees']) || includesAny(lowerDescription, ['accountant', 'audit', 'tax fee'])) {
      const acc = findAccountByName(['accounting fees expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['repairs & maintenance']) || includesAny(lowerDescription, ['repair', 'maintenance', 'fix', 'electrician'])) {
      const acc = findAccountByName(['repairs & maintenance expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['water and electricity']) || includesAny(lowerDescription, ['electricity', 'water bill', 'utilities'])) {
      const acc = findAccountByName(['water and electricity expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['bank charges']) || includesAny(lowerDescription, ['bank charge', 'service fee', 'card fee'])) {
      const acc = findAccountByName(['bank charges & fees'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['insurance']) || includesAny(lowerDescription, ['insurance', 'policy'])) {
      const acc = findAccountByName(['insurance expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['loan interest']) || includesAny(lowerDescription, ['loan interest', 'interest on debit', 'int on debit'])) {
      const acc = findAccountByName(['loan interest expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['computer internet and telephone']) || includesAny(lowerDescription, ['internet', 'airtime', 'telephone', 'wifi', 'data'])) {
      const acc = findAccountByName(['communication expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['website hosting fees']) || includesAny(lowerDescription, ['website', 'hosting', 'domain'])) {
      const acc = findAccountByName(['website hosting fees'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['other expenses']) || includesAny(lowerDescription, ['misc', 'sundries', 'general expense'])) {
      const acc = findAccountByName(['miscellaneous expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 85 };
    }
    if (includesAny(lowerCategory, ['rent']) || includesAny(lowerDescription, ['rent', 'rental'])) {
      const acc = findAccountByName(['rent expense'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 85 };
    }
    if (includesAny(lowerCategory, ['cost of goods sold', 'cogs']) || includesAny(lowerDescription, ['cost of goods sold', 'cogs', 'purchases'])) {
      const acc = findAccountByName(['cost of goods sold'], 'expense');
      if (acc) return { accountId: String(acc.id), confidence: 85 };
    }
  }

  // Income
  if (lowerTransactionType === 'income') {
    if (includesAny(lowerCategory, ['sales', 'revenue']) || includesAny(lowerDescription, ['sale', 'revenue', 'customer payment'])) {
      const acc = findAccountByName(['sales revenue'], 'income');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['interest income']) || includesAny(lowerDescription, ['interest received', 'interest income'])) {
      const acc = findAccountByName(['interest income'], 'income');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['income', 'general income']) || includesAny(lowerDescription, ['transfer from', 'deposit'])) {
      const acc = findAccountByName(['other income'], 'income');
      if (acc) return { accountId: String(acc.id), confidence: 80 };
    }
  }

  // Debt/Liability
  if (lowerTransactionType === 'debt') {
    if (includesAny(lowerCategory, ['car loans', 'loan repayment']) || includesAny(lowerDescription, ['car loan', 'vehicle finance'])) {
      const acc = findAccountByName(['car loans'], 'liability');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['loan', 'debt']) || includesAny(lowerDescription, ['loan', 'debt', 'borrow'])) {
      const acc = findAccountByName(['loan payable', 'long-term loan payable', 'short-term loan payable'], 'liability');
      if (acc) return { accountId: String(acc.id), confidence: 85 };
    }
    if (includesAny(lowerCategory, ['accounts payable']) || includesAny(lowerDescription, ['payable', 'creditor'])) {
      const acc = findAccountByName(['accounts payable'], 'liability');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
    if (includesAny(lowerCategory, ['credit facility']) || includesAny(lowerDescription, ['credit facility', 'line of credit'])) {
      const acc = findAccountByName(['credit facility payable'], 'liability');
      if (acc) return { accountId: String(acc.id), confidence: 90 };
    }
  }

  // --- 2. Fallback to General Account Types ---
  if (lowerTransactionType === 'income') {
    const acc = accounts.find(acc => safeText(acc.type) === 'income');
    if (acc) return { accountId: String(acc.id), confidence: 60 };
  }
  if (lowerTransactionType === 'expense') {
    const acc = accounts.find(acc => safeText(acc.type) === 'expense');
    if (acc) return { accountId: String(acc.id), confidence: 60 };
  }
  if (lowerTransactionType === 'debt') {
    const acc = accounts.find(acc => safeText(acc.type) === 'liability');
    if (acc) return { accountId: String(acc.id), confidence: 60 };
  }

  // --- 3. Final Fallback ---
  const defaultBank = findAccountByName(['bank account'], 'asset');
  if (defaultBank) return { accountId: String(defaultBank.id), confidence: 40 };

  const defaultCash = findAccountByName(['cash'], 'asset');
  if (defaultCash) return { accountId: String(defaultCash.id), confidence: 40 };

  return accounts.length > 0 ? { accountId: String(accounts[0].id), confidence: 20 } : { accountId: null, confidence: 0 };
};

// ==========================================
// SUGGESTION FUNCTION FOR TEXT INPUT
// ==========================================
/**
 * Optimized for natural language text input with contextual phrase matching.
 * Uses sophisticated scoring and contextual analysis.
 */
const suggestAccountForText = (
  transaction: { type: string; category: string; description: string; }, 
  accounts: Account[]
): { accountId: string | null; confidence: number } => {
  if (!accounts || accounts.length === 0) return { accountId: null, confidence: 0 };

  const safeText = (txt?: string | null) => (txt ? txt.toLowerCase() : '');
  const lowerTransactionType = safeText(transaction.type);
  const lowerCategory = safeText(transaction.category);
  const lowerDescription = safeText(transaction.description);

  let bestMatch: Account | null = null;
  let highestScore = -1;

  for (const account of accounts) {
    const lowerAccName = safeText(account.name);
    const lowerAccType = safeText(account.type);
    let currentScore = 0;

    // --- Scoring Logic (Prioritized) ---

    // 1. **Direct Account Name Inclusion (Highest Priority: 100 points)**
    if (lowerDescription.includes(lowerAccName) && lowerAccName.length > 3) {
      currentScore += 100;
    }
    if (lowerCategory.includes(lowerAccName) && lowerAccName.length > 3) {
      currentScore += 80;
    }

    // 2. **Contextual Phrase Matching (Very High Priority Boost: +70 points)**
    if (lowerDescription.includes("owner's cash investment") && lowerAccName.includes("owner's capital") && lowerAccType === 'equity') {
        currentScore += 70;
    }
    if (lowerDescription.includes("bank loan") && lowerAccName.includes("bank loan payable") && lowerAccType === 'liability') {
        currentScore += 70;
    }
    if (lowerDescription.includes("purchase of office equipment") && lowerAccName.includes("office equipment") && lowerAccType === 'asset') {
        currentScore += 70;
    }
    if (lowerDescription.includes("purchase of supplies on credit") && lowerAccName.includes("accounts payable") && lowerAccType === 'liability') {
        currentScore += 70;
    }
    if (lowerDescription.includes("revenue from services provided") && lowerAccName.includes("sales revenue") && lowerAccType === 'income') {
        currentScore += 70;
    }
    if (lowerDescription.includes("revenue from services on credit") && lowerAccName.includes("accounts receivable") && lowerAccType === 'asset') {
        currentScore += 70;
    }
    if (lowerDescription.includes("january rent payment") && lowerAccName.includes("rent expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("salaries disbursement") && lowerAccName.includes("salaries and wages expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("january salaries payment") && lowerAccName.includes("salaries and wages expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("february salaries payment") && lowerAccName.includes("salaries and wages expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("march salaries payment") && lowerAccName.includes("salaries and wages expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("payment for january 15th supplies") && lowerAccName.includes("accounts payable") && lowerAccType === 'liability') {
        currentScore += 70;
    }
    if (lowerDescription.includes("collection from client") && lowerAccName.includes("accounts receivable") && lowerAccType === 'asset') {
        currentScore += 70;
    }
    if (lowerDescription.includes("purchase of supplies") && lowerAccName.includes("supplies expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("utility bill payment") && lowerAccName.includes("utilities expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("loan repayment") && lowerAccName.includes("loan payable") && lowerAccType === 'liability') {
        currentScore += 70;
    }
    if (lowerDescription.includes("cash from client") && lowerAccName.includes("sales revenue") && lowerAccType === 'income') {
        currentScore += 70;
    }
    if (lowerDescription.includes("marketing expenses") && lowerAccName.includes("marketing expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }
    if (lowerDescription.includes("purchase of new vehicle") && lowerAccName.includes("vehicle") && lowerAccType === 'asset') {
        currentScore += 70;
    }
    if (lowerDescription.includes("maintenance costs") && lowerAccName.includes("repairs & maintenance expense") && lowerAccType === 'expense') {
        currentScore += 70;
    }

    // 3. **Strong Keyword Overlap (Medium Priority: 10-30 points)**
    const accountNameKeywords = lowerAccName.split(/\s+/)
                                    .filter(word => word.length > 2 && !['and', 'of', 'for', 'the', 'a', 'an', 'expense', 'income', 'payable', 'receivable'].includes(word));
    for (const keyword of accountNameKeywords) {
      if (lowerDescription.includes(keyword)) {
        currentScore += 10;
      }
      if (lowerCategory.includes(keyword)) {
        currentScore += 8;
      }
    }

    // 4. **Transaction Type and Account Type Alignment (Moderate Priority: 15 points)**
    if ((lowerTransactionType === 'income' && lowerAccType === 'income') ||
        (lowerTransactionType === 'expense' && lowerAccType === 'expense') ||
        (lowerTransactionType === 'debt' && lowerAccType === 'liability') ||
        (lowerTransactionType === 'income' && lowerAccType === 'asset' && lowerAccName.includes('receivable')) ||
        (lowerTransactionType === 'expense' && lowerAccType === 'liability' && lowerAccName.includes('payable'))
        ) {
      currentScore += 15;
    }
    if ((lowerAccName.includes('bank') || lowerAccName.includes('cash')) && lowerAccType === 'asset') {
        currentScore += 5;
    }

    // --- Update Best Match ---
    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestMatch = account;
    }
  }

  let suggestedAccountId: string | null = null;
  let confidence: number = 0;

  // --- Final Decision and Fallbacks ---
  if (bestMatch && highestScore > 60) {
    suggestedAccountId = String(bestMatch.id);
    confidence = Math.min(100, highestScore);
  } else {
    // Fallback logic (same as before)
    if (lowerTransactionType === 'income') {
      const defaultTypeAccount = accounts.find(acc => safeText(acc.type) === 'income');
      if (defaultTypeAccount) {
        suggestedAccountId = String(defaultTypeAccount.id);
        confidence = 40;
      }
    } else if (lowerTransactionType === 'expense') {
      const defaultTypeAccount = accounts.find(acc => safeText(acc.type) === 'expense');
      if (defaultTypeAccount) {
        suggestedAccountId = String(defaultTypeAccount.id);
        confidence = 40;
      }
    } else if (lowerTransactionType === 'debt') {
      const defaultTypeAccount = accounts.find(acc => safeText(acc.type) === 'liability');
      if (defaultTypeAccount) {
        suggestedAccountId = String(defaultTypeAccount.id);
        confidence = 40;
      }
    }

    if (!suggestedAccountId) {
      const defaultBankOrCash = accounts.find(acc =>
        (safeText(acc.name).includes('bank') || safeText(acc.name).includes('cash')) && safeText(acc.type) === 'asset'
      );
      if (defaultBankOrCash) {
        suggestedAccountId = String(defaultBankOrCash.id);
        confidence = 20;
      }
    }

    if (!suggestedAccountId && accounts.length > 0) {
      suggestedAccountId = String(accounts[0].id);
      confidence = 10;
    }
  }

  return { accountId: suggestedAccountId, confidence: confidence };
};

// --- EditableTransactionTable Component ---
// --- EditableTransactionTable Component ---
const EditableTransactionTable = ({ transactions: initialTransactions, accounts, categories, onConfirm, onCancel }) => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [editingRowId, setEditingRowId] = useState(null);

  const handleTransactionChange = (id, field, value) => {
    setTransactions(prevData =>
      prevData.map(tx =>
        tx.id === id || tx._tempId === id ? { ...tx, [field]: value } : tx
      )
    );
  };

  const handleTransactionDelete = (idToDelete) => {
    setTransactions(prevData => prevData.filter(tx => tx.id !== idToDelete && tx._tempId !== idToDelete));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-3">Review & Edit Transactions:</h4>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount (R)</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(transactions || []).map((transaction) => (
              <TableRow key={transaction.id || transaction._tempId}>
                <TableCell>
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <Select
                      value={transaction.type}
                      onValueChange={(value) => handleTransactionChange(transaction.id || transaction._tempId, 'type', value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="debt">Debt</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    transaction.type
                  )}
                </TableCell>
                <TableCell>
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={transaction.amount}
                      onChange={(e) => handleTransactionChange(transaction.id || transaction._tempId, 'amount', e.target.value)}
                      className="w-[100px]"
                    />
                  ) : (
                    parseFloat(transaction.amount).toFixed(2)
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <Textarea
                      value={transaction.description}
                      onChange={(e) => handleTransactionChange(transaction.id || transaction._tempId, 'description', e.target.value)}
                      rows="2"
                      className="w-[200px]"
                    />
                  ) : (
                    <>
                      {transaction.description}
                      {transaction.duplicateFlag && (
                        <Badge variant="destructive" className="ml-2">Duplicate?</Badge>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <Input
                      type="date"
                      value={transaction.date}
                      onChange={(e) => handleTransactionChange(transaction.id || transaction._tempId, 'date', e.target.value)}
                      className="w-[150px]"
                    />
                  ) : (
                    transaction.date
                  )}
                </TableCell>
                <TableCell>
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <SearchableCategorySelect
                      value={transaction.category}
                      onChange={(val) => handleTransactionChange(transaction.id || transaction._tempId, 'category', val)}
                      categories={categories}
                    />
                  ) : (
                    transaction.category
                  )}
                </TableCell>
                <TableCell>
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <SearchableAccountSelect
                      value={transaction.account_id}
                      onChange={(val) => handleTransactionChange(transaction.id || transaction._tempId, 'account_id', val)}
                      accounts={accounts}
                    />
                  ) : (
                    accounts.find(acc => String(acc.id) === String(transaction.account_id))?.name || 'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {transaction.confidenceScore !== undefined ? (
                    <Badge
                      variant={
                        transaction.confidenceScore >= 90 ? "success" :
                        transaction.confidenceScore >= 60 ? "default" : "destructive"
                      }
                    >
                      {transaction.confidenceScore.toFixed(0)}%
                    </Badge>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell className="flex space-x-2">
                  {editingRowId === (transaction.id || transaction._tempId) ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditingRowId(null)} className="flex items-center">
                        <XCircle size={16} className="mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => setEditingRowId(null)} className="flex items-center">
                        <CheckCircle size={16} className="mr-1" /> Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditingRowId(transaction.id || transaction._tempId)} className="flex items-center">
                        <Edit3 size={16} className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleTransactionDelete(transaction.id || transaction._tempId)}
                        className="flex items-center"
                      >
                        <Trash2 size={16} className="mr-1" /> Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end space-x-4 mt-4">
        <Button variant="secondary" onClick={onCancel}>
          <XCircle size={18} className="mr-2" /> Cancel Review
        </Button>
        <Button onClick={() => onConfirm(transactions)}>
          <CheckCircle size={18} className="mr-2" /> Confirm & Submit All
        </Button>
      </div>
    </div>
  );
};


// --- Main ChatInterface Component ---
const ChatInterface = () => {
  const RAIRO_API_BASE_URL = 'https://rairo-stmt-api.hf.space';
  const API_BASE_URL = 'https://quantnow.onrender.com';

  const [messages, setMessages] = useState<Array<{ id: string; sender: string; content: string | JSX.Element }>>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [typedDescription, setTypedDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recognitionRef = useRef<any>(null);
  const [transcribedText, setTranscribedText] = useState('');

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  // FIX: Corrected ref initialization
  const chatContainerRef = useRef<HTMLDivElement | null>(null); 

  const [showDocumentGeneration, setShowDocumentGeneration] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [documentStartDate, setDocumentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentEndDate, setDocumentEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false); // New loading state for document generation
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // AUTHENTICATION INTEGRATION
  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token from localStorage

  // Helper to get authorization headers
  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);


  const categories = [
    'Groceries', 'Rent', 'Utilities', 'Transport', 'Food', 'Salary', 'Deposit',
    'Loan', 'Debt Payment', 'Entertainment', 'Shopping', 'Healthcare', 'Education',
    'Travel', 'Investments', 'Insurance', 'Bills', 'Dining Out', 'Subscriptions', 'Other',
    'Sales', 'Interest Income', 'Cost of Goods Sold', 'Accounts Payable', 'Rent Expense',
    'Utilities Expenses', 'Car Loans', 'Sales Revenue', 'General Expense', 'Fees', 'Purchases', 'Refund',
    'Fuel', 'Salaries and wages', 'Projects Expenses', 'Accounting fees', 'Repairs & Maintenance',
    'Water and electricity', 'Bank charges', 'Insurance',
    'Loan interest', 'Computer internet and Telephone', 'Website hosting fees', 'Credit Facility'
  ];

  // Scroll to bottom of chat messages when new message arrives
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      // Clean up audio URL if it was created
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!isAuthenticated || !token) {
        console.warn('ImportScreen: Not authenticated. Skipping account fetch.');
        setAccounts([]);
        setIsLoadingAccounts(false);
        addAssistantMessage('Please log in to load accounts and import transactions.');
        return;
      }

      setIsLoadingAccounts(true);
      try {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
          headers: getAuthHeaders(), // Include auth headers
        });
        const data: Account[] = await response.json();
        setAccounts(Array.isArray(data) ? data : []);
        addAssistantMessage('Accounts loaded successfully. You can now import transactions.');
      } catch (error: any) {
        console.error('Failed to fetch accounts:', error);
        setAccounts([]);
        addAssistantMessage(`Failed to load accounts: ${error.message || 'Network error'}. Please ensure your backend server is running and you are logged in.`);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, [isAuthenticated, token, getAuthHeaders]); // Add isAuthenticated and token to dependencies

  const addMessage = (sender: string, content: string | JSX.Element) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, content }]);
  };

  const addAssistantMessage = (content: string | JSX.Element) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, sender: 'assistant', content }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, sender: 'user', content }]);
  };

  const submitTransaction = async (dataToSubmit: Transaction) => {
    if (!isAuthenticated || !token) {
      return { success: false, error: "Authentication required to submit transactions." };
    }

    const payload = {
      id: dataToSubmit.id || undefined,
      type: dataToSubmit.type || "expense",
      amount: Number(dataToSubmit.amount) || 0,
      date: dataToSubmit.date || new Date().toISOString().split("T")[0],
      description: dataToSubmit.description || "Imported Transaction",
      category: dataToSubmit.category || "Uncategorized",
      account_id: dataToSubmit.account_id ? String(dataToSubmit.account_id) : (accounts[0]?.id ? String(accounts[0].id) : null),
      original_text: dataToSubmit.original_text || null,
      source: dataToSubmit.source || 'manual',
      is_verified: dataToSubmit.is_verified !== undefined ? dataToSubmit.is_verified : true
    };

    if (payload.amount === 0) {
      return { success: false, error: "Amount cannot be zero. Please enter a valid amount." };
    }

    console.log("Final payload before submission:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/manual`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders(), // Include auth headers
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, transaction: result };
      } else {
        console.error("Submission error details:", result);
        return { success: false, error: result.detail || "Failed to submit transaction" };
      }
    } catch (error: any) {
      console.error("Error submitting transaction:", error);
      return { success: false, error: error.message || "Network error or server unavailable." };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      addAssistantMessage("No file selected.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      addAssistantMessage("Only PDF files are supported.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setTypedDescription(`File: ${selectedFile.name}`);
    e.target.value = "";
  };

  const handleFileUpload = async () => {
    if (!file) {
      addAssistantMessage('No file selected for upload.');
      return;
    }

    if (!isAuthenticated || !token) {
      addAssistantMessage('Authentication required to upload files.');
      return;
    }

    if (file.type !== 'application/pdf') {
      addAssistantMessage('Only PDF files are supported for processing.');
      setFile(null);
      setTypedDescription('');
      return;
    }

    addUserMessage(`Initiating PDF upload: ${file.name}...`);
    addAssistantMessage(`Processing PDF: ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Note: RAIRO_API_BASE_URL is assumed to be an external AI service
      // and might not require your internal JWT token.
      // If it does, you'd add headers here too.
      const response = await fetch(`${RAIRO_API_BASE_URL}/process-pdf`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('AI PDF API Response:', result);

      if (response.ok) {
        addAssistantMessage('PDF processed successfully! Please review the extracted transactions.');

        const transformedTransactions: Transaction[] = result.transactions.map((tx: any) => {
          const transactionType = tx.Type?.toLowerCase() || "expense";
          let transactionCategory = tx.Destination_of_funds || "Uncategorized";

          if (transactionType === 'income' && ['income', 'general income'].includes(transactionCategory.toLowerCase())) {
            transactionCategory = 'Sales Revenue';
          }

          let transactionDate;
          try {
            transactionDate = tx.Date
              ? new Date(tx.Date.split('/').reverse().join('-')).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];
          } catch (e) {
            console.error("Error parsing date from API:", tx.Date, e);
            transactionDate = new Date().toISOString().split('T')[0];
          }

          // 識 USE UPLOAD-SPECIFIC SUGGESTION FUNCTION
          const { accountId, confidence } = suggestAccountForUpload(
            { type: transactionType, category: transactionCategory, description: tx.Description }, 
            accounts
          );

          return {
            _tempId: crypto.randomUUID(),
            type: transactionType as 'income' | 'expense' | 'debt',
            amount: tx.Amount ? parseFloat(tx.Amount) : 0,
            description: tx.Description || "Imported Transaction",
            date: transactionDate,
            category: transactionCategory,
            account_id: accountId || '',
            original_text: tx.Original_Text || (tx.Description || "Imported Transaction"),
            source: 'pdf-upload',
            is_verified: true,
            confidenceScore: confidence,
          };
        });

        addAssistantMessage(
          <EditableTransactionTable
            transactions={transformedTransactions}
            accounts={accounts}
            categories={categories}
            onConfirm={handleConfirmProcessedTransaction}
            onCancel={() => {
              addAssistantMessage('Transaction review cancelled.');
            }}
          />
        );

      } else {
        const errorMessage = `Error processing file: ${result.error || 'Unknown error'}`;
        addAssistantMessage(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = `Network error during file upload: ${error.message || 'API is unavailable.'}`;
      console.error('Network error during file upload:', error);
      addAssistantMessage(errorMessage);
    } finally {
      setFile(null);
      setTypedDescription('');
    }
  };

  const handleTypedDescriptionSubmit = async () => {
    if (!typedDescription.trim()) {
      addAssistantMessage('Please enter a description.');
      return;
    }

    if (!isAuthenticated || !token) {
      addAssistantMessage('Authentication required to process text.');
      return;
    }

    const userMessageContent = typedDescription;
    addUserMessage(userMessageContent);
    addAssistantMessage('Analyzing description...');
    setTypedDescription('');

    try {
      // Note: RAIRO_API_BASE_URL is assumed to be an external AI service
      // and might not require your internal JWT token.
      // If it does, you'd add headers here too.
      const response = await fetch(`${RAIRO_API_BASE_URL}/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: userMessageContent }),
      });

      const result = await response.json();
      console.log('AI Text API Response:', result);

      if (response.ok) {
        addAssistantMessage('Description analyzed successfully! Please review the extracted transactions.');

        const transformedTransactions: Transaction[] = result.transactions.map((tx: any) => {
          const transactionType = tx.Type?.toLowerCase() || "expense";
          let transactionCategory = tx.Customer_name || "Uncategorized";

          if (transactionType === 'income' && ['income', 'general income'].includes(transactionCategory.toLowerCase())) {
            transactionCategory = 'Sales Revenue';
          }

          let transactionDate;
          try {
            transactionDate = tx.Date
              ? new Date(tx.Date.split('/').reverse().join('-')).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];
          } catch (e) {
            console.error("Error parsing date from API:", tx.Date, e);
            transactionDate = new Date().toISOString().split('T')[0];
          }

          // 識 USE TEXT-SPECIFIC SUGGESTION FUNCTION (since audio becomes text)
          const { accountId, confidence } = suggestAccountForText(
            { type: transactionType, category: transactionCategory, description: tx.Description }, 
            accounts
          );

          return {
            _tempId: crypto.randomUUID(),
            type: transactionType as 'income' | 'expense' | 'debt',
            amount: tx.Amount ? parseFloat(tx.Amount) : 0,
            description: tx.Description || "Imported Transaction",
            date: transactionDate,
            category: transactionCategory,
            account_id: accountId || '',
            original_text: userMessageContent,
            source: 'text-input',
            is_verified: true,
            confidenceScore: confidence,
          };
        });

        addAssistantMessage(
          <EditableTransactionTable
            transactions={transformedTransactions}
            accounts={accounts}
            categories={categories}
            onConfirm={handleConfirmProcessedTransaction}
            onCancel={() => {
              addAssistantMessage('Transaction review cancelled.');
            }}
          />
        );

      } else {
        const errorMessage = `Error analyzing description: ${result.error || 'Unknown error'}`;
        addAssistantMessage(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = `Network error during text processing: ${error.message || 'API is unavailable.'}`;
      console.error('Network error during text processing:', error);
      addAssistantMessage(errorMessage);
    }
  };

const startRecording = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    addAssistantMessage('Browser does not support speech recognition. Try Chrome.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsRecording(true);
    addUserMessage('Started voice input...');
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setTranscribedText(transcript);
    setTypedDescription(transcript);
    addUserMessage(`🗣️ "${transcript}"`);
    handleTypedDescriptionSubmit();
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event);
    addAssistantMessage(`Speech recognition error: ${event.error}`);
  };

  recognition.onend = () => {
    setIsRecording(false);
  };

  recognitionRef.current = recognition;
  recognition.start();
};


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addUserMessage('Stopped audio recording.');
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      addAssistantMessage('No audio recorded to upload.');
      return;
    }

    if (!isAuthenticated || !token) {
      addAssistantMessage('Authentication required to process audio.');
      return;
    }

    addUserMessage('Processing recorded audio...');
    
    try {
      const simulatedTranscribedText = "I paid fifty dollars for groceries on July fifth, two thousand twenty-five. I also received 1200 salary on the same day.";
      
      // Note: RAIRO_API_BASE_URL is assumed to be an external AI service
      // and might not require your internal JWT token.
      // If it does, you'd add headers here too.
      const processTextResponse = await fetch(`${RAIRO_API_BASE_URL}/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: simulatedTranscribedText }),
      });
      const result = await processTextResponse.json();
      console.log('AI Audio (Text) API Response:', result);

      if (processTextResponse.ok) {
        addAssistantMessage('Audio processed successfully! Please review the extracted transactions.');
        
        const transformedTransactions: Transaction[] = result.transactions.map((tx: any) => {
          const transactionType = tx.Type === 'income' ? 'income' : 'expense';
          let transactionCategory = tx.Destination_of_funds;

          if (transactionType === 'income' && ['income', 'general income'].includes(transactionCategory?.toLowerCase())) {
            transactionCategory = 'Sales Revenue';
          }

          let transactionDate;
          try {
            transactionDate = tx.Date
              ? new Date(tx.Date.split('/').reverse().join('-')).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];
          } catch (e) {
            console.error("Error parsing date from API:", tx.Date, e);
            transactionDate = new Date().toISOString().split('T')[0];
          }

          // 識 USE TEXT-SPECIFIC SUGGESTION FUNCTION (since audio becomes text)
          const { accountId, confidence } = suggestAccountForText(
            { type: transactionType, category: transactionCategory, description: tx.Description }, 
            accounts
          );

          return {
            _tempId: crypto.randomUUID(),
            type: transactionType as 'income' | 'expense' | 'debt',
            amount: tx.Amount ? parseFloat(tx.Amount) : 0,
            description: tx.Description || "Imported Transaction",
            date: transactionDate,
            category: transactionCategory,
            account_id: accountId || '',
            original_text: simulatedTranscribedText,
            source: 'audio-input',
            is_verified: true,
            confidenceScore: confidence,
          };
        });

        addAssistantMessage(
          <EditableTransactionTable
            transactions={transformedTransactions}
            accounts={accounts}
            categories={categories}
            onConfirm={handleConfirmProcessedTransaction}
            onCancel={() => {
              addAssistantMessage('Transaction review cancelled.');
            }}
          />
        );

      } else {
        const errorMessage = `Error processing audio: ${result.error || 'Unknown error'}`;
        addAssistantMessage(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = `Network error during audio processing: ${error.message || 'API is unavailable.'}`;
      console.error('Network error during audio processing:', error);
      addAssistantMessage(errorMessage);
    } finally {
      setAudioBlob(null);
      setAudioUrl(null);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = '';
      }
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = '';
    }
    addAssistantMessage('Audio cleared.');
  };

  const handleConfirmProcessedTransaction = async (transactionsToSave) => {
    addAssistantMessage("Submitting transactions...");

    let allSuccessful = true;
    const updatedTransactions = await Promise.all(
      transactionsToSave.map(async (transaction) => {
        const { success, transaction: savedTransaction, error } = await submitTransaction(transaction);
        if (!success) {
          allSuccessful = false;
          addAssistantMessage(`Failed to submit transaction: "${transaction.description || 'Unnamed Transaction'}". Reason: ${error}`);
        }
        return success ? { ...transaction, id: savedTransaction.id, _tempId: undefined } : transaction;
      })
    );

    if (allSuccessful) {
      addAssistantMessage(`Successfully submitted ${transactionsToSave.length} transactions.`);
      setShowDocumentGeneration(true);
    } else {
      addAssistantMessage("Some transactions failed. Please review the chat for details on failed transactions.");
    }
  };

  const handleGenerateFinancialDocument = async () => { // Made async
    if (!selectedDocumentType) {
      addAssistantMessage('Please select a document type to generate.');
      return;
    }
    if (!documentStartDate || !documentEndDate) {
      addAssistantMessage('Please select both start and end dates for the document.');
      return;
    }
    if (!isAuthenticated || !token) {
      addAssistantMessage('Authentication required to generate documents.');
      return;
    }

    setIsGeneratingDocument(true); // Set loading state
    addUserMessage(`Please generate a ${selectedDocumentType} for the period ${documentStartDate} to ${documentEndDate}.`);
addAssistantMessage(
  <div className="p-4 bg-blue-100 rounded-md shadow-sm">
    <p className="font-semibold text-blue-800">Generating your financial document...</p>
  </div>
);


    try {
      const downloadUrl = `${API_BASE_URL}/generate-financial-document?documentType=${selectedDocumentType}&startDate=${documentStartDate}&endDate=${documentEndDate}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: getAuthHeaders(), // Include auth headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate document: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${selectedDocumentType}-${documentStartDate}-to-${documentEndDate}.pdf`;

      // Create a temporary URL for the blob and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove(); // Clean up the temporary element
      window.URL.revokeObjectURL(url); // Clean up the object URL

      addAssistantMessage(
        <div className="p-4 bg-green-100 rounded-md shadow-sm">
          <p className="font-semibold mb-2">Document generated and download initiated!</p>
          <p className="text-sm">If the download did not start automatically, please check your browser's download settings.</p>
        </div>
      );

    } catch (error: any) {
      console.error('Error generating financial document:', error);
      addAssistantMessage(`Failed to generate document: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsGeneratingDocument(false); // Reset loading state
      setSelectedDocumentType('');
      setDocumentStartDate(new Date().toISOString().split('T')[0]);
      setDocumentEndDate(new Date().toISOString().split('T')[0]);
      setShowDocumentGeneration(false);
    }
  };

  const handleUnifiedSend = () => {
    if (file) {
      handleFileUpload();
    } else if (typedDescription.trim()) {
      if (typedDescription.startsWith('/audio')) {
        addAssistantMessage("Please use the microphone icon to record audio, then click play to process.");
        setTypedDescription('');
      } else if (typedDescription.startsWith('/upload')) {
        addAssistantMessage("Please use the paperclip icon to select a file, then click Send.");
        setTypedDescription('');
      } else if (typedDescription.startsWith('/text')) {
        const textToProcess = typedDescription.substring('/text'.length).trim();
        if (textToProcess) {
          setTypedDescription(textToProcess);
          handleTypedDescriptionSubmit();
        } else {
          addAssistantMessage("Please provide a description after '/text'.");
          setTypedDescription('');
        }
      } else {
        handleTypedDescriptionSubmit();
      }
    } else {
      addAssistantMessage("Please type a message or select a file to proceed.");
    }
  };

  return (
    <>
      {/* Chat Messages Display Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingAccounts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start"
          >
            <div className="max-w-[70%] p-3 rounded-2xl shadow-md bg-gray-200 text-gray-800">
              Loading accounts...
            </div>
          </motion.div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] p-3 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {typeof msg.content === 'string' ? msg.content : msg.content}
            </div>
          </motion.div>
        ))}

        {/* Document Generation Section */}
        {showDocumentGeneration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200 self-center w-full max-w-md mx-auto"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Generate Financial Document</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  id="documentType"
                  value={selectedDocumentType}
                  onValueChange={setSelectedDocumentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income-statement">Income Statement</SelectItem>
                    <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                    <SelectItem value="trial-balance">Trial Balance</SelectItem>
                    <SelectItem value="cash-flow-statement">Cash Flow Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentStartDate">Start Date</Label>
                  <Input
                    type="date"
                    id="documentStartDate"
                    value={documentStartDate}
                    onChange={(e) => setDocumentStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="documentEndDate">End Date</Label>
                  <Input
                    type="date"
                    id="documentEndDate"
                    value={documentEndDate}
                    onChange={(e) => setDocumentEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateFinancialDocument}
                className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                disabled={isGeneratingDocument} // Disable button while generating
              >
                {isGeneratingDocument ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <FileText size={18} className="mr-2" />
                )}
                {isGeneratingDocument ? 'Generating...' : 'Generate Document'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-white border-t shadow flex items-center space-x-2">
        <label htmlFor="file-upload-input" className="cursor-pointer">
          <Input
            id="file-upload-input"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept=".pdf"
            disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
          />
          <Button
            asChild
            variant="ghost"
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Attach File"
            disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
          >
          <span>
          <Paperclip size={20} className="text-gray-600" />
          </span>
          </Button>
        </label>

        {isRecording ? (
          <Button
            onClick={stopRecording}
            variant="ghost"
            className="rounded-full p-2 text-red-500 hover:bg-red-100 animate-pulse"
            aria-label="Stop Recording"
            disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
          >
            <StopCircle size={20} />
          </Button>
        ) : (
          <Button
            onClick={startRecording}
            variant="ghost"
            className="rounded-full p-2 text-purple-600 hover:bg-purple-100"
            aria-label="Start Recording"
            disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
          >
            <Mic size={20} />
          </Button>
        )}
        {audioBlob && (
          <>
            <audio ref={audioPlayerRef} src={audioUrl || ''} controls className="hidden"></audio>
            <Button
              onClick={uploadAudio}
              variant="ghost"
              className="rounded-full p-2 text-green-600 hover:bg-green-100"
              aria-label="Process Audio"
              disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
            >
              <Play size={20} />
            </Button>
            <Button
              onClick={clearAudio}
              variant="ghost"
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Clear Audio"
              disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
            >
              <Trash2 size={20} />
            </Button>
          </>
        )}

        <Input
          type="text"
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={isLoadingAccounts ? "Loading accounts..." : "Type a transaction description or command (/audio, /text)..."}
          value={typedDescription}
          onChange={(e) => setTypedDescription(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && (typedDescription.trim() || file)) {
              handleUnifiedSend();
            }
          }}
          disabled={isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
        />
        <Button
          onClick={handleUnifiedSend}
          disabled={(!typedDescription.trim() && !file && !isRecording && !audioBlob) || isLoadingAccounts || !isAuthenticated} // Disable if not authenticated
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          aria-label="Send Message"
        >
          <Send size={20} />
        </Button>
      </div>
    </>
  );
};

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header title="Import Financials (Chat Mode)" />
      <ChatInterface />
    </div>
  );
}

