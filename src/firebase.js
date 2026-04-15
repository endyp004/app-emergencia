import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Reemplaza con tus credenciales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCodAOaHqWpxVA2AALfZUBxAWMO3fpfZ58",
  authDomain: "aplicacion-de-emergencia.firebaseapp.com",
  projectId: "aplicacion-de-emergencia",
  storageBucket: "aplicacion-de-emergencia.firebasestorage.app",
  messagingSenderId: "31851441287",
  appId: "1:31851441287:web:21b17de1df2d07dd48dc22"
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
