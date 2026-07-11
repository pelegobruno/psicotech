import { db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. SEGURANÇA E INICIALIZAÇÃO
// ==========================================
const adminLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

document.addEventListener('DOMContentLoaded', async () => {
    if (!adminLogado || adminLogado.email !== 'admin@admin.com') {
        window.location.href = '../index.html';
        return;
    }

    injetarModaisAdmin();
    configurarNavegacao();
    await carregarDadosPlataforma();
});

let dadosGlobais = { psicologos: [] };

// ==========================================
// 2. NAVEGAÇÃO DAS ABAS
// ==========================================
function configurarNavegacao() {
    const botoesMenu = document.querySelectorAll('.sidebar-menu .menu-btn');
    const conteudosAba = document.querySelectorAll('.tab-content');

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesMenu.forEach(b => b.classList.remove('active'));
            conteudosAba.forEach(c => c.classList.remove('active'));
            
            botao.classList.add('active');
            const targetId = botao.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const btnSair = document.getElementById('btnSairAdmin');
    if(btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '../index.html';
        });
    }
}

// ==========================================
// 3. SISTEMA DE MODAIS
// ==========================================
function injetarModaisAdmin() {
    const container = document.getElementById('containerModaisAdmin');
    if(!container) return;

    container.innerHTML = `
        <div id="modalAdminCustom" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); justify-content: center; align-items: center; z-index: 9999;">
            <div class="modal-card" style="background: var(--bg-panel); border: 1px solid var(--border-color); padding: 30px; border-radius: 12px; width: 90%; max-width: 450px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <h3 id="modalAdminTitulo" style="color: var(--text-main); margin: 0; font-size: 20px;">Ação</h3>
                    <button onclick="window.fecharModalAdmin()" style="background:none; border:none; cursor:pointer; font-size:24px; color:var(--text-muted);">&times;</button>
                </div>
                <div id="modalAdminBody" style="color: var(--text-muted); font-size: 15px; line-height: 1.6;"></div>
            </div>
        </div>
    `;
}

window.abrirModalAdmin = (titulo, htmlContent) => {
    document.getElementById('modalAdminTitulo').innerText = titulo;
    document.getElementById('modalAdminBody').innerHTML = htmlContent;
    document.getElementById('modalAdminCustom').style.display = 'flex';
};

window.fecharModalAdmin = () => { document.getElementById('modalAdminCustom').style.display = 'none'; };

// ==========================================
// 4. LÓGICA DE DADOS (KPIs e Tabela)
// ==========================================
window.filtrarTabela = () => {
    const termo = document.getElementById('buscaPsi').value.toLowerCase();
    document.querySelectorAll('.table-row').forEach(linha => {
        linha.style.display = linha.innerText.toLowerCase().includes(termo) ? 'flex' : 'none';
    });
};

async function carregarDadosPlataforma() {
    try {
        const snap = await getDocs(collection(db, "usuarios"));
        dadosGlobais.psicologos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        atualizarKPIs();
        await renderizarTabelaPsicologos();
    } catch (error) { console.error("Erro carregamento:", error); }
}

function atualizarKPIs() {
    let recebido = 0, pendente = 0;
    const psicologosReais = dadosGlobais.psicologos.filter(p => p.email !== 'admin@admin.com');
    
    psicologosReais.forEach(psi => {
        (psi.faturas_sistema || []).forEach(fat => {
            const valor = parseFloat(fat.valor) || 0;
            if(fat.status === 'Pago') recebido += valor;
            if(fat.status === 'Pendente') pendente += valor;
        });
    });
    
    const elKpiPsi = document.getElementById('kpi_psicologos');
    const elKpiRec = document.getElementById('kpi_recebido');
    const elKpiPen = document.getElementById('kpi_pendente');
    
    if(elKpiPsi) elKpiPsi.innerText = psicologosReais.length;
    if(elKpiRec) elKpiRec.innerText = `R$ ${recebido.toFixed(2)}`;
    if(elKpiPen) elKpiPen.innerText = `R$ ${pendente.toFixed(2)}`;
}

async function renderizarTabelaPsicologos() {
    const container = document.getElementById('tabela_corpo');
    if(!container) return;
    container.innerHTML = '';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const psi of dadosGlobais.psicologos) {
        if(psi.email === 'admin@admin.com') continue;

        let statusFin = '';
        
        // Agora o acesso visual respeita fielmente se está bloqueado no banco ou não
        let statusAcesso = psi.bloqueado ? `<span class="badge-bloqueado">BLOQUEADO</span>` : `<span class="badge-ativo">ATIVO</span>`;
        let mensalidade = psi.isento_mensalidade ? 'Isento' : 'R$ 95,90';

        const pends = (psi.faturas_sistema || []).filter(f => f.status === 'Pendente');
        const dataVencimento = new Date(psi.data_vencimento || psi.data_cadastro || hoje);
        dataVencimento.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));

        // Define apenas o que está aparecendo na coluna de "Financeiro"
        if (psi.isento_mensalidade) {
            statusFin = `<span class="text-isento">ISENTO</span>`;
        } 
        else if (pends.length > 0) {
            statusFin = `<span class="text-pendente">${pends.length} pendente(s)</span>`;
        } 
        else if (diffDays >= 0) {
            statusFin = `<span class="text-trial">TRIAL (${diffDays} dias)</span>`;
        } 
        else {
            statusFin = `<span class="text-expirado">EXPIRADO</span>`;
        }

        container.innerHTML += `
            <div class="table-row">
                <div style="width:30%;">
                    <strong style="color:var(--text-main); display:block; font-size:14px; margin-bottom:2px;">${psi.nome || 'Sem nome'}</strong>
                    <span style="font-size:12px; color:var(--text-muted);">${psi.email}</span>
                </div>
                <div style="width:15%; text-align:center;">${statusAcesso}</div>
                <div style="width:20%; text-align:center; color:var(--text-muted); font-size:13px;">${mensalidade}</div>
                <div style="width:15%; text-align:center;">${statusFin}</div>
                <div style="width:20%; text-align:right;">
                    <button class="btn-action btn-cobrar" onclick="window.gerarFatura('${psi.id}')">Cobrar</button>
                    <button class="btn-action btn-historico" onclick="window.abrirConfigPsi('${psi.id}')">Histórico</button>
                </div>
            </div>
        `;
    }
}

// ==========================================
// 5. AÇÕES DOS BOTÕES E MODAIS
// ==========================================
window.abrirConfigPsi = (psiId) => {
    const psi = dadosGlobais.psicologos.find(p => p.id === psiId);
    
    const senhaInfo = psi.senha_acesso 
        ? `<div style="background:rgba(239, 68, 68, 0.1); border:1px solid var(--red-border); padding:10px; border-radius:6px; margin-bottom:15px; color:var(--red-text); font-size:14px; text-align:center;">
            Senha do usuário: <strong>${psi.senha_acesso}</strong>
           </div>` 
        : `<div style="background:rgba(255,255,255,0.05); border:1px solid var(--border-color); padding:10px; border-radius:6px; margin-bottom:15px; color:var(--text-muted); font-size:13px; text-align:center;">
            Senha não registrada no banco.
           </div>`;

    let faturasHtml = (psi.faturas_sistema || []).map((f, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-color); font-size:13px;">
            <div><strong style="color:var(--text-main);">${f.mes_referencia}</strong><br>R$ ${parseFloat(f.valor).toFixed(2)} - <span style="color:${f.status === 'Pago' ? 'var(--green-text)' : 'var(--red-text)'}; font-weight:bold;">${f.status}</span></div>
            <div style="display:flex; gap:5px;">
                ${f.status === 'Pendente' ? `<button onclick="window.marcarPaga('${psi.id}', ${i})" style="background:#10b981; color:white; border:none; padding:6px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">Receber</button>` : ''}
                <button onclick="window.confirmarExclusao('${psi.id}', ${i})" style="background:#ef4444; color:white; border:none; padding:6px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">Excluir</button>
            </div>
        </div>
    `).join('');

    window.abrirModalAdmin("Gerenciar: " + psi.nome, `
        <div style="display:flex; flex-direction:column; gap:12px;">
            ${senhaInfo}
            
            <button onclick="window.toggleBloqueio('${psi.id}', ${!psi.bloqueado})" style="padding:12px; border-radius:6px; border:none; font-weight:bold; cursor:pointer; background:${psi.bloqueado ? '#10b981' : '#ef4444'}; color:white;">
                ${psi.bloqueado ? '✅ Desbloquear Acesso' : '🚫 Bloquear Acesso'}
            </button>

            <button onclick="window.toggleIsencao('${psi.id}', ${!psi.isento_mensalidade})" style="padding:12px; border-radius:6px; border:none; font-weight:bold; cursor:pointer; background:var(--border-color); color:var(--text-main);">
                ${psi.isento_mensalidade ? 'Remover Isenção Permanente' : '🌟 Conceder Isenção Permanente'}
            </button>
            
            <div style="max-height: 250px; overflow-y: auto; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">
                <h4 style="color:var(--text-main); margin-bottom:10px;">Histórico de Faturas</h4>
                ${faturasHtml || '<p style="color:var(--text-muted); font-size:13px;">Nenhuma fatura gerada.</p>'}
            </div>
        </div>
    `);
};

window.confirmarExclusao = (psiId, index) => {
    window.abrirModalAdmin("Confirmar Exclusão", `
        <p style="color:var(--text-muted); margin-bottom:20px;">Deseja remover esta fatura definitivamente?</p>
        <div style="display:flex; gap:10px;">
            <button onclick="window.fecharModalAdmin()" style="flex:1; padding:12px; background:var(--border-color); color:var(--text-main); border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Cancelar</button>
            <button onclick="window.excluirFatura('${psiId}', ${index})" style="flex:1; padding:12px; background:#ef4444; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Sim, Excluir</button>
        </div>
    `);
};

window.gerarFatura = async (psiId) => {
    const psi = dadosGlobais.psicologos.find(p => p.id === psiId);
    let faturas = psi.faturas_sistema || [];
    faturas.push({ id: Math.random().toString(), mes_referencia: new Date().toLocaleDateString('pt-BR', {month:'long', year:'numeric'}).toUpperCase(), valor: 95.90, status: 'Pendente' });
    await updateDoc(doc(db, "usuarios", psiId), { faturas_sistema: faturas });
    carregarDadosPlataforma(); window.fecharModalAdmin();
};

window.excluirFatura = async (psiId, index) => {
    const psi = dadosGlobais.psicologos.find(p => p.id === psiId);
    psi.faturas_sistema.splice(index, 1);
    await updateDoc(doc(db, "usuarios", psiId), { faturas_sistema: psi.faturas_sistema });
    carregarDadosPlataforma(); window.fecharModalAdmin();
};

window.marcarPaga = async (psiId, index) => {
    const psi = dadosGlobais.psicologos.find(p => p.id === psiId);
    psi.faturas_sistema[index].status = 'Pago';
    await updateDoc(doc(db, "usuarios", psiId), { faturas_sistema: psi.faturas_sistema });
    carregarDadosPlataforma(); window.fecharModalAdmin();
};

window.toggleBloqueio = async (id, bloqueado) => {
    let dadosUpdate = { bloqueado };
    
    // Se o gestor está DESBLOQUEANDO, damos +7 dias na data de vencimento do usuário 
    // para garantir que ele não fique preso pela data expirada ao tentar logar.
    if (!bloqueado) {
        const novaDataVencimento = new Date();
        novaDataVencimento.setDate(novaDataVencimento.getDate() + 7);
        dadosUpdate.data_vencimento = novaDataVencimento.toISOString().split('T')[0];
    }

    await updateDoc(doc(db, "usuarios", id), dadosUpdate);
    carregarDadosPlataforma(); window.fecharModalAdmin();
};

window.toggleIsencao = async (id, isento) => {
    let dadosUpdate = { isento_mensalidade: isento };
    if (isento) dadosUpdate.bloqueado = false;
    await updateDoc(doc(db, "usuarios", id), dadosUpdate);
    carregarDadosPlataforma(); window.fecharModalAdmin();
};