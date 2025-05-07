import { initializeApp } from "firebase/app";
import { FIREBASE_KEY } from "@env";

const firebaseConfig = {
    apiKey: FIREBASE_KEY,
    authDomain: "recipeapp-9c6d8.firebaseapp.com",
    projectId: "recipeapp-9c6d8",
    storageBucket: "recipeapp-9c6d8.firebasestorage.app",
    messagingSenderId: "18864963835",
    appId: "1:18864963835:web:90928ab2ee84c9bbd8b05e",
    measurementId: "G-J4D64YTGGH"
  };
  
export const firebaseApp = initializeApp(firebaseConfig);