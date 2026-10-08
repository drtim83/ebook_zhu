import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-0QotD50ahlXgmCpBsqY1GFi4uJKQpw8",
  authDomain: "ebookzhu.firebaseapp.com",
  projectId: "ebookzhu",
  storageBucket: "ebookzhu.firebasestorage.app",
  messagingSenderId: "771939036989",
  appId: "1:771939036989:web:f664de749ded4d4cbb5f54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const testRef = doc(db, "_test_probe", "probe");
    await setDoc(testRef, { test: true, time: new Date().toISOString() });
    console.log("Firestore write OK!");
    const snap = await getDoc(testRef);
    console.log("Firestore read OK! Data:", snap.data());
    await deleteDoc(testRef);
    console.log("Firestore cleanup OK!");
  } catch (err) {
    console.error("Firestore error:", err.code, err.message);
  }
}
test();
