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
  AlertTriangle,
  ArrowRightLeft,
  Scale
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
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState<boolean>(false);

  // Single Transaction Form states
  const [accountType, setAccountType] = useState<string>('CASH');
  const [txType, setTxType] = useState<string>('CASH_IN');
  const [amount, setAmount] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Contra Transfer states
  const [fromAccount, setFromAccount] = useState<string>('CASH');
  const [toAccount, setToAccount] = useState<string>('BANK');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferRef, setTransferRef] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');

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
      setAmount(0);
      setReferenceNumber('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert('Error posting transaction: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExecuteTransfer = async () => {
    if (transferAmount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }
    if (fromAccount === toAccount) {
      alert('Source and destination accounts must be different.');
      return;
    }

    try {
      await cashBankApi.recordTransfer({
        fromAccount,
        toAccount,
        amount: transferAmount,
        referenceNumber: transferRef || `XFER-${Date.now()}`,
        notes: transferNotes || `Transfer from ${fromAccount} to ${toAccount}`
      });

      showToast(`⚡ Contra Transfer of ₹${transferAmount} from ${fromAccount} to ${toAccount} posted!`);
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferRef('');
      setTransferNotes('');
      loadData();
    } catch (err: any) {
      alert('Error executing transfer: ' + (err.response?.data?.message || err.message));
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
            Monitor real-time cash drawer balances, bank accounts, transfer funds between accounts, and execute daily closing reconciliations
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
            onClick={() => setIsTransferModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer (Cash ⇄ Bank)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cash Drawer Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Main Cash Drawer (Vault)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[#1C1C1C] dark:text-white leading-none font-mono">₹{cashBalance.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Liquid Physical Cash on Hand</div>
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
            <div className="text-3xl font-extrabold text-[#1C1C1C] dark:text-white leading-none font-mono">₹{bankBalance.toLocaleString()}</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Reconciled Commercial Bank Funds</div>
          </div>
        </div>

        {/* Combined Treasury Liquid Funds */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xs space-y-3 border border-indigo-900/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 truncate">Total Liquid Treasury</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-400 leading-none font-mono">₹{(cashBalance + bankBalance).toLocaleString()}</div>
            <div className="text-[11px] text-indigo-200 font-semibold pt-0.5">Cash + Bank Combined Reserves</div>
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-3 p-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#ECEFF2] dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C] dark:text-white">Recent Cash & Bank Activity</h3>
          <span className="text-xs text-[#8C8C8C] font-semibold font-mono">{transactions.length} Treasury Log Postings</span>
        </div>

        <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Movement</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Cash Balance</th>
                <th className="py-3 px-4 text-right">Bank Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800 font-mono">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs font-bold text-[#8C8C8C] font-sans">
                    No cash or bank transactions recorded in database yet. Click "Record Transaction" or "Transfer" to add a posting.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isInflow = tx.transactionType === 'CASH_IN' || tx.transactionType === 'BANK_DEPOSIT';
                  const isContra = tx.transactionType === 'TRANSFER';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.accountType === 'CASH' 
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                        }`}>
                          {tx.accountType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isContra
                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                            : isInflow
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                        }`}>
                          {isContra ? '⇄ CONTRA' : isInflow ? '+ INFLOW' : '- OUTFLOW'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]">
                        {tx.referenceNumber || tx.transactionNumber}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {tx.notes || tx.referenceType || 'Treasury Posting'}
                      </td>
                      <td className={`py-3 px-4 text-right font-black text-sm ${
                        isContra ? 'text-purple-600' : isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isInflow ? '+' : isContra ? '⇄' : '-'} ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-bold">
                        ₹{(tx.runningCashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-bold">
                        ₹{(tx.runningBankBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CONTRA TRANSFER MODAL (CASH ⇄ BANK) ───────────────────────────── */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#ECEFF2] dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#ECEFF2] dark:border-slate-800 flex justify-between items-center bg-purple-50 dark:bg-purple-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-950 dark:text-purple-200">Contra Treasury Transfer</h3>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400">Transfer funds between Cash Drawer & Bank</p>
                </div>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">From (Source) *</label>
                  <CustomSelect
                    value={fromAccount}
                    onChange={val => {
                      setFromAccount(val);
                      if (val === 'CASH') setToAccount('BANK');
                      else setToAccount('CASH');
                    }}
                    options={[
                      { value: 'CASH', label: `Cash Drawer (₹${cashBalance.toLocaleString()})` },
                      { value: 'BANK', label: `HDFC Bank (₹${bankBalance.toLocaleString()})` },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">To (Destination) *</label>
                  <CustomSelect
                    value={toAccount}
                    onChange={val => {
                      setToAccount(val);
                      if (val === 'BANK') setFromAccount('CASH');
                      else setFromAccount('BANK');
                    }}
                    options={[
                      { value: 'BANK', label: `HDFC Bank (₹${bankBalance.toLocaleString()})` },
                      { value: 'CASH', label: `Cash Drawer (₹${cashBalance.toLocaleString()})` },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={transferAmount || ''}
                  onChange={e => setTransferAmount(Number(e.target.value))}
                  placeholder="Enter amount to transfer"
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-sm font-bold font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. CASH-DEP-1029"
                  value={transferRef}
                  onChange={e => setTransferRef(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Route cash collections deposit into HDFC bank..."
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Execute Contra Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SINGLE TRANSACTION POSTING MODAL ──────────────────────────────── */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#ECEFF2] dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#ECEFF2] dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1C1C1C] dark:bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
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

            <div className="px-5 pb-5 space-y-3.5 text-xs font-sans">
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
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
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

      {/* ─── DAILY CASH DRAWER RECONCILIATION MODAL ───────────────────────── */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#ECEFF2] dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#ECEFF2] dark:border-slate-800 flex justify-between items-center bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Daily Cash Drawer Closing Audit</h3>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">Reconcile physical cash counted vs system balance</p>
                </div>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Expected System Cash Balance</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">₹{cashBalance.toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Actual Physical Cash Counted (₹) *</label>
                <input
                  type="number"
                  value={countedCash || ''}
                  onChange={e => setCountedCash(Number(e.target.value))}
                  placeholder="Enter counted physical notes & coins"
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-base font-bold font-mono px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              {countedCash > 0 && (
                <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs font-bold ${
                  cashDiscrepancy === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                    : cashDiscrepancy > 0
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 text-blue-800 dark:text-blue-300'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 text-red-800 dark:text-red-300'
                }`}>
                  <span className="font-sans">Reconciliation Variance:</span>
                  <span>{cashDiscrepancy >= 0 ? '+' : ''}₹{cashDiscrepancy.toLocaleString()}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold mb-1">Audit Notes / Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Any cash discrepancies, denominations notes..."
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Daily Closing
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
