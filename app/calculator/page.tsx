"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CurrencyConverter from "@/components/CurrencyConverter";
import {
  Calculator,
  IndianRupee,
  TrendingUp,
  Boxes,
  PieChart,
  Download,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default function CostCalculatorPage() {
  const [inputs, setInputs] = useState({
    toolingCost: 250000,
    rawMaterialCost: 280,
    laborCost: 120,
    packagingCost: 45,
    monthlyOverhead: 65000,
    targetPrice: 1499,
    monthlyVolume: 500,
  });

  // Derived Calculations
  const cogsPerUnit = inputs.rawMaterialCost + inputs.laborCost + inputs.packagingCost;
  const grossProfitPerUnit = Math.max(0, inputs.targetPrice - cogsPerUnit);
  const grossMarginPercent = inputs.targetPrice > 0 ? (grossProfitPerUnit / inputs.targetPrice) * 100 : 0;
  
  const monthlyRevenue = inputs.monthlyVolume * inputs.targetPrice;
  const monthlyCogs = inputs.monthlyVolume * cogsPerUnit;
  const monthlyGrossProfit = inputs.monthlyVolume * grossProfitPerUnit;
  const monthlyOperatingIncome = monthlyGrossProfit - inputs.monthlyOverhead;

  const contributionMarginPerUnit = inputs.targetPrice - cogsPerUnit;
  const breakEvenUnitsMonth =
    contributionMarginPerUnit > 0
      ? Math.ceil(inputs.monthlyOverhead / contributionMarginPerUnit)
      : 0;

  const paybackMonths =
    monthlyOperatingIncome > 0 ? (inputs.toolingCost / monthlyOperatingIncome).toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Header */}
      <section className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-400 border border-purple-500/20 mb-4">
            <Calculator className="h-3.5 w-3.5" />
            <span>Hardware & Manufacturing Economics (₹ INR)</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display">
            Manufacturing Unit Cost & <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">ROI Calculator</span>
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-300">
            Simulate COGS, tooling payback schedules, gross margins, and monthly break-even unit volumes in Indian Rupees (₹).
          </p>
        </div>
      </section>

      {/* Calculator Main Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Currency Converter */}
        <CurrencyConverter />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Column */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-5">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <Boxes className="h-5 w-5 text-indigo-400" />
              <span>Production Parameters (₹ INR)</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tooling & Mold Setup Capex (₹)
              </label>
              <input
                type="number"
                value={inputs.toolingCost}
                onChange={(e) => setInputs({ ...inputs, toolingCost: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Raw Material / Unit (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  value={inputs.rawMaterialCost}
                  onChange={(e) => setInputs({ ...inputs, rawMaterialCost: Number(e.target.value) })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Labor / Assembly (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  value={inputs.laborCost}
                  onChange={(e) => setInputs({ ...inputs, laborCost: Number(e.target.value) })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Packaging Buffer (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  value={inputs.packagingCost}
                  onChange={(e) => setInputs({ ...inputs, packagingCost: Number(e.target.value) })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target MSRP / Unit (₹)
                </label>
                <input
                  type="number"
                  step="10"
                  value={inputs.targetPrice}
                  onChange={(e) => setInputs({ ...inputs, targetPrice: Number(e.target.value) })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monthly Overhead / Rent (₹)
              </label>
              <input
                type="number"
                value={inputs.monthlyOverhead}
                onChange={(e) => setInputs({ ...inputs, monthlyOverhead: Number(e.target.value) })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Monthly Production (Units): <strong className="text-indigo-400">{inputs.monthlyVolume}</strong>
              </label>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={inputs.monthlyVolume}
                onChange={(e) => setInputs({ ...inputs, monthlyVolume: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Key Metric Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Unit COGS</span>
                <p className="text-2xl font-extrabold text-white mt-1">₹{cogsPerUnit.toFixed(0)}</p>
                <span className="text-[10px] text-slate-400">Materials + Labor + Packaging</span>
              </div>

              <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5 text-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase">Gross Margin</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{grossMarginPercent.toFixed(1)}%</p>
                <span className="text-[10px] text-emerald-300">₹{grossProfitPerUnit.toFixed(0)} profit / unit</span>
              </div>

              <div className="rounded-2xl border border-purple-900/50 bg-purple-950/20 p-5 text-center col-span-2 sm:col-span-1">
                <span className="text-xs font-semibold text-purple-300 uppercase">Tooling Payback</span>
                <p className="text-2xl font-extrabold text-purple-300 mt-1">{paybackMonths} Mo.</p>
                <span className="text-[10px] text-purple-300">Time to recoup mold capex</span>
              </div>
            </div>

            {/* Monthly Financial Output */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Monthly Pro-Forma Income Statement (₹ INR)</span>
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Gross Monthly Revenue ({inputs.monthlyVolume} units @ ₹{inputs.targetPrice})</span>
                  <span className="font-semibold text-white">₹{monthlyRevenue.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Total Monthly Production COGS</span>
                  <span className="font-semibold text-rose-400">-₹{monthlyCogs.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Gross Profit</span>
                  <span className="font-semibold text-emerald-400">₹{monthlyGrossProfit.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-300">Fixed Monthly Factory Overhead / Operating Expense</span>
                  <span className="font-semibold text-rose-400">-₹{inputs.monthlyOverhead.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between py-3 px-4 rounded-xl bg-slate-950 text-base font-bold text-emerald-400 border border-emerald-900/30">
                  <span>Net Monthly Operating Income</span>
                  <span>₹{monthlyOperatingIncome.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Break-even & Insights */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-2">Break-Even & Viability Summary (₹ INR)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                To cover your monthly factory overhead of <strong>₹{inputs.monthlyOverhead.toLocaleString("en-IN")}</strong>, your business must produce and sell at least <strong className="text-indigo-400">{breakEvenUnitsMonth} units</strong> every month. 
                At your projected volume of <strong>{inputs.monthlyVolume} units</strong>, your net monthly operating profit is <strong className="text-emerald-400">₹{monthlyOperatingIncome.toLocaleString("en-IN")}</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
