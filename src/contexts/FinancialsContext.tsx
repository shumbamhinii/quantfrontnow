import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define interfaces for your data structures
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD format
  category: string;
  account_id: string; // Assuming transactions are linked to accounts
  created_at: string;
  updated_at: string;
}

interface FinancialsContextType {
  latestProcessedTransactions: Transaction[];
  setLatestProcessedTransactions: (transactions: Transaction[]) => void;
  // Add any other financial data or functions you want to share
}

// Create the context with a default undefined value for TypeScript
const FinancialsContext = createContext<FinancialsContextType | undefined>(undefined);

interface FinancialsProviderProps {
  children: ReactNode;
}

/**
 * Provides financial data context to its children.
 * @param {object} { children } - React children to be rendered within the provider.
 */
export const FinancialsProvider: React.FC<FinancialsProviderProps> = ({ children }) => {
  // State to hold the latest processed transactions
  const [latestProcessedTransactions, setLatestProcessedTransactions] = useState<Transaction[]>([]);

  // The value provided to consumers of this context
  const contextValue: FinancialsContextType = {
    latestProcessedTransactions,
    setLatestProcessedTransactions,
  };

  return (
    <FinancialsContext.Provider value={contextValue}>
      {children}
    </FinancialsContext.Provider>
  );
};

/**
 * Custom hook to consume the FinancialsContext.
 * Throws an error if used outside of a FinancialsProvider.
 * @returns {object} The context value containing latestProcessedTransactions and setLatestProcessedTransactions.
 */
export const useFinancials = () => {
  const context = useContext(FinancialsContext);
  if (context === undefined) { // Check for undefined for TypeScript
    throw new Error('useFinancials must be used within a FinancialsProvider');
  }
  return context;
};
