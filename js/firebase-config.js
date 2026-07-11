// Importando o Firebase diretamente via CDN para o navegador
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Suas novas credenciais do projeto psico-saas-d5175
const firebaseConfig = {
  apiKey: "AIzaSyBbEZ9-mSwS4YCDuGaEz4HGddehcPSmQZY",
  authDomain: "psico-saas-d5175.firebaseapp.com",
  projectId: "psico-saas-d5175",
  storageBucket: "psico-saas-d5175.firebasestorage.app",
  messagingSenderId: "112635370100",
  appId: "1:112635370100:web:83d5efcc217d87f5cb8f21"
};

// Inicializando os serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportando para usarmos nas telas de login, cadastro e painel
export { auth, db };