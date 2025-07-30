import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/reports";

export const useReportsData = () => {
  const [reports, setReports] = useState({
    incomeStatement: [],
    trialBalance: [],
    balanceSheet: { assets: [], liabilities: [], equity: [] },
    cashflow: [],
    stocksheet: [],
    assetRegister: [],
    debtors: [],
    creditors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [
          incomeRes,
          trialRes,
          balanceRes,
          cashflowRes,
          stockRes,
          assetRes,
          debtorsRes,
          creditorsRes,
        ] = await Promise.all([
          fetch(`${API_URL}/income-statement`).then((r) => r.json()),
          fetch(`${API_URL}/trial-balance`).then((r) => r.json()),
          fetch(`${API_URL}/balance-sheet`).then((r) => r.json()),
          fetch(`${API_URL}/cashflow`).then((r) => r.json()),
          fetch(`${API_URL}/stocksheet`).then((r) => r.json()),
          fetch(`${API_URL}/asset-register`).then((r) => r.json()),
          fetch(`${API_URL}/debtors`).then((r) => r.json()),
          fetch(`${API_URL}/creditors`).then((r) => r.json()),
        ]);

        setReports({
          incomeStatement: incomeRes.income_statement,
          trialBalance: trialRes.trial_balance,
          balanceSheet: balanceRes,
          cashflow: cashflowRes.cashflow,
          stocksheet: stockRes.stocksheet,
          assetRegister: assetRes.asset_register,
          debtors: debtorsRes.debtors,
          creditors: creditorsRes.creditors,
        });
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return { reports, loading };
};
