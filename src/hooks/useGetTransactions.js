// hooks/useGetTransactions.js

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useGetUserInfo } from "./useGetUserInfo";

export const useGetTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [transactionTotals, setTransactionTotals] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });

  const { userID } = useGetUserInfo();

  useEffect(() => {
    console.log("useGetTransactions: userID = ", userID);
    if (!userID) {
      console.log("useGetTransactions: waiting for userID");
      return;
    }

    const transactionsRef = ref(db, "transactions");
    const listener = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("useGetTransactions: snapshot data:", data);

      const tList = [];
      let incomeSum = 0;
      let expenseSum = 0;

      if (data) {
        Object.entries(data).forEach(([key, txn]) => {
          console.log("Checking txn:", key, txn);

          if (txn && txn.userID === userID) {
            console.log("Matches userID:", key);

            const amount = parseFloat(txn.transactionAmount) || 0;
            tList.push({
              id: key,
              description: txn.description,
              transactionType: txn.transactionType,
              transactionAmount: amount,
              createdAt: txn.createdAt,
            });

            if (txn.transactionType === "expense") {
              expenseSum += amount;
            } else {
              incomeSum += amount;
            }
          }
        });
      } else {
        console.log("No transactions data at path");
      }

      const balance = incomeSum - expenseSum;
      console.log("Computed totals:", { incomeSum, expenseSum, balance });

      setTransactions(tList);
      setTransactionTotals({
        balance,
        income: incomeSum,
        expenses: expenseSum,
      });
    }, (error) => {
      console.error("useGetTransactions error:", error);
    });

    return () => {
      listener(); // unsubscribe
    };
  }, [userID]);

  return { transactions, transactionTotals };
};

