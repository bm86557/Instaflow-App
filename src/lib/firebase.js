// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, 
         signInWithEmailAndPassword, signOut, 
         onAuthStateChanged, 
         sendPasswordResetEmail} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "instaflow-aautomation.firebaseapp.com",
  projectId: "instaflow-aautomation",
  storageBucket: "instaflow-aautomation.firebasestorage.app",
  messagingSenderId: "655022333170",
  appId: "1:655022333170:web:b737d2ec71a7e22d12c46b",
  measurementId: "G-VP8SVQS7V4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);

export const registerUser = async(email,password) =>{
  try {
    const userCredentials = await createUserWithEmailAndPassword(auth,email,password);
    return {success: true,user: userCredentials.user}
  } catch (error) {
    return { success: false, error: error.code, message: error.message }
  }
};
export const loginUser = async(email,password) =>{
  try {
     const userCredentials = await signInWithEmailAndPassword(auth,email,password);
     return {success: true ,user: userCredentials.user};
  } catch (error) {
    return { success: false, error: error.code, message: error.message }
  }
};
export const logoutUser = async() => {
  try {
    await signOut(auth);
    return {success: true};
  } catch (error) {
    return {success:false, error: error.message};
  }
};
export const resetPassword = async(email) =>{
try {
  await sendPasswordResetEmail(auth,email);
  return {success: true}
} catch (error) {
  return {success:false, error: error.message};
}
};