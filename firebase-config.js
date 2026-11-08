// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Substitua com as chaves do seu novo projeto Gate90 no Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCoPDNQzzka-c65080QzZCarpK7__kFZwQ",
  authDomain: "gate90-f3bbd.firebaseapp.com",
  projectId: "gate90-f3bbd",
  storageBucket: "gate90-f3bbd.firebasestorage.app",
  messagingSenderId: "91212411474",
  appId: "1:91212411474:web:7a7a1a41eb2c09f522658b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, doc, query, orderBy };
