// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1VVksznSKbY9KvPi7a0j2eCaHYvLWJlw",
  authDomain: "test1-dffa8.firebaseapp.com",
  projectId: "test1-dffa8",
  storageBucket: "test1-dffa8.firebasestorage.app",
  messagingSenderId: "770025548263",
  appId: "1:770025548263:web:6e012dc37f27d2a36b3542",
  measurementId: "G-R48TXD0M6M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)