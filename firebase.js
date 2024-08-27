// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC28ROuJdm864XE_qVDUZkiuh3inCAtAVw",
  authDomain: "myapp-e3798.firebaseapp.com",
  projectId: "myapp-e3798",
  storageBucket: "myapp-e3798.appspot.com",
  messagingSenderId: "892804356758",
  appId: "1:892804356758:web:df1059838cbd64c05fc0b7",
  measurementId: "G-92JF7987X0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)