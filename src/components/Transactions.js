
import React, { useState, useMemo } from "react";
import { useGetTransactions } from "../hooks/useGetTransactions.js";
import { useGetUserInfo }     from "../hooks/useGetUserInfo.js";
import { db }            from "../firebase.js";
import { ref, remove }   from "firebase/database";

import "./transactions.css";

const CATEGORY_ICONS = {
  "Food":          " ",
  "Transport":     " ",
  "Housing":       " ",
  "Health":        " ",
  "Entertainment": " ",
  "Salary":        " ",
  "Savings":       " ",
  "General":       " ",
  "Other":         " ",
};



// Formats a number as a South African Rand currency string
function fmt(n) {
  return "R " + Math.abs(Number(n)).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


export default function Transactions() {
  const { transactions } = useGetTransactions();
  const { userID } = useGetUserInfo();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
 const [monthFilter, setMonthFilter] = useState("all");

  
  const availableMonths = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      if (t.createdAt) {
        const d = new Date(t.createdAt);
        // e.g. "2026-03"
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    });
    // Sort descending so March 2026 appears before February 2026, etc.
    return Array.from(set).sort().reverse();
  }, [transactions]);


  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter skip this transaction if it doesn't match the selected type
      const matchType = typeFilter === "all" || t.transactionType === typeFilter;

      // Search filter  checks if the description contains the search text
      const matchSearch =
        !search || t.description?.toLowerCase().includes(search.toLowerCase());

      const matchMonth = (() => {
        if (monthFilter === "all") return true; // no month filter, always match
        if (!t.createdAt) return false;         // no timestamp ,can't match

        const d = new Date(t.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === monthFilter;
      })();

      // Only include the transaction if ALL three filters match
      return matchType && matchSearch && matchMonth;
    });
  }, [transactions, typeFilter, search, monthFilter]);


  const grouped = useMemo(() => {
    const map = {};

    filtered.forEach((t) => {
      // Use today's date as a fallback if the transaction has no timestamp
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

      // Create the group if it doesn't exist yet, then push the transaction in
      if (!map[key]) map[key] = { label, items: [] };
      map[key].items.push(t);
    });

    // (newest month first)
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);


  const now        = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Filter all (unfiltered) transactions to just those in this month
  const currentMonthTx = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const d = new Date(t.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === currentKey;
  });

  // Add up income and expenses for the current month separately
  const cmIncome   = currentMonthTx
    .filter(t => t.transactionType === "income")
    .reduce((sum, t) => sum + Number(t.transactionAmount), 0);

  const cmExpenses = currentMonthTx
    .filter(t => t.transactionType === "expense")
    .reduce((sum, t) => sum + Number(t.transactionAmount), 0);

  // Net = income minus expenses for this month
  const cmBalance = cmIncome - cmExpenses;

  // Removes a transaction from Firebase by its unique ID
  const handleDelete = async (id) => {
    try {
      await remove(ref(db, `transactions/${id}`));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };


  return (
    <div className="transactions-page">

      <div className="month-totals-row">

      
        <div className="mt-card">
          <div className="mt-label">This Month — Income</div>
         
          <div className="mt-value inc">{fmt(cmIncome)}</div>
        </div>

      
        <div className="mt-card">
          <div className="mt-label">This Month — Expenses</div>
          <div className="mt-value exp">{fmt(cmExpenses)}</div>
        </div>


        <div className="mt-card">
          <div className="mt-label">This Month — Net</div>
          <div className={`mt-value ${cmBalance >= 0 ? "bal" : "exp"}`}>
            {fmt(cmBalance)}
          </div>
        </div>
      </div>


      <div className="tx-toolbar">
        <div className="tx-search-wrap">
          <input
            className="tx-search"
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="tx-month-select"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="all">All Months</option>
          {availableMonths.map((m) => {
            // Convert "2026-03" to "March 2026"
            const [y, mo] = m.split("-");
            const label   = new Date(y, mo - 1).toLocaleDateString("en-ZA", {
              month: "long",
              year:  "numeric",
            });
            return <option key={m} value={m}>{label}</option>;
          })}
        </select>

        {/* Type filter buttons */}
        <div className="tx-type-filter">
          {["all", "income", "expense"].map((f) => (
            <button
              key={f}
              className={`txf-btn ${typeFilter === f ? "active" : ""}`}
              onClick={() => setTypeFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* GROUPED TRANSACTION LIST 
          One card per calendar month, each containing */}
      {grouped.length === 0 ? (

        // Empty state — shown when no transactions match the active filters
        <div className="tx-empty">
          <p>No transactions match your filters.</p>
        </div>

      ) : (
        grouped.map(([key, { label, items }]) => {

          // Calculate totals for just this month group
          const mIncome = items
            .filter(t => t.transactionType === "income")
            .reduce((s, t) => s + Number(t.transactionAmount), 0);

          const mExpenses = items
            .filter(t => t.transactionType === "expense")
            .reduce((s, t) => s + Number(t.transactionAmount), 0);

          return (
            <div key={key} className="card month-group">

              {/* Month group header — e.g. "March 2026  ·  3 transactions  |  +R25 000  −R6 500" */}
              <div className="month-header">
                <div className="month-header-left">
                  <div className="month-label">{label}</div>
                  <div className="month-count">
                    {items.length} transaction{items.length !== 1 ? "s" : ""}
                  </div>
                </div>
                {/* Quick income/expense summary for this month group */}
                <div className="month-summary">
                  <span className="ms-item inc">+{fmt(mIncome)}</span>
                  <span className="ms-item exp">−{fmt(mExpenses)}</span>
                </div>
              </div>

              {/* Individual transaction rows within this month */}
              {items.map((t) => {
                const icon = CATEGORY_ICONS[t.category] ||
                  (t.transactionType === "income" ? "+" : "-");

                // Format the date as "5 Mar" for the metadata line
                const dateStr = t.createdAt
                  ? new Date(t.createdAt).toLocaleDateString("en-ZA", {
                      day:   "numeric",
                      month: "short",
                    })
                  : "";

                return (
                  <div key={t.id} className="tx-row">

                    {/* Coloured icon bubble — green for income, red for expense */}
                    <div className={`tx-row-icon ${t.transactionType}`}>
                      {icon}
                    </div>

                    {/* Description and category/date metadata */}
                    <div className="tx-row-body">
                      <div className="tx-row-desc">{t.description}</div>
                      <div className="tx-row-meta">
                        {t.category || "General"} · {dateStr}
                      </div>
                    </div>

                    {/* Right side: amount, type badge, delete button */}
                    <div className="tx-row-right">
                      <div className={`tx-row-amount ${t.transactionType}`}>
                        {t.transactionType === "income" ? "+" : "−"}
                        {fmt(t.transactionAmount)}
                      </div>

                      {/*  "income" or "expense" */}
                      <div className={`tx-row-type-badge ${t.transactionType}`}>
                        {t.transactionType}
                      </div>

                      {/* Delete button removes from Firebase immediately */}
                      <button
                        className="tx-row-delete"
                        onClick={() => handleDelete(t.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
