import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

// Setup Firebase app
const firebaseConfig = {
  // Use the project ID from .firebaserc -> sakuchile
  projectId: "sakuchile",
  // We can just use the admin sdk or standard sdk. Wait, standard sdk needs config.
  // Actually, wait, let me just check the exact documents.
};
