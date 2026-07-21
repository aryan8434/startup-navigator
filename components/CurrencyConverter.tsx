"use client";

import { useState } from "react";
import { ArrowRightLeft, IndianRupee, DollarSign, Euro, PoundSterling } from "lucide-react";

const RATES: Record<string, number> = {
  INR: 1,
  USD: 83.5,
  EUR: 91.2,
  GBP: 108.4,
};

const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(10000);
  const [fromCurr, setFromCurr] = useState<string>("INR");
  const [toCurr, setToCurr] = useState<string>("USD");

  const convertAmount = () => {
    if (isNaN(amount) || amount <= 0) return 0;
    const amountInINR = amount * RATES[fromCurr];
    const converted = amountInINR / RATES[toCurr];
    return converted.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex items-center space-x-2 mb-3">
        <div className="rounded-lg bg-indigo-500/20 p-1.5 text-indigo-400 border border-indigo-500/30">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-white font-display">Live Currency Converter</h3>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
          INR (₹) Enabled
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{SYMBOLS[fromCurr]}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-7 pr-3 py-2 text-white font-mono font-bold focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">From</label>
          <select
            value={fromCurr}
            onChange={(e) => setFromCurr(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="INR">INR (₹ Rupees)</option>
            <option value="USD">USD ($ Dollar)</option>
            <option value="EUR">EUR (€ Euro)</option>
            <option value="GBP">GBP (£ Pound)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">To</label>
          <select
            value={toCurr}
            onChange={(e) => setToCurr(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="USD">USD ($ Dollar)</option>
            <option value="INR">INR (₹ Rupees)</option>
            <option value="EUR">EUR (€ Euro)</option>
            <option value="GBP">GBP (£ Pound)</option>
          </select>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">Converted Value:</span>
        <span className="text-base font-extrabold text-emerald-400 font-mono">
          {SYMBOLS[toCurr]} {convertAmount()} {toCurr}
        </span>
      </div>
    </div>
  );
}
