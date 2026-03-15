// ✅ Correct version
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "nightsafe.firebaseapp.com",
  databaseURL: "https://nightsafe1212-default-rtdb.asia-southeast1.firebasedatabase.app/", // ✅ Root only
  projectId: "nightsafe",
  storageBucket: "nightsafe.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
