import React, { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useAddTransaction } from "../hooks/useAddTransaction.js";
import { useGetTransactions } from "../hooks/useGetTransactions.js";
import { useGetUserInfo } from "../hooks/useGetUserInfo.js";
import { auth, db } from "../firebase.js"; // Added db import
import { ref, remove } from "firebase/database"; // Import remove to delete transaction
import { useNavigate } from "react-router";
import "./home.css";

export default function Home() {
  const { name, profilePhoto, userID, isAuth } = useGetUserInfo(); // will pull users details from the custom hook
  const { transactions, transactionTotals } = useGetTransactions(); // will fetch all transactions and calculate totals
  const { addTransaction } = useAddTransaction(); //gets the function to add a transaction
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState("expense");
  const [loadingAuth, setLoadingAuth] = useState(true);

  const { balance, income, expenses } = transactionTotals; //will deconstruct the total values to be displayed

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      //checks if our user is logged in
      if (!user) {
        console.log("Home: user not logged in, redirect");
        navigate("/");//if not, then will redirect to the login page
      } else {
        console.log("Home: user is:", user.uid);
        setLoadingAuth(false); //removes loading to show the content
      }
    });
    return () => unsub();
  }, [navigate]);

  const onSubmit = (e) => {
    e.preventDefault(); //prevents the default page reload
    console.log("Home onSubmit", { userID, description, transactionAmount, transactionType });
    addTransaction({ description, transactionAmount, transactionType });
    setDescription(""); //clears the form input
    setTransactionAmount("");
  };

  const handleDelete = async (transactionId) => {
    try {
      const transactionRef = ref(db, `transactions/${transactionId}`);
      await remove(transactionRef);
      console.log("Deleted transaction with ID:", transactionId);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  if (loadingAuth) { //will wait for firebase to determine if the user is logged in 
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="expense-tracker">
        <div className="container">
          <h1>{name ? `${name}'s` : "Your"} Expense Tracker</h1>
          <div className="balance">
            <h3>Your Balance</h3>
            {balance >= 0 ? <h2>R{balance}</h2> : <h2>-R{Math.abs(balance)}</h2>}
          </div>
          <div className="summary">
            <div className="income">
              <h4>Income</h4>
              <p>R{income}</p>
            </div>
            <div className="expenses">
              <h4>Expenses</h4>
              <p>R{expenses}</p>
            </div>
          </div>
          <form className="add-transaction" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Description"
              value={description}
              required
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount"
              value={transactionAmount}
              required
              onChange={(e) => setTransactionAmount(e.target.value)}
            />
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="expense"
                  checked={transactionType === "expense"}
                  onChange={(e) => setTransactionType(e.target.value)}
                />
                Expense
              </label>
              <label>
                <input
                  type="radio"
                  value="income"
                  checked={transactionType === "income"}
                  onChange={(e) => setTransactionType(e.target.value)}
                />
                Income
              </label>
            </div>
            <button type="submit">Add Transaction</button>
          </form>
        </div>
        <div className="full-width-container">
          <div className="profile">
            {profilePhoto && (
              <img
                className="profile-photo"
                src={profilePhoto}
                referrerPolicy="no-referrer"
                alt="Profile"
              />
            )}
            <button
              className="sign-out-button"
              onClick={async () => {
                await signOut(auth);
                localStorage.clear();
                navigate("/");
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="transactions">
        <h3>Transactions</h3>
        {transactions.length === 0 ? (
          <p>No transactions found</p>
        ) : (
          <ul>
            {transactions.map((txn) => {
              return (
                <li key={txn.id} className="transaction-item">
                  <h4>{txn.description}</h4>
                  <p
                    style={{
                      color: txn.transactionType === "expense" ? "red" : "green",
                    }}
                  >
                    R{txn.transactionAmount} • {txn.transactionType}
                  </p>
                  <button
                    className="delete-transaction-button"
                    onClick={() => handleDelete(txn.id)}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>

        )}
      </div>
    </>
  );
}
