import React, { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";

// Custom hooks — each one talks to Firebase Realtime Database
import { useAddTransaction }  from "../hooks/useAddTransaction.js";
import { useGetTransactions } from "../hooks/useGetTransactions.js";
import { useGetUserInfo }     from "../hooks/useGetUserInfo.js";

// Firebase instances
import { auth, db } from "../firebase.js";

import { ref, remove } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import "./home.css";

///////// CONSTANTS/////////

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1642790551116-18e150f248e5?w=1200&auto=format&fit=crop&q=80";


const MONTHLY_BUDGET = 25000;

const CATEGORY_MAP = {
  Food:          " ",
  Transport:     " ",
  Housing:       " ",
  Health:        " ",
  Entertainment: " ",
  Salary:        " ",
  Savings:       " ",
  General:       " ",
  Other:         " ",
};

// COMPONENT ///////////////
export default function Home() {

  // DATA FROM HOOKS 

  // User details stored in localStorage after login
  const { name, profilePhoto, userID } = useGetUserInfo();

  // All transactions for the logged-in user from Firebase,
  const { transactions, transactionTotals } = useGetTransactions();

  // Function that writes a new transaction to Firebase
  const { addTransaction } = useAddTransaction();

  // useNavigate lets us redirect programmatically 
  const navigate = useNavigate();

  // useLocation gives us the current URL path so we can mark the correct
  const location = useLocation();

  // SIDEBAR NAVIGATION LINKS 
  const NAV_LINKS = [
    { label: "Dashboard",    path: "/home" },
    { label: "Transactions", path: "/transactions" },
    { label: "Analytics",    path: "/analytics" },
    { label: "Profile",      path: "/profile" },
  ];

  // LOCAL STATE 

  // Controlled inputs for the "Add Transaction" form
  const [description,       setDescription]       = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType,   setTransactionType]   = useState("expense"); // default to "expense"
  const [category,          setCategory]          = useState("General");

  // Tracks whether Firebase has finished checking if the user is logged in.
  // We show a loading screen until this is false.
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Controls the active filter chip on the transaction list
  // Possible values: "all" | "income" | "expense"
  const [filter, setFilter] = useState("all");

  //TOTALS 


  const { balance, income, expenses } = transactionTotals;

  // DERIVED CALCULATIONS 

  // Get only the expense transactions so we can calculate the average
  const expenseTxns = transactions.filter(
    (t) => t.transactionType === "expense"
  );

  // rounded to whole Rands
  // Shows "0" if there are no expense transactions yet
  const avgExpense =
    expenseTxns.length > 0
      ? (expenses / expenseTxns.length).toFixed(0)
      : 0;

  
  // Math.max(0, ...) prevents it from showing a negative percentage.
  const savingsRate =
    income > 0
      ? Math.max(0, Math.round(((income - expenses) / income) * 100))
      : 0;

  // Budget used percentage — capped at 100% so the bar never overflows
  const budgetPct = Math.min(
    100,
    Math.round((expenses / MONTHLY_BUDGET) * 100)
  );

  // date
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  /////// AUTH GUARD ////////
  // Listen for Firebase auth state changes.
  // If no user is logged in, redirect to the Welcome page immediately.
  // This prevents unauthenticated users from accessing the dashboard.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/"); // send to login page
      } else {
        setLoadingAuth(false); // user is valid — show the page
      }
    });

    // Clean up the auth listener when the component unmounts
    // to avoid memory leaks
    return () => unsub();
  }, [navigate]);

  //////FORM SUBMIT HANDLER /////////
  // Called when the user clicks "Add Transaction"
  const onSubmit = (e) => {
    e.preventDefault(); // stop the browser from refreshing the page

    // Pass all form values to the custom hook which saves to Firebase
    addTransaction({ description, transactionAmount, transactionType, category });

    // Clear the form fields so the user can add another transaction
    setDescription("");
    setTransactionAmount("");
  };

  ///////DELETE HANDLER //////
  // Removes a single transaction from Firebase by its unique ID
  const handleDelete = async (transactionId) => {
    try {
      // Build a reference to exactly that node in the database tree
      const transactionRef = ref(db, `transactions/${transactionId}`);
      await remove(transactionRef);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  //////SIGN OUT HANDLER ///////
  // Signs the user out of Firebase, clears any stored auth info,
  // and redirects them back to the login/welcome page
  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/");
  };

  ////// FILTER TRANSACTIONS//////
  // Applies the active filter to show "all", "income" only, or "expense" only
  const filteredTxns =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.transactionType === filter);


  // Converts a number to a formatted South African Rand string
  const fmt = (n) =>
    "R " +
    Number(Math.abs(n)).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  //////LOADING SCREEN /////////
  if (loadingAuth) {
    return (
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          height:         "100vh",
          background:     "#0a0c0f",
          color:          "#c9a84c",
          fontFamily:     "'Cormorant Garamond', serif",
          fontSize:       "24px",
          letterSpacing:  "2px",
        }}
      >
        Loading…
      </div>
    );
  }

  
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">PT</div>
          <div className="sidebar-brand-name">Personal Tracker</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Main</div>
          {NAV_LINKS.map(({ icon, label, path }) => (
            <div
              key={path}
              // "active" highlights this item when we're on its page
              className={`nav-item ${location.pathname === path ? "active" : ""}`}
              // navigate(path) tells React Router to switch pages
              onClick={() => navigate(path)}
              // Show a pointer cursor so it's obvious these are clickable
              style={{ cursor: "pointer" }}
            >
              <span className="nav-icon">{icon}</span> {label}
            </div>
          ))}
        </nav>

        <div className="sidebar-profile">
          {/* Render the Google profile photo if the user signed in with Google,
              otherwise show a generic avatar placeholder */}
          {profilePhoto ? (
            <img
              className="sidebar-avatar"
              src={profilePhoto}
              referrerPolicy="no-referrer" // prevents leaking the current URL to Google
              alt="Profile"
            />
          ) : (
            <div className="sidebar-avatar-placeholder">👤</div>
          )}

          <div className="sidebar-user">
            <div className="sidebar-user-name">{name || "User"}</div>
            <div className="sidebar-user-role">Personal Account</div>
          </div>

          {/* Sign-out icon button */}
          <button
            className="sign-out-button"
            title="Sign Out"
            onClick={handleSignOut}
          >
            ↩
          </button>
        </div>
      </aside>

    
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">
              {name ? `${name}'s` : "Your"} Dashboard
            </div>
            <div className="topbar-subtitle">Personal Finance Overview</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-date">{today}</div>
          </div>
        </div>

     
        <div className="page-body">
          <div className="balance-banner">
            <img
              className="balance-banner-img"
              src={BANNER_IMAGE}
              alt="Finance background"
            />
            {/* Dark gradient overlay so the text is readable over the photo */}
            <div className="balance-banner-overlay" />

            <div className="balance-banner-content">
              <div className="balance-left">
                <div className="bal-label">Net Balance</div>

                {/* The amount changes colour class based on positive/negative value */}
                <div
                  className={`bal-amount ${
                    balance > 0 ? "pos" : balance < 0 ? "neg" : "neu"
                  }`}
                >
                  {/* Show a minus prefix for negative balances */}
                  {balance >= 0 ? fmt(balance) : `- ${fmt(balance)}`}
                </div>

                <div className="bal-sub">
                  {transactions.length} transaction
                  {transactions.length !== 1 ? "s" : ""} recorded
                </div>
              </div>
            </div>
          </div>

   
          <div className="kpi-row">

            {/* Card 1: Total income across all time */}
            <div className="kpi-card">
              <div className="kpi-label">Total Income</div>
              <div className="kpi-value income">{fmt(income)}</div>
            </div>

            {/* Card 2: Total expenses across all time */}
            <div className="kpi-card">
              <div className="kpi-label">Total Expenses</div>
              <div className="kpi-value expense">{fmt(expenses)}</div>
            </div>

            {/* Card 3: Savings rate as a percentage of income */}
            <div className="kpi-card">
              <div className="kpi-label">Savings Rate</div>
              <div className="kpi-value saving">{savingsRate}%</div>
            </div>

            {/* Card 4: Average amount spent per expense transaction */}
            <div className="kpi-card">
              <div className="kpi-label">Avg. Expense</div>
              <div className="kpi-value" style={{ color: "#f0ece4" }}>
                {fmt(avgExpense)}
              </div>
            </div>
          </div>


          <div className="two-col">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Transaction History</div>
                <div className="card-badge">{transactions.length} total</div>
              </div>

              {/* Budget progress bar
                  Green → under 75% used
                  Amber → 75–99% used
                  Red   → 100%+ used (over budget) */}
              <div className="budget-progress" style={{ marginBottom: 24 }}>
                <div className="bp-row">
                  <span>Monthly Budget</span>
                  <span>
                    {fmt(expenses)} / {fmt(MONTHLY_BUDGET)} ({budgetPct}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${
                      budgetPct >= 100 ? "over" : budgetPct >= 75 ? "warn" : ""
                    }`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>

              {/* Filter chips — click to show all / income only / expenses only */}
              <div className="filter-row">
                {["all", "income", "expense"].map((f) => (
                  <button
                    key={f}
                    className={`filter-chip ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Transaction rows */}
              <div className="transactions">
                {filteredTxns.length === 0 ? (
                  // Empty state when there are no matching transactions
                  <div className="empty-state">
                   
                    <p>No transactions found. Add your first one →</p>
                  </div>
                ) : (
                  filteredTxns.map((txn) => (
                    <div key={txn.id} className="transaction-item">

                      {/* Category icon — uses CATEGORY_MAP, falls back to type arrow */}
                      <div className={`tx-icon ${txn.transactionType}`}>
                        {CATEGORY_MAP[txn.category] ||
                          (txn.transactionType === "income" ? "+" : "-")}
                      </div>

                      {/* Description text and category/type label */}
                      <div className="tx-body">
                        <div className="tx-desc">{txn.description}</div>
                        <div className="tx-meta">
                          {txn.category || txn.transactionType} ·{" "}
                          {txn.transactionType}
                        </div>
                      </div>

                      {/* Amount — green for income, red for expense */}
                      <div className={`tx-amount ${txn.transactionType}`}>
                        {txn.transactionType === "income" ? "+" : "-"}
                        {fmt(txn.transactionAmount)}
                      </div>

                  
                      <button
                        className="delete-transaction-button"
                        title="Delete"
                        onClick={() => handleDelete(txn.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: FORM + TIP ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Add Transaction form card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">New Transaction</div>
                </div>

                {/* onSubmit is connected to the form's submit event */}
                <form className="add-transaction" onSubmit={onSubmit}>

                 
                  <div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label>Transaction Type</label>
                    </div>
                    <div className="type-toggle">
                      <button
                        type="button"
                        className={`type-btn ${
                          transactionType === "expense" ? "active-expense" : ""
                        }`}
                        onClick={() => setTransactionType("expense")}
                      >
                        − Expense
                      </button>
                      <button
                        type="button"
                        className={`type-btn ${
                          transactionType === "income" ? "active-income" : ""
                        }`}
                        onClick={() => setTransactionType("income")}
                      >
                        + Income
                      </button>
                    </div>
                  </div>

              
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Grocery run"
                      value={description}
                      required
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                 
                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount (R)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={transactionAmount}
                        min="0"
                        step="0.01"
                        required
                        onChange={(e) => setTransactionAmount(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                     
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {Object.keys(CATEGORY_MAP).map((c) => (
                          <option key={c} value={c}>
                            {CATEGORY_MAP[c]} {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button className="submit-btn" type="submit">
                    Add Transaction
                  </button>
                </form>
              </div>

              <div className="tip-card">
                
                <div>
                  <div className="tip-title">Financial Insight</div>
                  <div className="tip-body">
                    {savingsRate >= 40
                      ? `You're saving ${savingsRate}% of your income — excellent financial discipline.`
                      : income === 0
                      ? "Add your income transactions to start tracking your savings rate."
                      : `Try to save at least 40% of income. Currently at ${savingsRate}%.`}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
