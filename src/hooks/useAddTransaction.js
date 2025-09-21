import { push, ref, serverTimestamp } from "firebase/database";
import { db } from "../firebase.js";
import { useGetUserInfo } from "./useGetUserInfo.js";

export const useAddTransaction = () => {
  const transactionCollectionRef = ref(db, "transactions");
  const { userID } = useGetUserInfo();
  const addTransaction = async ({
    description,
    transactionAmount,
    transactionType,
  }) => {
    await push(transactionCollectionRef, {
      userID,
      description,
      transactionAmount,
      transactionType,
      createdAt: serverTimestamp(),
    });
  };
  return { addTransaction };
};