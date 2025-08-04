// config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDehhakBc2VoD1IJYaJwTHZyjNf_G7kR8o",
  authDomain: "tiemporealusa.firebaseapp.com",
  projectId: "tiemporealusa",
  storageBucket: "tiemporealusa.appspot.com",
  messagingSenderId: "866605290585",
  appId: "1:866605290585:web:72ba19242b11b9ca0f4d48"
};

// Solo inicializar una vez
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, update, set };
