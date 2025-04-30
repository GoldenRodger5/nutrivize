// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks",
  authDomain: "food-tracker-6096d.firebaseapp.com",
  projectId: "food-tracker-6096d",
  storageBucket: "food-tracker-6096d.firebasestorage.app",
  messagingSenderId: "215135700985",
  appId: "1:215135700985:web:bfb71581010bcaab6c5f28",
  measurementId: "G-YVF1LWD3JJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut }; 