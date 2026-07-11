document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. CARREGAR NOME DO PSICÓLOGO
    // ==========================================
    // Puxa os dados que foram salvos durante o login
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // Se o usuário existir, injeta o nome no menu lateral
    if (usuarioLogado && usuarioLogado.nome) {
        document.getElementById('nomeProfissional').innerText = usuarioLogado.nome;
    } else {
        // Se por acaso alguém tentar acessar a página direto sem logar, joga pro login
        window.location.href = "../index.html";
    }

    // ==========================================
    // 2. LÓGICA DAS ABAS (DASHBOARD)
    // ==========================================
    const menuButtons = document.querySelectorAll(".menu-btn[data-target]");
    const tabContents = document.querySelectorAll(".tab-content");

    menuButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove a classe 'active' de todos
            menuButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(tab => tab.classList.remove("active"));

            // Adiciona a classe 'active' no clicado
            button.classList.add("active");

            // Mostra a aba correspondente
            const targetId = button.getAttribute("data-target");
            document.getElementById(targetId).classList.add("active");
        });
    });

    // ==========================================
    // 3. LOGOUT (SAIR DO SISTEMA)
    // ==========================================
    document.getElementById("btnSair").addEventListener("click", () => {
        // Apaga os dados do usuário da memória do navegador por segurança
        localStorage.removeItem('usuarioLogado');
        
        // Redireciona para a tela inicial de login
        window.location.href = "../index.html";
    });
});


// 1. Geração de Link do Google Meet
function gerarLinkMeet() {
    return "https://meet.google.com/new"; // Link padrão para criar nova sala
}

// 2. Renderizar Agenda de Hoje
async function renderizarAgendaHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    const container = document.getElementById('lista-agenda-hoje');
    container.innerHTML = '';
    
    // Filtra sessões de todos os pacientes
    todosPacientes.forEach(pac => {
        pac.sessoes_previstas.forEach(s => {
            if(s.data === hoje) {
                container.innerHTML += `
                    <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee;">
                        <span>${pac.nome} - ${s.horario}</span>
                        <button class="meet-btn" onclick="window.open('${gerarLinkMeet()}', '_blank')">Videochamada</button>
                    </div>
                `;
            }
        });
    });
}

// 3. Gráfico Financeiro (Chart.js)
function renderizarGrafico() {
    const ctx = document.getElementById('chartFinanceiro').getContext('2d');
    let totalPago = 0, totalPendente = 0;
    
    todosPacientes.forEach(pac => {
        (pac.sessoes_previstas || []).forEach(s => {
            if(s.status_pagamento === 'Pago') totalPago += s.valor;
            else totalPendente += s.valor;
        });
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Recebido', 'Pendente'],
            datasets: [{ data: [totalPago, totalPendente], backgroundColor: ['#22c55e', '#ef4444'] }]
        }
    });
}

// 4. Inteligência Artificial (Simulação de Análise)
async function executarAnaliseIA() {
    const div = document.getElementById('resultado-ia');
    div.innerHTML = "Analisando prontuários e protocolos via IA...";
    
    // Aqui seria a chamada para sua API (Ex: Gemini/OpenAI)
    setTimeout(() => {
        div.innerHTML = `
            <div class="analise-item">
                <strong>Sugestão da IA:</strong> O paciente X mostrou melhora nos índices de ansiedade segundo o teste Y aplicado ontem. Recomenda-se focar na técnica de respiração na próxima sessão.
            </div>
        `;
    }, 2000);
}

// Adicione estas chamadas no seu carregarPacientes():
// renderizarAgendaHoje();
// renderizarGrafico();