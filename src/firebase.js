import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Reemplaza con tus credenciales de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/* 
  Para este prototipo, puedes suscribirte a cambios en las camas así:
  
  import { ref, onValue } from "firebase/database";
  
  const hospitalRef = ref(db, 'hospitals/ney-arias');
  onValue(hospitalRef, (snapshot) => {
    const data = snapshot.val();
    // Actualizar UI con data.beds.available
  });
*/
