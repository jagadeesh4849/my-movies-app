// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5aKxk-8cr0V8g7QseG8m3esiHTNz-fms",
  authDomain: "my-movies-833c3.firebaseapp.com",
  projectId: "my-movies-833c3",
  storageBucket: "my-movies-833c3.firebasestorage.app",
  messagingSenderId: "1058622959592",
  appId: "1:1058622959592:web:f3b9b14c19465a7d577e5d",
  measurementId: "G-2GQ656PPS6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get or create user ID
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}
