import React, { useMemo } from "react";
import { useGetTransactions } from "../hooks/useGetTransactions.js";
import "./analytics.css";


function fmt(n) {
  return "R " + Math.abs(Number(n)).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtShort(n) {
  const abs = Math.abs(Number(n));
  if (abs >= 1000) return "R" + (abs / 1000).toFixed(1) + "k";
  return "R" + abs.toFixed(0);
}

// Builds an array of the last N calendar months (oldest → newest)
// Each entry has:
//   key   → "YYYY-MM" string used to match transaction timestamps
//   label → short month name like "Mar" used on chart axes
function lastNMonths(n) {
  const months = [];
  const now    = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-ZA", { month: "short" }),
    });
  }

  return months;
}


export default function Analytics() {
  const { transactions } = useGetTransactions();
  const months = lastNMonths(6);

  // ── MONTHLY INCOME & EXPENSES ──────────────────────────
  // For each of the last 6 months, add up income and expenses separately.
  // useMemo prevents this from recalculating on every render.
  const monthlyData = useMemo(() => {
    return months.map(({ key, label }) => {
      // Find all transactions that belong to this calendar month
      const mTx = transactions.filter((t) => {
        if (!t.createdAt) return false;
        const d = new Date(t.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === key;
      });

      // Sum income and expenses for this month
      const income   = mTx.filter(t => t.transactionType === "income")
                          .reduce((s, t) => s + Number(t.transactionAmount), 0);
      const expenses = mTx.filter(t => t.transactionType === "expense")
                          .reduce((s, t) => s + Number(t.transactionAmount), 0);

      return { key, label, income, expenses, net: income - expenses };
    });
  }, [transactions, months]);


  const totalIncome   = transactions.filter(t => t.transactionType === "income")
                                    .reduce((s, t) => s + Number(t.transactionAmount), 0);

  const totalExpenses = transactions.filter(t => t.transactionType === "expense")
                                    .reduce((s, t) => s + Number(t.transactionAmount), 0);

  const totalBalance  = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  // Average monthly expense (only counting months that had at least one expense)
  const avgMonthlyExpense =
    monthlyData.reduce((s, m) => s + m.expenses, 0) /
    Math.max(1, monthlyData.filter(m => m.expenses > 0).length);

 
  // Aggregate total spending per category, sorted highest first, capped at 6.
  const categoryData = useMemo(() => {
    const map = {};

    // Only look at expense transactions
    transactions
      .filter(t => t.transactionType === "expense")
      .forEach((t) => {
        const cat  = t.category || "General";
        map[cat] = (map[cat] || 0) + Number(t.transactionAmount);
      });

    // Sort descending by spend and take the top 6
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [transactions]);





  ///// TREND LINE (SVG POLYLINE)///////
  // Plots the net balance for each of the last 6 months as a connected line.
  const LINE_W = 400;
  const LINE_H = 130;

  const netValues = monthlyData.map(m => m.net);
  const minNet    = Math.min(...netValues, 0); // always include 0 in the range
  const maxNet    = Math.max(...netValues, 1); // avoid division by zero


  // INSIGHT CARDS DATA 
  // Find the month with the best and worst net balance
  const bestMonth  = [...monthlyData].sort((a, b) => b.net - a.net)[0];
  const worstMonth = [...monthlyData].sort((a, b) => a.net - b.net)[0];

  
  return (
    <div className="analytics-page">

      {/* ── HEADLINE STAT CARDS ──
          Four top-line numbers that summarise the user's overall finances */}
      <div className="an-stat-row">

        {/* Net balance — gold if positive, red if negative */}
        <div className="an-stat gold">
          <div className="an-stat-label">Net Balance</div>
          <div className={`an-stat-value ${totalBalance >= 0 ? "c-gold" : "c-red"}`}>
            {fmt(totalBalance)}
          </div>
          <div className="an-stat-sub">All time</div>
        </div>

        {/* Total income */}
        <div className="an-stat green">
          <div className="an-stat-label">Total Income</div>
          <div className="an-stat-value c-green">{fmt(totalIncome)}</div>
          <div className="an-stat-sub">All time</div>
        </div>

        {/* Total expenses */}
        <div className="an-stat red">
          <div className="an-stat-label">Total Expenses</div>
          <div className="an-stat-value c-red">{fmt(totalExpenses)}</div>
          <div className="an-stat-sub">All time</div>
        </div>

        {/* Savings rate */}
        <div className="an-stat blue">
          <div className="an-stat-label">Savings Rate</div>
          <div className="an-stat-value c-blue">{savingsRate}%</div>
          <div className="an-stat-sub">Of total income</div>
        </div>
      </div>

  



      {/*  SAVINGS RING  */}
      <div className="an-two-col">
        <div className="an-card">
          <div className="an-card-title">Savings Health</div>
          <div className="an-card-sub">How much of your income you're keeping</div>

          <div className="savings-ring-wrap">
            <svg width="130" height="130" viewBox="0 0 130 130">
              {/* Background track (the full grey ring) */}
              <circle
                cx="65" cy="65" r="54"
                fill="none"
                stroke="var(--dark4)"
                strokeWidth="12"
              />
              {/* Foreground arc — length determined by savings rate
                  strokeDasharray: [filled length] [total circumference]
                  Total circumference of r=54 ≈ 339.3 */}
              <circle
                cx="65" cy="65" r="54"
                fill="none"
                stroke={
                  savingsRate >= 20 ? "var(--gold)"
                  : savingsRate >= 10 ? "#f59e0b"
                  : "var(--red)"
                }
                strokeWidth="12"
                strokeDasharray={`${(savingsRate / 100) * 339.3} 339.3`}
                strokeDashoffset="84.8" // rotates the start to 12 o'clock position
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray .9s cubic-bezier(.4,0,.2,1)" }}
              />
            </svg>

            {/* Savings rate number and breakdown list */}
            <div>
              <div className="ring-label-stack">
                <div className="ring-pct">{savingsRate}%</div>
                <div className="ring-sub">Savings Rate</div>
              </div>
              <div className="ring-details" style={{ marginTop: 16 }}>
                <div className="rd-row">
                  <div className="rd-dot" style={{ background: "var(--green)" }} />
                  <div className="rd-label">Total Income</div>
                  <div className="rd-val">{fmt(totalIncome)}</div>
                </div>
                <div className="rd-row">
                  <div className="rd-dot" style={{ background: "var(--red)" }} />
                  <div className="rd-label">Total Spent</div>
                  <div className="rd-val">{fmt(totalExpenses)}</div>
                </div>
                <div className="rd-row">
                  <div className="rd-dot" style={{ background: "var(--gold)" }} />
                  <div className="rd-label">Saved</div>
                  {/* Math.max(0, ...) prevents showing a negative "saved" amount */}
                  <div className="rd-val">{fmt(Math.max(0, totalBalance))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHT CARDS ── */}
      <div className="an-two-col">

        {/* ── KEY INSIGHT CARDS ──
            Four summary observations automatically derived from the data */}
        <div className="an-card">
          <div className="an-card-title">Key Insights</div>
          <div className="an-card-sub">Smart observations from your data</div>

          <div className="insight-grid">

       

            {/* Average monthly spend across all months that had expenses */}
            <div className="insight-card">
              <div className="insight-title">Avg Monthly Spend</div>
              <div className="insight-value">{fmt(avgMonthlyExpense)}</div>
              <div className="insight-desc">Based on active months</div>
            </div>

            {/* Whether the user is meeting the 20% savings rate target */}
            <div className="insight-card">
              <div className="insight-title">Savings Goal</div>
              <div className="insight-value">
                {savingsRate >= 40 ? " Met" : "Below"}
              </div>
              <div className="insight-desc">Target: 40% savings rate</div>
            </div>

            {/* Worst month — the month with the lowest (most negative) net balance */}
            <div className="insight-card">
              <div className="insight-title">Worst Month</div>
              <div className="insight-value">
                {worstMonth ? worstMonth.label : "—"}
              </div>
              <div className="insight-desc">
                {worstMonth ? `Net: ${fmt(worstMonth.net)}` : "Not enough data"}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
