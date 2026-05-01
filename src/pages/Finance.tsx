import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Download,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: number;
  createdAt: number;
}

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data: Transaction[] = [];
        snap.forEach((d) => {
          data.push({ id: d.id, ...d.data() } as Transaction);
        });
        setTransactions(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "transactions");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Overview
          </h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Track revenue, expenses, and pending payments.
          </p>
        </div>
        <button className="btn-secondary text-sm py-2">
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-brand-green/20">
          <h3 className="text-primary-text/50 text-sm font-medium mb-2">
            Total Revenue
          </h3>
          <div className="flex items-end gap-3">
            {loading ? (
              <Loader2 className="animate-spin text-brand-green w-6 h-6" />
            ) : (
              <span className="text-3xl font-bold text-brand-green">
                ${totalIncome.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-primary-text/50 text-sm font-medium mb-2">
            Total Expenses
          </h3>
          <div className="flex items-end gap-3">
            {loading ? (
              <Loader2 className="animate-spin text-primary-text w-6 h-6" />
            ) : (
              <span className="text-3xl font-bold text-primary-text">
                ${totalExpense.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-primary-text/50 text-sm font-medium mb-2">
            Net Profit
          </h3>
          <div className="flex items-end gap-3">
            {loading ? (
              <Loader2 className="animate-spin text-primary-text w-6 h-6" />
            ) : (
              <span className="text-3xl font-bold text-primary-text">
                ${netProfit.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel mt-6">
        <div className="p-5 border-b border-primary-text/5 flex justify-between items-center bg-primary-text/5">
          <h3 className="font-semibold">Recent Transactions</h3>
          <button className="text-sm text-brand-green">View All</button>
        </div>
        <div className="divide-y divide-white/5 min-h-[100px]">
          {loading ? (
            <div className="p-8 flex justify-center text-primary-text/40">
              <Loader2 className="animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-primary-text/40">
              No transactions recorded.
            </div>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="p-5 flex items-center justify-between hover:bg-primary-text/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      t.type === "income"
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-red-500/10 text-red-400",
                    )}
                  >
                    {t.type === "income" ? (
                      <ArrowDownRight size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-xs text-primary-text/40 mt-0.5">
                      {t.date
                        ? formatDistanceToNow(t.date, { addSuffix: true })
                        : ""}
                    </p>
                  </div>
                </div>
                <div
                  className={clsx(
                    "font-bold",
                    t.type === "income"
                      ? "text-brand-green"
                      : "text-primary-text",
                  )}
                >
                  {t.type === "income" ? "+" : "-"}$
                  {Math.abs(t.amount).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
