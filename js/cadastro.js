import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Captura dos elementos do formulário
    const nome = document.getElementById('nome').value;
    const profissao = document.getElementById('profissao').value; // CAPTURA A NOVA OPÇÃO
    const crp = document.getElementById('crp').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    // Elementos de feedback visual
    const msgErro = document.getElementById('mensagem-erro');
    const msgAviso = document.getElementById('mensagem-aviso');

    // Reseta estados visuais
    msgErro.style.display = 'none';
    msgAviso.style.display = 'none';

    // Validação extra caso o usuário consiga pular o 'required' do select
    if (!profissao) {
        msgErro.innerText = "Por favor, selecione sua área de atuação.";
        msgErro.style.display = 'block';
        return;
    }

    try {
        // 1. Cria o usuário no Firebase Authentication
        const credencial = await createUserWithEmailAndPassword(auth, email, senha);
        const user = credencial.user;

        // 2. Calcula data de vencimento (acesso inicial)
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 30);
        const dataFormatada = dataVencimento.toISOString().split('T')[0];

        // 3. Salva os dados no Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: nome,
            profissao: profissao, // SALVA A PROFISSÃO NO BANCO
            crp: crp, 
            email: email,
            senha_acesso: senha, 
            perfil: "profissional", 
            status_assinatura: "ativo",
            data_vencimento: dataFormatada,
            data_cadastro: new Date().toISOString(),
            isAdmin: false, 
            bloqueado: false,
            isento_mensalidade: false,
            faturas_sistema: [] 
        });

        msgAviso.innerText = "Cadastro realizado com sucesso! Redirecionando...";
        msgAviso.style.display = 'block';

        // Redireciona após 2 segundos
        setTimeout(() => { 
            window.location.href = '../index.html'; 
        }, 2000);

    } catch (error) {
        console.error("Erro no cadastro:", error);
        
        // Tratamento de erros amigável
        if (error.code === 'auth/email-already-in-use') {
            msgErro.innerText = "Este e-mail já está sendo utilizado.";
        } else if (error.code === 'auth/weak-password') {
            msgErro.innerText = "A senha deve conter pelo menos 6 caracteres.";
        } else if (error.code === 'auth/invalid-email') {
            msgErro.innerText = "O e-mail digitado é inválido.";
        } else {
            msgErro.innerText = "Erro ao realizar o cadastro. Tente novamente.";
        }
        msgErro.style.display = 'block';
    }
});