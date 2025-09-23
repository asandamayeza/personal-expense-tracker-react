// hooks/useAddTransaction.js

import { push, ref, serverTimestamp } from "firebase/database";
import { db, auth } from "../firebase.js";
import { useGetUserInfo } from "./useGetUserInfo.js";

export const useAddTransaction = () => {
  const { userID } = useGetUserInfo();

  const addTransaction = async ({
    description,
    transactionAmount,
    transactionType,
  }) => {
    try {
      // check userID
      const uid = userID || (auth.currentUser && auth.currentUser.uid);
      console.log("addTransaction: userID =", uid);

      if (!uid) {
        console.error("addTransaction: No userID, transaction not added");
        return;
      }

      if (!description || description.trim() === "") {
        console.error("addTransaction: Description empty");
        return;
      }

      if (!transactionAmount || isNaN(transactionAmount) || Number(transactionAmount) <= 0) {
        console.error("addTransaction: Invalid amount:", transactionAmount);
        return;
      }

      const transactionData = {
        userID: uid,
        description: description.trim(),
        transactionAmount: Number(transactionAmount),
        transactionType,
        createdAt: serverTimestamp(),
      };

      console.log("addTransaction: pushing data:", transactionData);
      const transactionsRef = ref(db, "transactions");
      await push(transactionsRef, transactionData);
      console.log("addTransaction: push succeeded");
    } catch (error) {
      console.error("addTransaction: error:", error.message);
    }
  };

  return { addTransaction };
};

