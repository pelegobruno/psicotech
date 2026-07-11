import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('mensagem-erro');

    msgErro.style.display = 'none';

    try {
        const credencial = await signInWithEmailAndPassword(auth, email, senha);
        const user = credencial.user;

        const docSnap = await getDoc(doc(db, "usuarios", user.uid));

        if (docSnap.exists()) {
            const dadosUsuario = docSnap.data();

            if (dadosUsuario.bloqueado === true && !dadosUsuario.isento_mensalidade) {
                msgErro.innerText = "Acesso bloqueado ou Trial Expirado. Contate o suporte.";
                msgErro.style.display = 'block';
                await auth.signOut(); 
                return;
            }

            // SALVAMOS A ISENÇÃO AQUI PARA O PAINEL LER INSTANTANEAMENTE
            localStorage.setItem('usuarioLogado', JSON.stringify({ 
                id: user.uid, 
                nome: dadosUsuario.nome,
                email: dadosUsuario.email,
                crp: dadosUsuario.crp || "Não Cadastrado", 
                isAdmin: dadosUsuario.isAdmin || false,
                isento: dadosUsuario.isento_mensalidade || false
            }));
            
            if (dadosUsuario.isAdmin === true || dadosUsuario.email === 'admin@admin.com') {
                window.location.href = 'views/admin.html';
            } else {
                if (!dadosUsuario.isento_mensalidade) {
                    const dataHoje = new Date();
                    dataHoje.setHours(0,0,0,0);
                    const dataVencimento = new Date(dadosUsuario.data_vencimento || dadosUsuario.data_cadastro);
                    dataVencimento.setHours(0,0,0,0);

                    if (dataHoje > dataVencimento || dadosUsuario.status_assinatura === "inativo") {
                        msgErro.innerText = "Período de teste expirado. Regularize sua assinatura.";
                        msgErro.style.display = 'block';
                        await auth.signOut();
                        return;
                    }
                }
                window.location.href = 'views/psicologo.html';
            }

        } else {
            msgErro.innerText = "Cadastro não encontrado.";
            msgErro.style.display = 'block';
        }

    } catch (error) {
        console.error("Erro no login:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
            msgErro.innerText = "E-mail ou senha incorretos.";
        } else {
            msgErro.innerText = "Erro ao conectar com o sistema.";
        }
        msgErro.style.display = 'block';
    }
});

// MODAL DE RECUPERAR SENHA
window.abrirModalRecuperar = () => {
    document.getElementById('modalRecuperarSenha').style.display = 'flex';
    const emailLogin = document.getElementById('email').value;
    if(emailLogin) { document.getElementById('emailRecuperacao').value = emailLogin; }
};

window.enviarEmailRecuperacao = async () => {
    const email = document.getElementById('emailRecuperacao').value;
    if (!email) { alert("Por favor, digite o e-mail da sua conta profissional."); return; }
    
    try {
        await sendPasswordResetEmail(auth, email);
        alert("E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada e sua pasta de spam.");
        document.getElementById('modalRecuperarSenha').style.display = 'none';
    } catch (error) {
        if (error.code === 'auth/user-not-found') { alert("Não encontramos nenhuma conta vinculada a este e-mail."); } 
        else if (error.code === 'auth/invalid-email') { alert("Formato de e-mail inválido. Verifique a digitação."); } 
        else { alert("Ocorreu um erro ao enviar o e-mail. Tente novamente."); }
    }
};