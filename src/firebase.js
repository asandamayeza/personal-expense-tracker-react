import { initializeApp } from "firebase/app";
import {getDatabase} from "firebase/database";
import {getAuth, GoogleAuthProvider} from "firebase/auth"; //get authen, then get google authen




const firebaseConfig = {
  apiKey: "AIzaSyCKAw2TcafVGHY98FRk7OAt4KOiJIO7Abs",
  authDomain: "personal-finance-tracker-17ba7.firebaseapp.com",
  projectId: "personal-finance-tracker-17ba7",
  storageBucket: "personal-finance-tracker-17ba7.firebasestorage.app",
  messagingSenderId: "432517004607",
  appId: "1:432517004607:web:52a96d2e752ee19c56678a",
  measurementId: "G-V0E0KJJV27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth()

//firebase login
//firebase init
//firebase deploy
