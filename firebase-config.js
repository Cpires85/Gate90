// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Substitua com as chaves do seu novo projeto Gate90 no Firebase Console
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "gate90-app.firebaseapp.com",
  projectId: "gate90-app",
  storageBucket: "gate90-app.appspot.com",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, doc, query, orderBy };
