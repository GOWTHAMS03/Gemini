import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Lock, 
  AlertCircle,
  X,
  CheckCircle2,
  Wallet,
  Building2,
  Receipt,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cashBankApi, ApiCashBankTransaction } from '../services/apiService';
import { CustomSelect } from '../components/common';

export const CashBankPage: React.FC = () => {
  const [transactions, setTransactions] = useState<ApiCashBankTransaction[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0.00);
  const [bankBalance, setBankBalance] = useState<number>(0.00);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState<boolean>(false);

  // Form states
  const [accountType, setAccountType] = useState<string>('CASH');
  const [txType, setTxType] = useState<string>('CASH_IN');
  const [amount, setAmount] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Daily Closing Audit states
  const [countedCash, setCountedCash] = useState<number>(0.00);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txRes, balRes] = await Promise.all([
        cashBankApi.getTransactions(),
        cashBankApi.getBalances()
      ]);
      setTransactions(txRes.data || []);
      if (balRes.data) {
        setCashBalance(balRes.data.cashBalance ?? 0.00);
        setBankBalance(balRes.data.bankBalance ?? 0.00);
      }
    } catch (err) {
      console.error('Error loading cash/bank data:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handlePostTransaction = async () => {
    if (amount <= 0) {
      alert('Please enter a valid transaction amount.');
      return;
    }

    try {
      await cashBankApi.recordTransaction({
        accountType,
        transactionType: txType,
        amount,
        referenceNumber,
        notes: description
      });

      showToast(`Treasury ${txType} of ₹${amount} posted to ${accountType}!`);
      setIsTxModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error posting transaction: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExecuteDailyClosing = async () => {
    try {
      await cashBankApi.executeDailyClosing({
        actualCashCounted: countedCash,
        notes
      });

      showToast('Daily cash drawer reconciliation closed successfully!');
      setIsClosingModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error executing closing: ' + (err.response?.data?.message || err.message));
    }
  };

  const cashDiscrepancy = countedCash - cashBalance;

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-slate-900 text-emerald-400 border border-emerald-500/50 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 right-6 z-[999999] max-w-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white hover:opacity-75 cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Styled Executive Control Tower Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Cash & Bank Treasury Management
            </h1>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-emerald-500" />
              Live Treasury Vault Balances
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Monitor real-time cash drawer balances, bank accounts, log cash deposits, and execute end-of-day cash drawer closing reconciliations
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadData}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Treasury Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsClosingModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Lock className="w-4 h-4" /> Execute Daily Closing
          </button>
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Record Transaction
          </button>
        </div>
      </div>

      {/* Account Balances Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cash Drawer Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Main Cash Drawer</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{cashBalance.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Liquid Cash on Hand</div>
          </div>
        </div>

        {/* Bank Account Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">HDFC Current Bank Account</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{bankBalance.toLocaleString()}</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Reconciled Bank Funds</div>
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-3 p-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#ECEFF2] dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C] dark:text-white">Recent Cash & Bank Activity</h3>
          <span className="text-xs text-[#8C8C8C] font-semibold">{transactions.length} Treasury Log Postings</span>
        </div>

        <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No cash or bank transactions recorded in database yet. Click "Record Transaction" to add a posting.
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.accountType === 'CASH'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                      }`}>
                        {t.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {t.transactionType}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t.referenceNumber || t.transactionNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 text-xs">
                      {t.notes || '-'}
                    </td>
                    <td className={`py-3 px-4 text-right font-extrabold ${
                      t.transactionType.includes('IN') || t.transactionType.includes('DEPOSIT')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.transactionType.includes('IN') || t.transactionType.includes('DEPOSIT') ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1C1C1C] dark:text-white">
                      ₹{(t.accountType === 'CASH' ? t.runningCashBalance : t.runningBankBalance)?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Treasury Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Post Treasury Transaction</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Deposit or withdraw cash/bank funds</p>
                </div>
              </div>
              <button onClick={() => setIsTxModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Target Account *</label>
                  <CustomSelect
                    value={accountType}
                    onChange={val => setAccountType(val)}
                    options={[
                      { value: 'CASH', label: 'Cash Drawer', badge: 'CASH' },
                      { value: 'BANK', label: 'Bank Account', badge: 'BANK' },
                    ]}
                    placeholder="Select Account"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Movement Type *</label>
                  <CustomSelect
                    value={txType}
                    onChange={val => setTxType(val)}
                    options={[
                      { value: 'CASH_IN', label: 'Cash In (+ Inflow)', badge: '+ IN' },
                      { value: 'CASH_OUT', label: 'Cash Out (- Outflow)', badge: '- OUT' },
                      { value: 'BANK_DEPOSIT', label: 'Bank Deposit (+)', badge: '+ DEP' },
                      { value: 'BANK_WITHDRAWAL', label: 'Bank Withdrawal (-)', badge: '- WDL' },
                    ]}
                    placeholder="Select Movement"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Transaction Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR / Cheque #"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Transaction details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostTransaction}
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Post Treasury Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Cash Drawer Audit Closing Modal */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Daily Cash Drawer Closing Audit</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Reconcile system cash with physical note count</p>
                </div>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3.5 text-xs">
              <div className="p-3 bg-[#F7F9FB] dark:bg-slate-800/80 rounded-xl space-y-1.5 border border-[#ECEFF2] dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8C8C8C]">Expected System Cash:</span>
                  <span className="font-mono font-bold text-[#1C1C1C] dark:text-white">₹{cashBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8C8C8C]">Actual Counted Cash:</span>
                  <span className="font-mono font-bold text-emerald-600">₹{countedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold">Discrepancy / Shortage:</span>
                  <span className={`font-mono font-extrabold ${cashDiscrepancy === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {cashDiscrepancy === 0 ? '₹0.00 (Balanced)' : `₹${cashDiscrepancy.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Physical Cash Count (₹) *</label>
                <input
                  type="number"
                  value={countedCash}
                  onChange={e => setCountedCash(Number(e.target.value))}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Audit Notes / Explanations</label>
                <textarea
                  rows={2}
                  placeholder="Notes on cash drawer discrepancy if any..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDailyClosing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm & Close Cash Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBankPage;
