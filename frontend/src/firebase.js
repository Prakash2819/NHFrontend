import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQVYUgUWhb1ZT6WNyIYynOveZ6dx56rzU",
  authDomain: "nammhospitals.firebaseapp.com",
  projectId: "nammhospitals",
  storageBucket: "nammhospitals.firebasestorage.app",
  messagingSenderId: "232395470692",
  appId: "1:232395470692:web:6b677d6abd95db93e52c71",
  measurementId: "G-Y4B32LKPLE"
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);


if (window.location.hostname === "localhost") {
  auth.settings.appVerificationDisabledForTesting = true;
}