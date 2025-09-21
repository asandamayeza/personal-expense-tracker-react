import { useEffect, useState } from "react";
import {
  query,
  ref,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";
import { db } from "../firebase";
import { useGetUserInfo } from "./useGetUserInfo";

export const useGetTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [transactionTotals, setTransactionTotals] = useState({
    balance: 0.0,
    income: 0.0,
    expenses: 0.0,
  });
  
  const { userID } = useGetUserInfo();

  useEffect(() => {
    if (!userID) return; // Prevent fetching if userID is not yet available

    const transactionCollectionRef = ref(db, "transactions");
    const userTransactionsQuery = query(
      transactionCollectionRef,
      orderByChild("userID"),
      equalTo(userID)
    );

    const unsubscribe = onValue(userTransactionsQuery, (snapshot) => {
      const transactionList = [];
      let totalIncome = 0;
      let totalExpenses = 0;
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          const id = childSnapshot.key;
  
          transactionList.push({ ...data, id });
          
          if (data.transactionType === "expense") {
            totalExpenses += Number(data.transactionAmount);
          } else {
            totalIncome += Number(data.transactionAmount);
          }
        });
      }
      
      setTransactions(transactionList);

      const balance = totalIncome - totalExpenses;
      setTransactionTotals({
        balance,
        expenses: totalExpenses,
        income: totalIncome,
      });
    });

    // Cleanup the listener when the component unmounts or userID changes
    return () => unsubscribe();
  }, [userID]); 

  return { transactions, transactionTotals };
}